import { randomUUID } from 'crypto';
import { FormPF, FilingStatus, RegulatoryFiling, FormType, RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface FormPFPreparationData {
  tenantId: string;
  fundName: string;
  fundId: string;
  filingType: 'annual' | 'quarterly';
  reportingPeriodEnd: Date;
  fundInformation: any;
  advisorInformation: any;
  investmentStrategy: any;
  performanceData: any;
  riskMetrics: any;
}

interface FormPFValidationResult {
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
  completionPercentage: number;
  thresholdAnalysis: {
    requiresSection4: boolean;
    isLargePrivateFund: boolean;
    reportingThresholdMet: boolean;
  };
}

interface FormPFFilingOptions {
  testFiling: boolean;
  expeditedProcessing: boolean;
  confirmationRequired: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    description: string;
  }>;
}

interface SECFormPFResponse {
  success: boolean;
  confirmationNumber?: string;
  submissionId?: string;
  errors?: string[];
  warnings?: string[];
  processingTime?: number;
}

export class FormPFService {
  private eventPublisher: EventPublisher;
  private forms: Map<string, FormPF> = new Map();
  private filings: Map<string, RegulatoryFiling> = new Map();

  // Thresholds for Form PF reporting requirements
  private readonly SECTION_4_THRESHOLD = 500000000; // $500M NAV threshold for Section 4
  private readonly LARGE_PRIVATE_FUND_THRESHOLD = 1500000000; // $1.5B NAV threshold

  constructor() {
    this.eventPublisher = new EventPublisher();
  }

