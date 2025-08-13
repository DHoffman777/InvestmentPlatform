import { randomUUID } from 'crypto';
import { Form13F, FilingStatus, RegulatoryFiling, FormType, RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface Form13FPreparationData {
  tenantId: string;
  managerName: string;
  managerCIK: string;
  reportingPeriodEnd: Date;
  isAmendment?: boolean;
  amendmentNumber?: number;
  holdings: Array<{
    nameOfIssuer: string;
    titleOfClass: string;
    cusip: string;
    marketValue: number;
    sharesOrPrincipalAmount: {
      sharesNumber?: number;
      principalAmount?: number;
      sharesOrPrincipal: 'SH' | 'PRN';
    };
    investmentDiscretion: 'SOLE' | 'SHARED' | 'NONE';
    otherManager?: string;
    votingAuthority: {
      sole: number;
      shared: number;
      none: number;
    };
  }>;
  otherManagers?: Array<{
    managerName: string;
    managerCIK: string;
    formTypeCode: string;
  }>;
  confidentialTreatmentRequests?: Array<{
    nameOfIssuer: string;
    titleOfClass: string;
    reasonForConfidentiality: string;
  }>;
}

interface Form13FValidationResult {
  isValid: boolean;
  errors: Array<{
    section: string;
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    section: string;
    field: string;
    message: string;
  }>;
  summary: {
    totalHoldings: number;
    totalValue: number;
    reportingThresholdMet: boolean;
    duplicateHoldings: number;
    missingCUSIPs: number;
  };
  completionPercentage: number;
}

interface Form13FFilingOptions {
  testFiling: boolean;
  expeditedProcessing: boolean;
  confirmationRequired: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    description: string;
  }>;
}

interface SECForm13FResponse {
  success: boolean;
  confirmationNumber?: string;
  submissionId?: string;
  errors?: string[];
  warnings?: string[];
  processingTime?: number;
}

interface HoldingAnalysis {
  cusip: string;
  issuerName: string;
  titleOfClass: string;
  totalValue: number;
  totalShares: number;
  managersReporting: number;
  concentrationRisk: number;
  votingPower: {
    soleVoting: number;
    sharedVoting: number;
    noVoting: number;
  };
}

export class Form13FService {
  private eventPublisher: EventPublisher;
  private forms: Map<string, Form13F> = new Map();
  private filings: Map<string, RegulatoryFiling> = new Map();

  // 13F reporting threshold ($100M minimum)
  private readonly REPORTING_THRESHOLD = 100000000;

  constructor() {
    this.eventPublisher = new EventPublisher();
  }

  async prepareForm13F(data: Form13FPreparationData): Promise<Form13F> {
    try {
      logger.info('Preparing Form 13F', {
        tenantId: data.tenantId,
        managerName: data.managerName,
        reportingPeriodEnd: data.reportingPeriodEnd,
        holdingsCount: data.holdings.length
      });

      const formId = randomUUID();
      
      // Calculate total portfolio value
      const totalValue = data.holdings.reduce((sum, holding) => sum + holding.marketValue, 0);
      
      const form13F: Form13F = {
        id: formId,
        tenantId: data.tenantId,
        managerName: data.managerName,
        managerCIK: data.managerCIK,
        reportingPeriodEnd: data.reportingPeriodEnd,
        filingDate: new Date(),
        amendmentNumber: data.amendmentNumber,
        isAmendment: data.isAmendment || false,
        
        coverPage: {
          managerName: data.managerName,
          formTypeCode: '13F-HR',
          tableEntryTotal: data.holdings.length,
          tableValueTotal: Math.round(totalValue / 1000), // Convert to thousands
          isConfidentialOmitted: Boolean(data.confidentialTreatmentRequests?.length),
          providesAdditionalInfo: Boolean(data.otherManagers?.length || data.confidentialTreatmentRequests?.length)
        },
        
        summary: {
          otherIncludedManagers: data.otherManagers || [],
          totalValuePortfolio: Math.round(totalValue / 1000), // In thousands
          totalNumberOfHoldings: data.holdings.length
        },
        
        holdings: data.holdings.map(holding => ({
          nameOfIssuer: holding.nameOfIssuer,
          titleOfClass: holding.titleOfClass,
          cusip: holding.cusip,
          value: Math.round(holding.marketValue / 1000), // Convert to thousands
          sharesOrPrincipalAmount: holding.sharesOrPrincipalAmount,
          investmentDiscretion: holding.investmentDiscretion,
          otherManager: holding.otherManager,
          votingAuthority: holding.votingAuthority
        })),
        
        confidentialInformation: data.confidentialTreatmentRequests,
        
        status: FilingStatus.DRAFT,
        submittedBy: '',
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.forms.set(formId, form13F);

      await this.eventPublisher.publish('regulatory.form_13f.prepared', {
        tenantId: data.tenantId,
        formId,
        managerName: data.managerName,
        holdingsCount: data.holdings.length,
        totalValue: totalValue
      });

      return form13F;

    } catch (error) {
      logger.error('Error preparing Form 13F:', error);
      throw error;
    }
  }

  async validateForm13F(formId: string): Promise<Form13FValidationResult> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form 13F not found');
      }

