import { randomUUID } from 'crypto';
import { FormADV, FilingStatus, RegulatoryFiling, FormType, RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface FormADVPreparationData {
  tenantId: string;
  firmName: string;
  crdNumber: string;
  filingType: 'initial' | 'annual' | 'amendment' | 'other_than_annual';
  reportingPeriodEnd: Date;
  businessInformation: any;
  ownershipStructure: any;
  advisoryBusiness: any;
  clientBase: any;
  assetsUnderManagement: number;
}

interface FormADVValidationResult {
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
}

interface FormADVFilingOptions {
  testFiling: boolean;
  expeditedProcessing: boolean;
  confirmationRequired: boolean;
  attachments?: Array<{
    filename: string;
    content: Buffer;
    description: string;
  }>;
}

interface SECFilingResponse {
  success: boolean;
  confirmationNumber?: string;
  submissionId?: string;
  errors?: string[];
  warnings?: string[];
  processingTime?: number;
}

export class FormADVService {
  private eventPublisher: EventPublisher;
  private forms: Map<string, FormADV> = new Map();
  private filings: Map<string, RegulatoryFiling> = new Map();

  constructor() {
    this.eventPublisher = new EventPublisher('FormADV');
  }

  async prepareFormADV(data: FormADVPreparationData): Promise<FormADV> {
    try {
      logger.info('Preparing Form ADV', {
        tenantId: data.tenantId,
        firmName: data.firmName,
        filingType: data.filingType
      });

      const formId = randomUUID();
      
      const formADV: FormADV = {
        id: formId,
        tenantId: data.tenantId,
        firmName: data.firmName,
        crdNumber: data.crdNumber,
        filingType: data.filingType,
        filingDate: new Date(),
        reportingPeriodEnd: data.reportingPeriodEnd,
        
        part1A: {
          businessAddress: data.businessInformation.businessAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          principalBusinessAddress: data.businessInformation.principalBusinessAddress || {
            street: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'US'
          },
          executiveOfficers: data.businessInformation.executiveOfficers || [],
          registrationStatus: {
            secRegistered: true,
            stateRegistered: false,
            exemptReportingAdviser: false
          },
          businessActivities: {
            investmentAdviser: true,
            investmentCompany: false,
            brokerDealer: false,
            other: []
          }
        },
        
        part1B: {
          ownersAndExecutives: data.ownershipStructure?.ownersAndExecutives || [],
          directOwners: data.ownershipStructure?.directOwners || [],
          indirectOwners: data.ownershipStructure?.indirectOwners || []
        },
        
        part2A: {
          advisoryBusiness: {
            businessDescription: data.advisoryBusiness?.businessDescription || '',
            principalOwners: data.advisoryBusiness?.principalOwners || [],
            yearsInBusiness: data.advisoryBusiness?.yearsInBusiness || 0,
            typesOfClientsAdvised: data.advisoryBusiness?.typesOfClientsAdvised || [],
            assetsUnderManagement: data.assetsUnderManagement,
            discretionaryAUM: data.advisoryBusiness?.discretionaryAUM || 0,
            nonDiscretionaryAUM: data.advisoryBusiness?.nonDiscretionaryAUM || 0
          },
          feesAndCompensation: {
            feeStructure: data.advisoryBusiness?.feeStructure || '',
            feeSchedule: data.advisoryBusiness?.feeSchedule || [],
            otherCompensation: data.advisoryBusiness?.otherCompensation || []
          },
          performanceFees: {
            chargesPerformanceFees: data.advisoryBusiness?.chargesPerformanceFees || false,
            performanceFeeStructure: data.advisoryBusiness?.performanceFeeStructure,
            clientTypes: data.advisoryBusiness?.performanceFeeClientTypes
          },
          typesOfClients: {
            individuals: data.clientBase?.individuals || false,
            highNetWorthIndividuals: data.clientBase?.highNetWorthIndividuals || false,
            bankingInstitutions: data.clientBase?.bankingInstitutions || false,
            investmentCompanies: data.clientBase?.investmentCompanies || false,
            businessDevelopmentCompanies: data.clientBase?.businessDevelopmentCompanies || false,
            pensionPlans: data.clientBase?.pensionPlans || false,
            charitableOrganizations: data.clientBase?.charitableOrganizations || false,
            corporations: data.clientBase?.corporations || false,
            other: data.clientBase?.other || []
          },
          methodsOfAnalysis: {
            charting: false,
            fundamental: true,
            technical: false,
            cyclical: false,
            quantitative: true,
            other: []
          },
          investmentStrategies: {
            longTerm: true,
            shortTerm: false,
            tradingStrategy: false,
            other: []
          },
          riskFactors: [
            'Market risk',
            'Credit risk',
            'Liquidity risk',
            'Operational risk'
          ],
          disciplinaryInformation: {
            hasEvents: false,
            events: []
          }
        },
        
        status: FilingStatus.DRAFT,
        submittedBy: '', // Will be set when submitted
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.forms.set(formId, formADV);

      await this.eventPublisher.publish('regulatory.form_adv.prepared', {
        tenantId: data.tenantId,
        formId,
        firmName: data.firmName,
        filingType: data.filingType
      });

      return formADV;

    } catch (error: any) {
      logger.error('Error preparing Form ADV:', error);
      throw error;
    }
  }

  async validateFormADV(formId: string): Promise<FormADVValidationResult> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form ADV not found');
      }

      logger.info('Validating Form ADV', { formId, firmName: form.firmName });

      const errors: FormADVValidationResult['errors'] = [];
      const warnings: FormADVValidationResult['warnings'] = [];

      // Part 1A Validations
      if (!form.part1A.businessAddress.street || !form.part1A.businessAddress.city) {
        errors.push({
          section: 'Part1A',
          field: 'businessAddress',
          message: 'Business address is required',
          severity: 'error'
        });
      }

      if (!form.part1A.executiveOfficers || form.part1A.executiveOfficers.length === 0) {
        errors.push({
          section: 'Part1A',
          field: 'executiveOfficers',
          message: 'At least one executive officer is required',
          severity: 'error'
        });
      }

      // Part 1B Validations
      if (!form.part1B.ownersAndExecutives || form.part1B.ownersAndExecutives.length === 0) {
        warnings.push({
          section: 'Part1B',
          field: 'ownersAndExecutives',
          message: 'Ownership information should be provided'
        });
      }

      // Part 2A Validations
      if (!form.part2A.advisoryBusiness.businessDescription) {
        errors.push({
          section: 'Part2A',
          field: 'businessDescription',
          message: 'Business description is required',
          severity: 'error'
        });
      }

      if (form.part2A.advisoryBusiness.assetsUnderManagement <= 0) {
        errors.push({
          section: 'Part2A',
          field: 'assetsUnderManagement',
          message: 'Assets under management must be greater than zero',
          severity: 'error'
        });
      }

      if (!form.part2A.feesAndCompensation.feeStructure) {
        errors.push({
          section: 'Part2A',
          field: 'feeStructure',
          message: 'Fee structure description is required',
          severity: 'error'
        });
      }

      // AUM Threshold Validations
      if (form.part2A.advisoryBusiness.assetsUnderManagement >= 100000000) { // $100M
        if (!form.part1A.registrationStatus.secRegistered) {
          warnings.push({
            section: 'Part1A',
            field: 'registrationStatus',
            message: 'Advisers with $100M+ AUM typically register with SEC'
          });
        }
      }

      // Calculate completion percentage
      const totalRequiredFields = 20; // Simplified count
      const completedFields = totalRequiredFields - errors.length;
      const completionPercentage = Math.max(0, (completedFields / totalRequiredFields) * 100);

      const validationResult: FormADVValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
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

    } catch (error: any) {
      logger.error('Error validating Form ADV:', error);
      throw error;
    }
  }

  async submitFormADV(
    formId: string,
    submittedBy: string,
    filingOptions: FormADVFilingOptions = { testFiling: false, expeditedProcessing: false, confirmationRequired: true }
  ): Promise<RegulatoryFiling> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form ADV not found');
      }

      logger.info('Submitting Form ADV', {
        formId,
        firmName: form.firmName,
        testFiling: filingOptions.testFiling
      });

      // Validate form before submission
      const validation = await this.validateFormADV(formId);
      if (!validation.isValid) {
        throw new Error('Form ADV validation failed. Please correct errors before submission.');
      }

      // Create regulatory filing record
      const filingId = randomUUID();
      const filing: RegulatoryFiling = {
        id: filingId,
        tenantId: form.tenantId,
        formType: FormType.FORM_ADV,
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
          details: { testFiling: filingOptions.testFiling }
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

      await this.eventPublisher.publish('regulatory.form_adv.submitted', {
        tenantId: form.tenantId,
        formId,
        filingId,
        firmName: form.firmName,
        success: secResponse.success,
        confirmationNumber: secResponse.confirmationNumber
      });

      return filing;

    } catch (error: any) {
      logger.error('Error submitting Form ADV:', error);
      throw error;
    }
  }

  async getFormADV(formId: string): Promise<FormADV | null> {
    return this.forms.get(formId) || null;
  }

  async getFormADVsByTenant(tenantId: string): Promise<FormADV[]> {
    return Array.from(this.forms.values()).filter(form => form.tenantId === tenantId);
  }

  async updateFormADV(formId: string, updates: Partial<FormADV>): Promise<FormADV> {
    const form = this.forms.get(formId);
    if (!form) {
      throw new Error('Form ADV not found');
    }

    const updatedForm = {
      ...form,
      ...updates,
      updatedAt: new Date()
    };

    this.forms.set(formId, updatedForm);

    await this.eventPublisher.publish('regulatory.form_adv.updated', {
      tenantId: form.tenantId,
      formId,
      firmName: form.firmName
    });

    return updatedForm;
  }

  async amendFormADV(
    originalFormId: string,
    amendmentData: Partial<FormADV>,
    amendmentReason: string,
    submittedBy: string
  ): Promise<FormADV> {
    try {
      const originalForm = this.forms.get(originalFormId);
      if (!originalForm) {
        throw new Error('Original Form ADV not found');
      }

      logger.info('Creating Form ADV amendment', {
        originalFormId,
        firmName: originalForm.firmName,
        amendmentReason
      });

      const amendmentId = randomUUID();
      const amendmentForm: FormADV = {
        ...originalForm,
        ...amendmentData,
        id: amendmentId,
        filingType: 'amendment',
        status: FilingStatus.DRAFT,
        submittedBy: '',
        submittedAt: undefined,
        filedAt: undefined,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.forms.set(amendmentId, amendmentForm);

      // Create amendment filing record
      const filingId = randomUUID();
      const filing: RegulatoryFiling = {
        id: filingId,
        tenantId: amendmentForm.tenantId,
        formType: FormType.FORM_ADV,
        jurisdiction: RegulatoryJurisdiction.SEC,
        filingDate: new Date(),
        reportingPeriodEnd: amendmentForm.reportingPeriodEnd,
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        formData: amendmentForm,
        status: FilingStatus.DRAFT,
        workflowStage: 'preparation',
        reviewers: [],
        originalFilingId: originalFormId,
        amendmentNumber: 1, // Simplified - would need to track properly
        amendmentReason,
        attachments: [],
        complianceChecks: [],
        auditTrail: [{
          action: 'amendment_created',
          performedBy: submittedBy,
          performedAt: new Date(),
          details: { originalFormId, amendmentReason }
        }],
        createdBy: submittedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.filings.set(filingId, filing);

      await this.eventPublisher.publish('regulatory.form_adv.amendment_created', {
        tenantId: amendmentForm.tenantId,
        originalFormId,
        amendmentFormId: amendmentId,
        filingId,
        firmName: amendmentForm.firmName,
        amendmentReason
      });

      return amendmentForm;

    } catch (error: any) {
      logger.error('Error creating Form ADV amendment:', error);
      throw error;
    }
  }

  async generateFormADVReport(formId: string): Promise<{
    summary: any;
    complianceStatus: any;
    filingHistory: any[];
  }> {
    try {
      const form = this.forms.get(formId);
      if (!form) {
        throw new Error('Form ADV not found');
      }

      const validation = await this.validateFormADV(formId);
      
      const summary = {
        formId: form.id,
        firmName: form.firmName,
        crdNumber: form.crdNumber,
        filingType: form.filingType,
        status: form.status,
        assetsUnderManagement: form.part2A.advisoryBusiness.assetsUnderManagement,
        reportingPeriodEnd: form.reportingPeriodEnd,
        createdAt: form.createdAt,
        lastUpdated: form.updatedAt
      };

      const complianceStatus = {
        isValid: validation.isValid,
        completionPercentage: validation.completionPercentage,
        errorCount: validation.errors.length,
        warningCount: validation.warnings.length,
        criticalIssues: validation.errors.filter(e => e.severity === 'error').length
      };

      const filingHistory = Array.from(this.filings.values())
        .filter(filing => filing.formData && (filing.formData as FormADV).id === formId)
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
        filingHistory
      };

    } catch (error: any) {
      logger.error('Error generating Form ADV report:', error);
      throw error;
    }
  }

  private async submitToSEC(form: FormADV, options: FormADVFilingOptions): Promise<SECFilingResponse> {
    // Mock SEC submission - in reality, this would integrate with EDGAR
    logger.info('Submitting to SEC EDGAR system', {
      formId: form.id,
      testFiling: options.testFiling
    });

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Mock response
    if (Math.random() > 0.1) { // 90% success rate
      return {
        success: true,
        confirmationNumber: `ADV-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        submissionId: randomUUID(),
        processingTime: 2000
      };
    } else {
      return {
        success: false,
        errors: ['Invalid CRD number', 'Business address incomplete'],
        processingTime: 1500
      };
    }
  }

  private calculateDueDate(filingType: FormADV['filingType'], reportingPeriodEnd: Date): Date {
    const dueDate = new Date(reportingPeriodEnd);
    
    switch (filingType) {
      case 'annual':
        dueDate.setDate(dueDate.getDate() + 90); // 90 days after fiscal year end
        break;
      case 'amendment':
        dueDate.setDate(dueDate.getDate() + 30); // 30 days for amendments
        break;
      case 'other_than_annual':
        dueDate.setDate(dueDate.getDate() + 30); // 30 days
        break;
      default:
        dueDate.setDate(dueDate.getDate() + 90);
    }
    
    return dueDate;
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