  async prepareFormPF(data: FormPFPreparationData): Promise<FormPF> {
    try {
      logger.info('Preparing Form PF', {
        tenantId: data.tenantId,
        fundName: data.fundName,
        filingType: data.filingType
      });

      const formId = randomUUID();
      
      const formPF: FormPF = {
        id: formId,
        tenantId: data.tenantId,
        fundName: data.fundName,
        fundId: data.fundId,
        filingType: data.filingType,
        reportingPeriodEnd: data.reportingPeriodEnd,
        filingDate: new Date(),
        
        section1: {
          fundIdentifier: data.fundInformation?.fundIdentifier || data.fundId,
          fundLegalName: data.fundName,
          fundPoolIdentifier: data.fundInformation?.fundPoolIdentifier,
          masterFundIdentifier: data.fundInformation?.masterFundIdentifier,
          isFeederFund: data.fundInformation?.isFeederFund || false,
          isMasterFund: data.fundInformation?.isMasterFund || false,
          primaryBusinessAddress: data.fundInformation?.primaryBusinessAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          mainBusinessAddress: data.fundInformation?.mainBusinessAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          fundType: data.fundInformation?.fundType || 'hedge_fund'
        },
        
        section2: {
          advisorCRDNumber: data.advisorInformation?.crdNumber || '',
          advisorSECNumber: data.advisorInformation?.secNumber || '',
          reportingFundAUM: data.fundInformation?.netAssetValue || 0,
          advisorTotalAUM: data.advisorInformation?.totalAUM || 0,
          fundLaunchDate: data.fundInformation?.launchDate || new Date(),
          fundFiscalYearEnd: data.fundInformation?.fiscalYearEnd || new Date(),
          fundDomicile: data.fundInformation?.domicile || 'US',
          fundBaseCurrency: data.fundInformation?.baseCurrency || 'USD'
        },
        
        section3: {
          investmentStrategy: {
            convertibleArbitrage: data.investmentStrategy?.convertibleArbitrage || false,
            dedicatedShortBias: data.investmentStrategy?.dedicatedShortBias || false,
            emergingMarkets: data.investmentStrategy?.emergingMarkets || false,
            equityMarketNeutral: data.investmentStrategy?.equityMarketNeutral || false,
            eventDriven: data.investmentStrategy?.eventDriven || false,
            fixedIncomeArbitrage: data.investmentStrategy?.fixedIncomeArbitrage || false,
            globalMacro: data.investmentStrategy?.globalMacro || false,
            longShortEquity: data.investmentStrategy?.longShortEquity || true,
            managedFutures: data.investmentStrategy?.managedFutures || false,
            multiStrategy: data.investmentStrategy?.multiStrategy || false,
            fundOfFunds: data.investmentStrategy?.fundOfFunds || false,
            other: data.investmentStrategy?.other || ''
          },
          geographicFocus: {
            northAmerica: data.investmentStrategy?.geographicFocus?.northAmerica || 70,
            europe: data.investmentStrategy?.geographicFocus?.europe || 20,
            asia: data.investmentStrategy?.geographicFocus?.asia || 10,
            other: data.investmentStrategy?.geographicFocus?.other || 0
          },
          borrowingAndLeverage: {
            grossAssetValue: data.riskMetrics?.grossAssetValue || 0,
            netAssetValue: data.riskMetrics?.netAssetValue || 0,
            borrowings: data.riskMetrics?.borrowings || 0,
            derivativesNotional: data.riskMetrics?.derivativesNotional || 0
          },
          liquidityTerms: {
            redemptionFrequency: data.fundInformation?.redemptionFrequency || 'monthly',
            redemptionNotice: data.fundInformation?.redemptionNotice || 30,
            lockupPeriod: data.fundInformation?.lockupPeriod || 12,
            sideLetterTerms: data.fundInformation?.sideLetterTerms || false
          }
        },
        
        status: FilingStatus.DRAFT,
        submittedBy: '',
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Add Section 4 if fund meets threshold
      if (formPF.section2.reportingFundAUM >= this.SECTION_4_THRESHOLD) {
        formPF.section4 = {
          netAssetValue: data.riskMetrics?.netAssetValue || 0,
          grossAssetValue: data.riskMetrics?.grossAssetValue || 0,
          percentAllocatedToMostConcentratedStrategy: data.riskMetrics?.concentrationRatio || 0,
          monthlyNetReturn: data.performanceData?.monthlyReturns || [],
          counterpartyCredit: data.riskMetrics?.counterpartyExposures || [],
          portfolioLiquidity: {
            lessThanOneDay: data.riskMetrics?.liquidity?.lessThanOneDay || 0,
            oneToSevenDays: data.riskMetrics?.liquidity?.oneToSevenDays || 0,
            eightToThirtyDays: data.riskMetrics?.liquidity?.eightToThirtyDays || 0,
            thirtyOneToNinetyDays: data.riskMetrics?.liquidity?.thirtyOneToNinetyDays || 0,
            ninetyOneToOneEightyDays: data.riskMetrics?.liquidity?.ninetyOneToOneEightyDays || 0,
            oneEightyOneToDaysToOneYear: data.riskMetrics?.liquidity?.oneEightyOneToDaysToOneYear || 0,
            greaterThanOneYear: data.riskMetrics?.liquidity?.greaterThanOneYear || 0
          }
        };
      }

      this.forms.set(formId, formPF);

      await this.eventPublisher.publish('regulatory.form_pf.prepared', {
        tenantId: data.tenantId,
        formId,
        fundName: data.fundName,
        filingType: data.filingType,
        requiresSection4: formPF.section4 !== undefined
      });

      return formPF;

    } catch (error) {
      logger.error('Error preparing Form PF:', error);
      throw error;
    }
  }

  async validateFormPF(formId: string): Promise<FormPFValidationResult> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form PF not found');
      }

      logger.info('Validating Form PF', { formId, fundName: form.fundName });

      const errors: FormPFValidationResult['errors'] = [];
      const warnings: FormPFValidationResult['warnings'] = [];

      // Section 1 Validations
      if (!form.section1.fundLegalName) {
        errors.push({
          section: 'Section1',
          field: 'fundLegalName',
          message: 'Fund legal name is required',
          severity: 'error'
        });
      }

      if (!form.section1.primaryBusinessAddress.street || !form.section1.primaryBusinessAddress.city) {
        errors.push({
          section: 'Section1',
          field: 'primaryBusinessAddress',
          message: 'Primary business address is required',
          severity: 'error'
        });
      }

      // Section 2 Validations
      if (!form.section2.advisorCRDNumber) {
        errors.push({
          section: 'Section2',
          field: 'advisorCRDNumber',
          message: 'Advisor CRD number is required',
          severity: 'error'
        });
      }

      if (form.section2.reportingFundAUM <= 0) {
        errors.push({
          section: 'Section2',
          field: 'reportingFundAUM',
          message: 'Reporting fund AUM must be greater than zero',
          severity: 'error'
        });
      }