      logger.info('Validating Form 13F', { 
        formId, 
        managerName: form.managerName,
        holdingsCount: form.holdings.length
      });

      const errors: Form13FValidationResult['errors'] = [];
      const warnings: Form13FValidationResult['warnings'] = [];

      // Cover Page Validations
      if (!form.managerName || form.managerName.trim().length === 0) {
        errors.push({
          section: 'CoverPage',
          field: 'managerName',
          message: 'Manager name is required',
          severity: 'error'
        });
      }

      if (!form.managerCIK || !/^\d{10}$/.test(form.managerCIK)) {
        errors.push({
          section: 'CoverPage',
          field: 'managerCIK',
          message: 'Valid 10-digit CIK number is required',
          severity: 'error'
        });
      }

      // Reporting Threshold Validation
      const totalPortfolioValue = form.summary.totalValuePortfolio * 1000; // Convert back to dollars
      const reportingThresholdMet = totalPortfolioValue >= this.REPORTING_THRESHOLD;
      
      if (!reportingThresholdMet) {
        warnings.push({
          section: 'Summary',
          field: 'totalValuePortfolio',
          message: `Portfolio value ($${totalPortfolioValue.toLocaleString()}) is below $100M reporting threshold`
        });
      }

      // Holdings Validations
      let duplicateHoldings = 0;
      let missingCUSIPs = 0;
      const cusipSet = new Set<string>();
      