      // Section 3 Validations
      const strategies = Object.values(form.section3.investmentStrategy);
      const hasStrategy = strategies.some(strategy => strategy === true) || form.section3.investmentStrategy.other;
      if (!hasStrategy) {
        errors.push({
          section: 'Section3',
          field: 'investmentStrategy',
          message: 'At least one investment strategy must be selected',
          severity: 'error'
        });
      }

      const geoTotal = form.section3.geographicFocus.northAmerica + 
                      form.section3.geographicFocus.europe + 
                      form.section3.geographicFocus.asia + 
                      form.section3.geographicFocus.other;
      if (Math.abs(geoTotal - 100) > 1) { // Allow 1% tolerance
        warnings.push({
          section: 'Section3',
          field: 'geographicFocus',
          message: 'Geographic focus percentages should total 100%'
        });
      }

      // Section 4 Validations (if applicable)
      const requiresSection4 = form.section2.reportingFundAUM >= this.SECTION_4_THRESHOLD;
      if (requiresSection4 && !form.section4) {
        errors.push({
          section: 'Section4',
          field: 'section4',
          message: 'Section 4 is required for funds with NAV >= $500M',
          severity: 'error'
        });
      }

      if (form.section4) {
        const liquidityTotal = Object.values(form.section4.portfolioLiquidity).reduce((sum, val) => sum + val, 0);
        if (Math.abs(liquidityTotal - 100) > 1) {
          warnings.push({
            section: 'Section4',
            field: 'portfolioLiquidity',
            message: 'Portfolio liquidity percentages should total 100%'
          });
        }

        if (form.section4.monthlyNetReturn.length < 12 && form.filingType === 'annual') {
          warnings.push({
            section: 'Section4',
            field: 'monthlyNetReturn',
            message: 'Annual filings should include 12 months of return data'
          });
        }
      }

      // Threshold Analysis
      const thresholdAnalysis = {
        requiresSection4,
        isLargePrivateFund: form.section2.reportingFundAUM >= this.LARGE_PRIVATE_FUND_THRESHOLD,
        reportingThresholdMet: form.section2.reportingFundAUM >= 150000000 // $150M minimum threshold
      };

      // Filing Type Validations
      if (form.filingType === 'quarterly' && !thresholdAnalysis.isLargePrivateFund) {
        warnings.push({
          section: 'General',
          field: 'filingType',
          message: 'Quarterly filing typically only required for large private funds'
        });
      }

      // Calculate completion percentage
      const totalRequiredFields = requiresSection4 ? 25 : 18;
      const completedFields = totalRequiredFields - errors.length;
      const completionPercentage = Math.max(0, (completedFields / totalRequiredFields) * 100);