      form.holdings.forEach((holding, index) => {
        // CUSIP validation
        if (!holding.cusip || !/^[0-9A-Z]{9}$/.test(holding.cusip)) {
          missingCUSIPs++;
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].cusip`,
            message: `Invalid CUSIP for ${holding.nameOfIssuer}: ${holding.cusip}`,
            severity: 'error'
          });
        } else {
          // Check for duplicates
          if (cusipSet.has(holding.cusip)) {
            duplicateHoldings++;
            warnings.push({
              section: 'Holdings',
              field: `holdings[${index}].cusip`,
              message: `Duplicate CUSIP found: ${holding.cusip} for ${holding.nameOfIssuer}`
            });
          }
          cusipSet.add(holding.cusip);
        }

        // Issuer name validation
        if (!holding.nameOfIssuer || holding.nameOfIssuer.trim().length === 0) {
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].nameOfIssuer`,
            message: 'Issuer name is required',
            severity: 'error'
          });
        }

        // Title of class validation
        if (!holding.titleOfClass || holding.titleOfClass.trim().length === 0) {
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].titleOfClass`,
            message: 'Title of class is required',
            severity: 'error'
          });
        }

        // Value validation
        if (!holding.value || holding.value <= 0) {
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].value`,
            message: `Invalid value for ${holding.nameOfIssuer}: ${holding.value}`,
            severity: 'error'
          });
        }

        // Shares/Principal amount validation
        const sharesOrPrincipal = holding.sharesOrPrincipalAmount;
        if (!sharesOrPrincipal.sharesNumber && !sharesOrPrincipal.principalAmount) {
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].sharesOrPrincipalAmount`,
            message: `Either shares number or principal amount is required for ${holding.nameOfIssuer}`,
            severity: 'error'
          });
        }

        // Voting authority validation
        const votingTotal = holding.votingAuthority.sole + holding.votingAuthority.shared + holding.votingAuthority.none;
        const expectedVoting = sharesOrPrincipal.sharesNumber || sharesOrPrincipal.principalAmount || 0;
        if (Math.abs(votingTotal - expectedVoting) > expectedVoting * 0.01) { // 1% tolerance
          warnings.push({
            section: 'Holdings',
            field: `holdings[${index}].votingAuthority`,
            message: `Voting authority total (${votingTotal}) doesn't match shares/principal (${expectedVoting}) for ${holding.nameOfIssuer}`
          });
        }

        // Investment discretion validation
        if (!['SOLE', 'SHARED', 'NONE'].includes(holding.investmentDiscretion)) {
          errors.push({
            section: 'Holdings',
            field: `holdings[${index}].investmentDiscretion`,
            message: `Invalid investment discretion for ${holding.nameOfIssuer}: ${holding.investmentDiscretion}`,
            severity: 'error'
          });
        }
      });

      // Summary Validations
      const calculatedTotal = form.holdings.reduce((sum, holding) => sum + holding.value, 0);
      if (Math.abs(calculatedTotal - form.summary.totalValuePortfolio) > form.summary.totalValuePortfolio * 0.01) {
        warnings.push({
          section: 'Summary',
          field: 'totalValuePortfolio',
          message: `Summary total (${form.summary.totalValuePortfolio}) doesn't match calculated total (${calculatedTotal})`
        });
      }

      if (form.holdings.length !== form.summary.totalNumberOfHoldings) {
        errors.push({
          section: 'Summary',
          field: 'totalNumberOfHoldings',
          message: `Holdings count mismatch: summary shows ${form.summary.totalNumberOfHoldings}, actual count is ${form.holdings.length}`,
          severity: 'error'
        });
      }

      // Calculate completion percentage
      const totalRequiredFields = 10 + (form.holdings.length * 6); // Base fields + holdings fields
      const missingFields = errors.length;
      const completionPercentage = Math.max(0, ((totalRequiredFields - missingFields) / totalRequiredFields) * 100);

      const validationResult: Form13FValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        summary: {
          totalHoldings: form.holdings.length,
          totalValue: totalPortfolioValue,
          reportingThresholdMet,
          duplicateHoldings,
          missingCUSIPs
        },
        completionPercentage
      };

      // Update form status based on validation
      if (validationResult.isValid && completionPercentage >= 95) {
        form.status = FilingStatus.REVIEW;
      } else {
        form.status = FilingStatus.DRAFT;
      }

      form.updatedAt = new Date();
      this.forms.set(formId, form);

      return validationResult;

    } catch (error) {
      logger.error('Error validating Form 13F:', error);
      throw error;
    }
  }

  async submitForm13F(
    formId: string,
    submittedBy: string,
    filingOptions: Form13FFilingOptions = { testFiling: false, expeditedProcessing: false, confirmationRequired: true }
  ): Promise<RegulatoryFiling> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form 13F not found');
      }

      logger.info('Submitting Form 13F', {
        formId,
        managerName: form.managerName,
        holdingsCount: form.holdings.length,
        testFiling: filingOptions.testFiling
      });

      // Validate form before submission
      const validation = await this.validateForm13F(formId);
      if (!validation.isValid) {
        throw new Error('Form 13F validation failed. Please correct errors before submission.');
      }

      // Check reporting threshold
      if (!validation.summary.reportingThresholdMet) {
        throw new Error('Portfolio value below $100M reporting threshold for Form 13F');
      }

      // Create regulatory filing record
      const filingId = randomUUID();
      const filing: RegulatoryFiling = {
        id: filingId,
        tenantId: form.tenantId,
        formType: FormType.FORM_13F,
        jurisdiction: RegulatoryJurisdiction.SEC,
        filingDate: new Date(),
        reportingPeriodEnd: form.reportingPeriodEnd,
        dueDate: this.calculateDueDate(form.reportingPeriodEnd),
        formData: form,
        status: FilingStatus.REVIEW,
        workflowStage: 'filing',
        reviewers: [],
        amendmentNumber: form.amendmentNumber,
        attachments: (filingOptions.attachments || []).map(attachment => ({
          id: randomUUID(),
          filename: attachment.filename,
          fileType: this.getFileType(attachment.filename),
          fileSize: attachment.content.length,
          uploadedAt: new Date(),
          uploadedBy: submittedBy,
          description: attachment.description
        })),
        complianceChecks: [],
        auditTrail: [{
          action: 'form_submitted',
          performedBy: submittedBy,
          performedAt: new Date(),
          details: { 
            testFiling: filingOptions.testFiling,
            holdingsCount: form.holdings.length,
            totalValue: validation.summary.totalValue,
            isAmendment: form.isAmendment
          }
        }],
        createdBy: submittedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update form status
      form.status = FilingStatus.FILED;
      form.submittedBy = submittedBy;
      form.submittedAt = new Date();
      form.updatedAt = new Date();

      this.forms.set(formId, form);
      this.filings.set(filingId, filing);

      // Submit to SEC (mock implementation)
      const secResponse = await this.submitToSEC(form, filingOptions);
      
      if (secResponse.success && secResponse.confirmationNumber) {
        filing.filingConfirmation = {
          confirmationNumber: secResponse.confirmationNumber,
          acceptedAt: new Date(),
          filingUrl: `https://www.sec.gov/edgar/filing/${secResponse.confirmationNumber}`
        };
        filing.status = FilingStatus.FILED;
        form.filedAt = new Date();
      } else {
        filing.status = FilingStatus.REJECTED;
        filing.complianceChecks.push({
          checkType: 'sec_submission',
          status: 'failed',
          message: secResponse.errors?.join('; ') || 'Submission failed',
          checkedAt: new Date()
        });
      }

      filing.updatedAt = new Date();
      this.filings.set(filingId, filing);

      await this.eventPublisher.publish('regulatory.form_13f.submitted', {
        tenantId: form.tenantId,
        formId,
        filingId,
        managerName: form.managerName,
        holdingsCount: form.holdings.length,
        success: secResponse.success,
        confirmationNumber: secResponse.confirmationNumber
      });

      return filing;

    } catch (error) {
      logger.error('Error submitting Form 13F:', error);
      throw error;
    }
  }

  async getForm13F(formId: string): Promise<Form13F | null> {
    return this.forms.get(formId) || null;
  }

  async getForm13FsByTenant(tenantId: string): Promise<Form13F[]> {
    return Array.from(this.forms.values()).filter(form => form.tenantId === tenantId);
  }

  async updateForm13F(formId: string, updates: Partial<Form13F>): Promise<Form13F> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error('Form 13F not found');
    }

    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date()
    };

    this.forms.set(formId, updatedForm);

    await this.eventPublisher.publish('regulatory.form_13f.updated', {
      tenantId: form.tenantId,
      formId,
      managerName: form.managerName
    });

    return updatedForm;
  }

  async analyzeHoldings(formId: string): Promise<{
    topHoldings: HoldingAnalysis[];
    sectorConcentration: Array<{
      sector: string;
      value: number;
      percentage: number;
      holdingsCount: number;
    }>;
    concentrationRisk: {
      top5Concentration: number;
      top10Concentration: number;
      herfindahlIndex: number;
    };
    votingAnalysis: {
      totalSoleVotingPower: number;
      totalSharedVotingPower: number;
      totalNoVotingPower: number;
    };
  }> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form 13F not found');
      }

      // Analyze individual holdings
      const holdingAnalyses: HoldingAnalysis[] = form.holdings.map(holding => ({
        cusip: holding.cusip,
        issuerName: holding.nameOfIssuer,
        titleOfClass: holding.titleOfClass,
        totalValue: holding.value * 1000, // Convert back to dollars
        totalShares: holding.sharesOrPrincipalAmount.sharesNumber || 0,
        managersReporting: 1, // Simplified - would need to aggregate across managers
        concentrationRisk: (holding.value / form.summary.totalValuePortfolio) * 100,
        votingPower: {
          soleVoting: holding.votingAuthority.sole,
          sharedVoting: holding.votingAuthority.shared,
          noVoting: holding.votingAuthority.none
        }
      }));

      // Sort by value (top holdings first)
      const topHoldings = holdingAnalyses.sort((a, b) => b.totalValue - a.totalValue).slice(0, 25);

      // Mock sector concentration (would need sector mapping in real implementation)
      const sectors = ['Technology', 'Healthcare', 'Financials', 'Consumer Discretionary', 'Industrials'];
      const sectorConcentration = sectors.map(sector => {
        const sectorHoldings = Math.floor(Math.random() * 10) + 1;
        const sectorValue = Math.random() * form.summary.totalValuePortfolio * 1000 * 0.3;
        return {
          sector,
          value: sectorValue,
          percentage: (sectorValue / (form.summary.totalValuePortfolio * 1000)) * 100,
          holdingsCount: sectorHoldings
        };
      }).sort((a, b) => b.value - a.value);

      // Calculate concentration risk
      const sortedValues = holdingAnalyses.map(h => h.totalValue).sort((a, b) => b - a);
      const totalValue = form.summary.totalValuePortfolio * 1000;
      
      const top5Concentration = sortedValues.slice(0, 5).reduce((sum, val) => sum + val, 0) / totalValue * 100;
      const top10Concentration = sortedValues.slice(0, 10).reduce((sum, val) => sum + val, 0) / totalValue * 100;
      
      // Herfindahl-Hirschman Index
      const marketShares = holdingAnalyses.map(h => (h.totalValue / totalValue) * 100);
      const herfindahlIndex = marketShares.reduce((sum, share) => sum + Math.pow(share, 2), 0);

      // Voting analysis
      const votingAnalysis = {
        totalSoleVotingPower: form.holdings.reduce((sum, h) => sum + h.votingAuthority.sole, 0),
        totalSharedVotingPower: form.holdings.reduce((sum, h) => sum + h.votingAuthority.shared, 0),
        totalNoVotingPower: form.holdings.reduce((sum, h) => sum + h.votingAuthority.none, 0)
      };

      return {
        topHoldings,
        sectorConcentration,
        concentrationRisk: {
          top5Concentration,
          top10Concentration,
          herfindahlIndex
        },
        votingAnalysis
      };

    } catch (error) {
      logger.error('Error analyzing 13F holdings:', error);
      throw error;
    }
  }

  async generateForm13FReport(formId: string): Promise<{
    summary: any;
    complianceStatus: any;
    holdingsAnalysis: any;
    filingHistory: any[];
  }> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form 13F not found');
      }

      const validation = await this.validateForm13F(formId);
      const holdingsAnalysis = await this.analyzeHoldings(formId);
      
      const summary = {
        formId: form.id,
        managerName: form.managerName,
        managerCIK: form.managerCIK,
        reportingPeriodEnd: form.reportingPeriodEnd,
        status: form.status,
        totalHoldings: form.holdings.length,
        totalValue: form.summary.totalValuePortfolio * 1000,
        isAmendment: form.isAmendment,
        amendmentNumber: form.amendmentNumber,
        createdAt: form.createdAt,
        lastUpdated: form.updatedAt
      };

      const complianceStatus = {
        isValid: validation.isValid,
        completionPercentage: validation.completionPercentage,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        reportingThresholdMet: validation.summary.reportingThresholdMet,
        duplicateHoldings: validation.summary.duplicateHoldings,
        missingCUSIPs: validation.summary.missingCUSIPs
      };

      const filingHistory = Array.from(this.filings.values())
        .filter(filing => filing.formData && (filing.formData as Form13F).id === formId)
        .map(filing => ({
          filingId: filing.id,
          filingDate: filing.filingDate,
          status: filing.status,
          confirmationNumber: filing.filingConfirmation?.confirmationNumber,
          amendmentNumber: filing.amendmentNumber
        }));

      return {
        summary,
        complianceStatus,
        holdingsAnalysis,
        filingHistory
      };

    } catch (error) {
      logger.error('Error generating Form 13F report:', error);
      throw error;
    }
  }

  private async submitToSEC(form: Form13F, options: Form13FFilingOptions): Promise<SECForm13FResponse> {
    // Mock SEC submission - in reality, this would integrate with EDGAR
    logger.info('Submitting Form 13F to SEC EDGAR system', {
      formId: form.id,
      managerName: form.managerName,
      holdingsCount: form.holdings.length,
      testFiling: options.testFiling
    });

    // Simulate processing time based on holdings count
    const processingTime = Math.min(5000, 1000 + form.holdings.length * 10);
    await new Promise(resolve => setTimeout(resolve, processingTime));

    // Mock response with success rate based on data quality
    const hasValidCUSIPs = form.holdings.every(h => /^[0-9A-Z]{9}$/.test(h.cusip));
    const hasCompleteData = form.holdings.every(h => h.nameOfIssuer && h.titleOfClass && h.value > 0);
    const successRate = hasValidCUSIPs && hasCompleteData ? 0.92 : 0.75;

    if (Math.random() < successRate) {
      return {
        success: true,
        confirmationNumber: `13F-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submissionId: randomUUID(),
        processingTime
      };
    } else {
      const possibleErrors = [
        'Invalid CUSIP number found in holdings',
        'Missing issuer name for one or more holdings',
        'Total value calculation discrepancy',
        'Voting authority totals do not match shares reported',
        'Manager CIK not found in SEC database'
      ];
      
      return {
        success: false,
        errors: possibleErrors.slice(0, Math.floor(Math.random() * 3) + 1),
        processingTime
      };
    }
  }

  private calculateDueDate(reportingPeriodEnd: Date): Date {
    // 13F filings are due 45 days after quarter end
    const dueDate = new Date(reportingPeriodEnd);
    dueDate.setDate(dueDate.getDate() + 45);
    return dueDate;
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'xml': return 'application/xml';
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  }
}