      const validationResult: FormPFValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        completionPercentage,
        thresholdAnalysis
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
      logger.error('Error validating Form PF:', error);
      throw error;
    }
  }

  async submitFormPF(
    formId: string,
    submittedBy: string,
    filingOptions: FormPFFilingOptions = { testFiling: false, expeditedProcessing: false, confirmationRequired: true }
  ): Promise<RegulatoryFiling> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form PF not found');
      }

      logger.info('Submitting Form PF', {
        formId,
        fundName: form.fundName,
        filingType: form.filingType,
        testFiling: filingOptions.testFiling
      });

      // Validate form before submission
      const validation = await this.validateFormPF(formId);
      if (!validation.isValid) {
        throw new Error('Form PF validation failed. Please correct errors before submission.');
      }

      // Check reporting thresholds
      if (!validation.thresholdAnalysis.reportingThresholdMet) {
        throw new Error('Fund does not meet minimum reporting thresholds for Form PF');
      }

      // Create regulatory filing record
      const filingId = randomUUID();
      const filing: RegulatoryFiling = {
        id: filingId,
        tenantId: form.tenantId,
        formType: FormType.FORM_PF,
        jurisdiction: RegulatoryJurisdiction.SEC,
        filingDate: new Date(),
        reportingPeriodEnd: form.reportingPeriodEnd,
        dueDate: this.calculateDueDate(form.filingType, form.reportingPeriodEnd),
        formData: form,
        status: FilingStatus.REVIEW,
        workflowStage: 'filing',
        reviewers: [],
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
            requiresSection4: validation.thresholdAnalysis.requiresSection4,
            isLargePrivateFund: validation.thresholdAnalysis.isLargePrivateFund
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

      await this.eventPublisher.publish('regulatory.form_pf.submitted', {
        tenantId: form.tenantId,
        formId,
        filingId,
        fundName: form.fundName,
        filingType: form.filingType,
        success: secResponse.success,
        confirmationNumber: secResponse.confirmationNumber
      });

      return filing;

    } catch (error) {
      logger.error('Error submitting Form PF:', error);
      throw error;
    }
  }

  async getFormPF(formId: string): Promise<FormPF | null> {
    return this.forms.get(formId) || null;
  }

  async getFormPFsByTenant(tenantId: string): Promise<FormPF[]> {
    return Array.from(this.forms.values()).filter(form => form.tenantId === tenantId);
  }

  async updateFormPF(formId: string, updates: Partial<FormPF>): Promise<FormPF> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error('Form PF not found');
    }

    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date()
    };

    this.forms.set(formId, updatedForm);

    await this.eventPublisher.publish('regulatory.form_pf.updated', {
      tenantId: form.tenantId,
      formId,
      fundName: form.fundName
    });

    return updatedForm;
  }

  async calculateFilingRequirements(
    tenantId: string,
    funds: Array<{
      fundId: string;
      fundName: string;
      netAssetValue: number;
      fundType: string;
    }>
  ): Promise<{
    requiresFilingByFund: Array<{
      fundId: string;
      fundName: string;
      requiresFiling: boolean;
      filingFrequency: 'annual' | 'quarterly' | 'none';
      requiresSection4: boolean;
      nextFilingDue: Date;
    }>;
    aggregateRequirements: {
      totalFundsRequiringFiling: number;
      totalAnnualFilings: number;
      totalQuarterlyFilings: number;
      nextFilingDue: Date;
    };
  }> {
    try {
      const currentDate = new Date();
      const requiresFilingByFund = funds.map(fund => {
        const requiresFiling = fund.netAssetValue >= 150000000; // $150M threshold
        const requiresSection4 = fund.netAssetValue >= this.SECTION_4_THRESHOLD;
        const isLargePrivateFund = fund.netAssetValue >= this.LARGE_PRIVATE_FUND_THRESHOLD;

        let filingFrequency: 'annual' | 'quarterly' | 'none' = 'none';
        if (requiresFiling) {
          filingFrequency = isLargePrivateFund ? 'quarterly' : 'annual';
        }

        // Calculate next filing due date
        let nextFilingDue = new Date(currentDate);
        if (filingFrequency === 'quarterly') {
          // Next quarter end + 60 days
          const quarterEnd = this.getNextQuarterEnd(currentDate);
          nextFilingDue = new Date(quarterEnd.getTime() + 60 * 24 * 60 * 60 * 1000);
        } else if (filingFrequency === 'annual') {
          // Next year end + 120 days
          const yearEnd = new Date(currentDate.getFullYear(), 11, 31);
          if (yearEnd <= currentDate) {
            yearEnd.setFullYear(yearEnd.getFullYear() + 1);
          }
          nextFilingDue = new Date(yearEnd.getTime() + 120 * 24 * 60 * 60 * 1000);
        }

        return {
          fundId: fund.fundId,
          fundName: fund.fundName,
          requiresFiling,
          filingFrequency,
          requiresSection4,
          nextFilingDue
        };
      });

      const fundRequiringFiling = requiresFilingByFund.filter(f => f.requiresFiling);
      const aggregateRequirements = {
        totalFundsRequiringFiling: fundRequiringFiling.length,
        totalAnnualFilings: fundRequiringFiling.filter(f => f.filingFrequency === 'annual').length,
        totalQuarterlyFilings: fundRequiringFiling.filter(f => f.filingFrequency === 'quarterly').length,
        nextFilingDue: fundRequiringFiling.length > 0 
          ? new Date(Math.min(...fundRequiringFiling.map(f => f.nextFilingDue.getTime())))
          : new Date()
      };

      return {
        requiresFilingByFund,
        aggregateRequirements
      };

    } catch (error) {
      logger.error('Error calculating filing requirements:', error);
      throw error;
    }
  }

  async generateFormPFReport(formId: string): Promise<{
    summary: any;
    complianceStatus: any;
    riskAnalysis: any;
    filingHistory: any[];
  }> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form PF not found');
      }

      const validation = await this.validateFormPF(formId);
      
      const summary = {
        formId: form.id,
        fundName: form.fundName,
        fundId: form.fundId,
        filingType: form.filingType,
        status: form.status,
        reportingFundAUM: form.section2.reportingFundAUM,
        reportingPeriodEnd: form.reportingPeriodEnd,
        createdAt: form.createdAt,
        lastUpdated: form.updatedAt
      };

      const complianceStatus = {
        isValid: validation.isValid,
        completionPercentage: validation.completionPercentage,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        thresholdAnalysis: validation.thresholdAnalysis
      };

      const riskAnalysis = form.section4 ? {
        leverageRatio: form.section4.grossAssetValue / form.section4.netAssetValue,
        concentrationRisk: form.section4.percentAllocatedToMostConcentratedStrategy,
        liquidityProfile: form.section4.portfolioLiquidity,
        counterpartyRisk: form.section4.counterpartyCredit.length,
        performanceVolatility: this.calculateVolatility(form.section4.monthlyNetReturn)
      } : null;

      const filingHistory = Array.from(this.filings.values())
        .filter(filing => filing.formData && (filing.formData as FormPF).id === formId)
        .map(filing => ({
          filingId: filing.id,
          filingDate: filing.filingDate,
          status: filing.status,
          confirmationNumber: filing.filingConfirmation?.confirmationNumber
        }));

      return {
        summary,
        complianceStatus,
        riskAnalysis,
        filingHistory
      };

    } catch (error) {
      logger.error('Error generating Form PF report:', error);
      throw error;
    }
  }

  private async submitToSEC(form: FormPF, options: FormPFFilingOptions): Promise<SECFormPFResponse> {
    // Mock SEC submission - in reality, this would integrate with EDGAR
    logger.info('Submitting Form PF to SEC EDGAR system', {
      formId: form.id,
      fundName: form.fundName,
      testFiling: options.testFiling
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Mock response with higher success rate for well-structured submissions
    const hasSection4 = Boolean(form.section4);
    const successRate = hasSection4 ? 0.95 : 0.88; // Section 4 submissions tend to be more thorough

    if (Math.random() < successRate) {
      return {
        success: true,
        confirmationNumber: `PF-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submissionId: randomUUID(),
        processingTime: 3000
      };
    } else {
      return {
        success: false,
        errors: [
          'Investment strategy classification incomplete',
          'Geographic focus percentages do not total 100%',
          'Section 4 liquidity data missing'
        ],
        processingTime: 2500
      };
    }
  }

  private calculateDueDate(filingType: FormPF['filingType'], reportingPeriodEnd: Date): Date {
    const dueDate = new Date(reportingPeriodEnd);
    
    switch (filingType) {
      case 'annual':
        dueDate.setDate(dueDate.getDate() + 120); // 120 days after fiscal year end
        break;
      case 'quarterly':
        dueDate.setDate(dueDate.getDate() + 60); // 60 days after quarter end
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 120);
    }
    
    return dueDate;
  }

  private getNextQuarterEnd(date: Date): Date {
    const currentQuarter = Math.floor(date.getMonth() / 3);
    const nextQuarter = (currentQuarter + 1) % 4;
    const year = nextQuarter === 0 ? date.getFullYear() + 1 : date.getFullYear();
    
    return new Date(year, nextQuarter * 3 + 2, 31); // Last day of quarter
  }

  private calculateVolatility(returns: Array<{ month: string; netReturn: number }>): number {
    if (returns.length < 2) return 0;

    const returnValues = returns.map(r => r.netReturn);
    const mean = returnValues.reduce((sum, val) => sum + val, 0) / returnValues.length;
    const variance = returnValues.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / returnValues.length;
    
    return Math.sqrt(variance * 12); // Annualized volatility
  }

  private getFileType(filename: string): string {
    const extension = filename.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf': return 'application/pdf';
      case 'doc': return 'application/msword';
      case 'docx': return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      case 'xls': return 'application/vnd.ms-excel';
      case 'xlsx': return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      default: return 'application/octet-stream';
    }
  }
}