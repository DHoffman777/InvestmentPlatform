import { randomUUID } from 'crypto';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface ClientRegulatoryReport {
  id: string;
  tenantId: string;
  clientId: string;
  clientName: string;
  reportType: 'crs' | 'fatca' | 'qib_certification' | 'aml_summary' | 'suitability_assessment' | 'risk_disclosure' | 'fee_disclosure' | 'custom';
  jurisdiction: 'US' | 'EU' | 'UK' | 'CA' | 'AU' | 'JP' | 'INTERNATIONAL';
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  reportData: any; // Flexible structure for different report types
  status: 'draft' | 'review' | 'approved' | 'delivered' | 'archived';
  regulatoryRequirements: string[];
  confidentialityLevel: 'public' | 'confidential' | 'highly_confidential';
  deliveryMethod: 'email' | 'secure_portal' | 'physical_mail' | 'api';
  
  generatedAt: Date;
  deliveredAt?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  
  createdAt: Date;
  updatedAt: Date;
}

interface CRSReport {
  accountNumber: string;
  accountHolderInfo: {
    name: string;
    address: string;
    taxResidence: string[];
    tin: string[];
    dateOfBirth: Date;
    placeOfBirth: string;
  };
  accountBalance: number;
  income: {
    dividends: number;
    interest: number;
    capitalGains: number;
    other: number;
  };
  reportingYear: number;
  reportingFI: {
    name: string;
    giin: string;
    address: string;
  };
}

interface FATCAReport {
  accountNumber: string;
  accountHolderInfo: {
    name: string;
    address: string;
    usPersonIndicators: string[];
    tin: string;
    dateOfBirth?: Date;
  };
  accountBalance: number;
  usSourceIncome: {
    dividends: number;
    interest: number;
    capitalGains: number;
    other: number;
  };
  reportingYear: number;
  withholdingApplied: number;
  pooledReporting: boolean;
}

interface QIBCertification {
  entityName: string;
  entityType: 'corporation' | 'partnership' | 'trust' | 'individual' | 'other';
  totalAssets: number;
  investmentExperience: string;
  qualificationBasis: string[];
  certificationDate: Date;
  expirationDate: Date;
  authorizedSignatory: {
    name: string;
    title: string;
    signature: string;
  };
}

interface AMLSummary {
  clientRiskRating: 'low' | 'medium' | 'high';
  customerDueDiligence: {
    identityVerified: boolean;
    sourceOfWealth: string;
    pep: boolean;
    sanctionsCheck: boolean;
    adverseMediaCheck: boolean;
  };
  transactionMonitoring: {
    unusualTransactions: number;
    sarsFiled: number;
    ctrsFiled: number;
  };
  ongoingMonitoring: {
    lastReview: Date;
    nextReviewDue: Date;
    reviewFrequency: 'monthly' | 'quarterly' | 'annually';
  };
}

interface SuitabilityAssessment {
  investmentObjectives: string[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  timeHorizon: string;
  liquidityNeeds: string;
  investmentExperience: string;
  financialSituation: {
    annualIncome: number;
    netWorth: number;
    investableAssets: number;
  };
  suitabilityScore: number;
  recommendedAllocations: Array<{
    assetClass: string;
    allocation: number;
    rationale: string;
  }>;
  lastAssessment: Date;
  nextAssessmentDue: Date;
}

interface ClientReportGenerationOptions {
  includeCharts: boolean;
  includeDetailedBreakdown: boolean;
  confidentialityWatermark: boolean;
  customBranding: boolean;
  outputFormat: 'pdf' | 'html' | 'json';
  deliveryOptions: {
    method: 'email' | 'secure_portal' | 'physical_mail' | 'api';
    encryptionRequired: boolean;
    passwordProtected: boolean;
    expirationDays?: number;
  };
}

interface ClientReportValidationResult {
  isValid: boolean;
  errors: Array<{
    field: string;
    message: string;
    severity: 'error' | 'warning';
  }>;
  warnings: Array<{
    field: string;
    message: string;
  }>;
  complianceChecks: Array<{
    requirement: string;
    status: 'met' | 'not_met' | 'partial';
    details: string;
  }>;
}

export class ClientRegulatoryReportsService {
  private eventPublisher: EventPublisher;
  private reports: Map<string, ClientRegulatoryReport> = new Map();

  constructor() {
    this.eventPublisher = new EventPublisher('ClientRegulatoryReports');
  }

  async generateCRSReport(
    tenantId: string,
    clientId: string,
    clientName: string,
    reportData: CRSReport,
    reportingYear: number
  ): Promise<ClientRegulatoryReport> {
    try {
      logger.info('Generating CRS report', {
        tenantId,
        clientId,
        reportingYear
      });

      const reportId = randomUUID();
      
      const report: ClientRegulatoryReport = {
        id: reportId,
        tenantId,
        clientId,
        clientName,
        reportType: 'crs',
        jurisdiction: this.determineJurisdiction(reportData.accountHolderInfo.taxResidence),
        reportingPeriod: {
          startDate: new Date(reportingYear, 0, 1),
          endDate: new Date(reportingYear, 11, 31)
        },
        reportData,
        status: 'draft',
        regulatoryRequirements: [
          'OECD Common Reporting Standard',
          'Automatic Exchange of Information',
          'Tax residency verification',
          'Account balance reporting'
        ],
        confidentialityLevel: 'highly_confidential',
        deliveryMethod: 'secure_portal',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.crs_generated', {
        tenantId,
        clientId,
        reportId,
        reportingYear
      });

      return report;

    } catch (error: any) {
      logger.error('Error generating CRS report:', error);
      throw error;
    }
  }

  async generateFATCAReport(
    tenantId: string,
    clientId: string,
    clientName: string,
    reportData: FATCAReport,
    reportingYear: number
  ): Promise<ClientRegulatoryReport> {
    try {
      logger.info('Generating FATCA report', {
        tenantId,
        clientId,
        reportingYear
      });

      const reportId = randomUUID();
      
      const report: ClientRegulatoryReport = {
        id: reportId,
        tenantId,
        clientId,
        clientName,
        reportType: 'fatca',
        jurisdiction: 'US',
        reportingPeriod: {
          startDate: new Date(reportingYear, 0, 1),
          endDate: new Date(reportingYear, 11, 31)
        },
        reportData,
        status: 'draft',
        regulatoryRequirements: [
          'Foreign Account Tax Compliance Act',
          'US person identification',
          'Withholding tax compliance',
          'IRS reporting requirements'
        ],
        confidentialityLevel: 'highly_confidential',
        deliveryMethod: 'secure_portal',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.fatca_generated', {
        tenantId,
        clientId,
        reportId,
        reportingYear
      });

      return report;

    } catch (error: any) {
      logger.error('Error generating FATCA report:', error);
      throw error;
    }
  }

  async generateQIBCertification(
    tenantId: string,
    clientId: string,
    clientName: string,
    certificationData: QIBCertification
  ): Promise<ClientRegulatoryReport> {
    try {
      logger.info('Generating QIB certification', {
        tenantId,
        clientId,
        entityName: certificationData.entityName
      });

      const reportId = randomUUID();
      
      const report: ClientRegulatoryReport = {
        id: reportId,
        tenantId,
        clientId,
        clientName,
        reportType: 'qib_certification',
        jurisdiction: 'US',
        reportingPeriod: {
          startDate: certificationData.certificationDate,
          endDate: certificationData.expirationDate
        },
        reportData: certificationData,
        status: 'draft',
        regulatoryRequirements: [
          'Rule 144A QIB qualification',
          'Asset threshold verification',
          'Investment experience documentation',
          'Authorized signatory certification'
        ],
        confidentialityLevel: 'confidential',
        deliveryMethod: 'secure_portal',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.qib_generated', {
        tenantId,
        clientId,
        reportId,
        entityName: certificationData.entityName
      });

      return report;

    } catch (error: any) {
      logger.error('Error generating QIB certification:', error);
      throw error;
    }
  }

  async generateAMLSummary(
    tenantId: string,
    clientId: string,
    clientName: string,
    amlData: AMLSummary
  ): Promise<ClientRegulatoryReport> {
    try {
      logger.info('Generating AML summary', {
        tenantId,
        clientId,
        riskRating: amlData.clientRiskRating
      });

      const reportId = randomUUID();
      
      const report: ClientRegulatoryReport = {
        id: reportId,
        tenantId,
        clientId,
        clientName,
        reportType: 'aml_summary',
        jurisdiction: 'US',
        reportingPeriod: {
          startDate: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000), // Last year
          endDate: new Date()
        },
        reportData: amlData,
        status: 'draft',
        regulatoryRequirements: [
          'Bank Secrecy Act compliance',
          'Customer Due Diligence requirements',
          'Suspicious Activity Reporting',
          'PEP and sanctions screening'
        ],
        confidentialityLevel: 'highly_confidential',
        deliveryMethod: 'secure_portal',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.aml_generated', {
        tenantId,
        clientId,
        reportId,
        riskRating: amlData.clientRiskRating
      });

      return report;

    } catch (error: any) {
      logger.error('Error generating AML summary:', error);
      throw error;
    }
  }

  async generateSuitabilityAssessment(
    tenantId: string,
    clientId: string,
    clientName: string,
    suitabilityData: SuitabilityAssessment
  ): Promise<ClientRegulatoryReport> {
    try {
      logger.info('Generating suitability assessment', {
        tenantId,
        clientId,
        suitabilityScore: suitabilityData.suitabilityScore
      });

      const reportId = randomUUID();
      
      const report: ClientRegulatoryReport = {
        id: reportId,
        tenantId,
        clientId,
        clientName,
        reportType: 'suitability_assessment',
        jurisdiction: 'US',
        reportingPeriod: {
          startDate: suitabilityData.lastAssessment,
          endDate: suitabilityData.nextAssessmentDue
        },
        reportData: suitabilityData,
        status: 'draft',
        regulatoryRequirements: [
          'FINRA suitability requirements',
          'Investment objective alignment',
          'Risk tolerance assessment',
          'Financial situation verification'
        ],
        confidentialityLevel: 'confidential',
        deliveryMethod: 'secure_portal',
        generatedAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.suitability_generated', {
        tenantId,
        clientId,
        reportId,
        suitabilityScore: suitabilityData.suitabilityScore
      });

      return report;

    } catch (error: any) {
      logger.error('Error generating suitability assessment:', error);
      throw error;
    }
  }

  async validateClientReport(reportId: string): Promise<ClientReportValidationResult> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error('Client regulatory report not found');
      }

      logger.info('Validating client regulatory report', {
        reportId,
        reportType: report.reportType,
        clientId: report.clientId
      });

      const errors: ClientReportValidationResult['errors'] = [];
      const warnings: ClientReportValidationResult['warnings'] = [];
      const complianceChecks: ClientReportValidationResult['complianceChecks'] = [];

      // General validations
      if (!report.clientId || report.clientId.trim() === '') {
        errors.push({
          field: 'clientId',
          message: 'Client ID is required',
          severity: 'error'
        });
      }

      if (!report.clientName || report.clientName.trim() === '') {
        errors.push({
          field: 'clientName',
          message: 'Client name is required',
          severity: 'error'
        });
      }

      // Report-specific validations
      switch (report.reportType) {
        case 'crs':
          this.validateCRSReport(report.reportData, errors, warnings, complianceChecks);
          break;
        case 'fatca':
          this.validateFATCAReport(report.reportData, errors, warnings, complianceChecks);
          break;
        case 'qib_certification':
          this.validateQIBCertification(report.reportData, errors, warnings, complianceChecks);
          break;
        case 'aml_summary':
          this.validateAMLSummary(report.reportData, errors, warnings, complianceChecks);
          break;
        case 'suitability_assessment':
          this.validateSuitabilityAssessment(report.reportData, errors, warnings, complianceChecks);
          break;
      }

      // Update report status based on validation
      if (errors.length === 0) {
        report.status = 'review';
      } else {
        report.status = 'draft';
      }

      report.updatedAt = new Date();
      this.reports.set(reportId, report);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        complianceChecks
      };

    } catch (error: any) {
      logger.error('Error validating client regulatory report:', error);
      throw error;
    }
  }

  async deliverClientReport(
    reportId: string,
    deliveryOptions: ClientReportGenerationOptions['deliveryOptions'],
    deliveredBy: string
  ): Promise<ClientRegulatoryReport> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error('Client regulatory report not found');
      }

      if (report.status !== 'approved') {
        throw new Error('Report must be approved before delivery');
      }

      logger.info('Delivering client regulatory report', {
        reportId,
        reportType: report.reportType,
        clientId: report.clientId,
        deliveryMethod: deliveryOptions.method
      });

      // Mock delivery process
      await this.processReportDelivery(report, deliveryOptions);

      report.status = 'delivered';
      report.deliveredAt = new Date();
      report.deliveryMethod = deliveryOptions.method;
      report.updatedAt = new Date();

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.client_report.delivered', {
        tenantId: report.tenantId,
        clientId: report.clientId,
        reportId,
        reportType: report.reportType,
        deliveryMethod: deliveryOptions.method,
        deliveredBy
      });

      return report;

    } catch (error: any) {
      logger.error('Error delivering client regulatory report:', error);
      throw error;
    }
  }

  async approveClientReport(
    reportId: string,
    approvedBy: string
  ): Promise<ClientRegulatoryReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Client regulatory report not found');
    }

    if (report.status !== 'review') {
      throw new Error('Report must be in review status to approve');
    }

    report.status = 'approved';
    report.approvedBy = approvedBy;
    report.approvedAt = new Date();
    report.updatedAt = new Date();

    this.reports.set(reportId, report);

    await this.eventPublisher.publish('regulatory.client_report.approved', {
      tenantId: report.tenantId,
      clientId: report.clientId,
      reportId,
      reportType: report.reportType,
      approvedBy
    });

    return report;
  }

  async getClientReport(reportId: string): Promise<ClientRegulatoryReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getClientReportsByClient(clientId: string): Promise<ClientRegulatoryReport[]> {
    return Array.from(this.reports.values()).filter(report => report.clientId === clientId);
  }

  async getClientReportsByTenant(tenantId: string): Promise<ClientRegulatoryReport[]> {
    return Array.from(this.reports.values()).filter(report => report.tenantId === tenantId);
  }

  async generateBulkClientReports(
    tenantId: string,
    reportType: ClientRegulatoryReport['reportType'],
    clientIds: string[],
    reportingPeriod: { startDate: Date; endDate: Date }
  ): Promise<ClientRegulatoryReport[]> {
    try {
      logger.info('Generating bulk client reports', {
        tenantId,
        reportType,
        clientCount: clientIds.length
      });

      const reports: ClientRegulatoryReport[] = [];

      for (const clientId of clientIds) {
        // Mock client data retrieval and report generation
        const mockReportData = this.generateMockReportData(reportType, clientId, reportingPeriod);
        
        const report: ClientRegulatoryReport = {
          id: randomUUID(),
          tenantId,
          clientId,
          clientName: `Client ${clientId}`,
          reportType,
          jurisdiction: 'US',
          reportingPeriod,
          reportData: mockReportData,
          status: 'draft',
          regulatoryRequirements: this.getRegulatoryRequirements(reportType),
          confidentialityLevel: 'confidential',
          deliveryMethod: 'secure_portal',
          generatedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date()
        };

        this.reports.set(report.id, report);
        reports.push(report);
      }

      await this.eventPublisher.publish('regulatory.client_reports.bulk_generated', {
        tenantId,
        reportType,
        reportCount: reports.length
      });

      return reports;

    } catch (error: any) {
      logger.error('Error generating bulk client reports:', error);
      throw error;
    }
  }

  private validateCRSReport(
    data: CRSReport,
    errors: ClientReportValidationResult['errors'],
    warnings: ClientReportValidationResult['warnings'],
    complianceChecks: ClientReportValidationResult['complianceChecks']
  ): void {
    if (!data.accountHolderInfo.name) {
      errors.push({ field: 'accountHolderInfo.name', message: 'Account holder name is required', severity: 'error' });
    }

    if (!data.accountHolderInfo.taxResidence || data.accountHolderInfo.taxResidence.length === 0) {
      errors.push({ field: 'accountHolderInfo.taxResidence', message: 'Tax residence is required', severity: 'error' });
    }

    if (!data.accountHolderInfo.tin || data.accountHolderInfo.tin.length === 0) {
      warnings.push({ field: 'accountHolderInfo.tin', message: 'Tax identification number is recommended' });
    }

    complianceChecks.push({
      requirement: 'Account holder identification',
      status: data.accountHolderInfo.name ? 'met' : 'not_met',
      details: 'Account holder must be properly identified'
    });

    complianceChecks.push({
      requirement: 'Tax residency determination',
      status: data.accountHolderInfo.taxResidence.length > 0 ? 'met' : 'not_met',
      details: 'Tax residency must be determined and documented'
    });
  }

  private validateFATCAReport(
    data: FATCAReport,
    errors: ClientReportValidationResult['errors'],
    warnings: ClientReportValidationResult['warnings'],
    complianceChecks: ClientReportValidationResult['complianceChecks']
  ): void {
    if (!data.accountHolderInfo.name) {
      errors.push({ field: 'accountHolderInfo.name', message: 'Account holder name is required', severity: 'error' });
    }

    if (data.accountHolderInfo.usPersonIndicators.length === 0) {
      warnings.push({ field: 'accountHolderInfo.usPersonIndicators', message: 'US person indicators should be documented' });
    }

    complianceChecks.push({
      requirement: 'US person identification',
      status: data.accountHolderInfo.usPersonIndicators.length > 0 ? 'met' : 'partial',
      details: 'US person indicators must be identified and documented'
    });
  }

  private validateQIBCertification(
    data: QIBCertification,
    errors: ClientReportValidationResult['errors'],
    warnings: ClientReportValidationResult['warnings'],
    complianceChecks: ClientReportValidationResult['complianceChecks']
  ): void {
    if (data.totalAssets < 100000000) { // $100M threshold
      errors.push({ field: 'totalAssets', message: 'Total assets must be at least $100M for QIB qualification', severity: 'error' });
    }

    if (!data.authorizedSignatory.signature) {
      errors.push({ field: 'authorizedSignatory.signature', message: 'Authorized signatory signature is required', severity: 'error' });
    }

    complianceChecks.push({
      requirement: 'Asset threshold compliance',
      status: data.totalAssets >= 100000000 ? 'met' : 'not_met',
      details: 'QIB must have at least $100M in assets'
    });
  }

  private validateAMLSummary(
    data: AMLSummary,
    errors: ClientReportValidationResult['errors'],
    warnings: ClientReportValidationResult['warnings'],
    complianceChecks: ClientReportValidationResult['complianceChecks']
  ): void {
    if (!data.customerDueDiligence.identityVerified) {
      errors.push({ field: 'customerDueDiligence.identityVerified', message: 'Customer identity must be verified', severity: 'error' });
    }

    if (!data.customerDueDiligence.sanctionsCheck) {
      errors.push({ field: 'customerDueDiligence.sanctionsCheck', message: 'Sanctions screening is required', severity: 'error' });
    }

    complianceChecks.push({
      requirement: 'Customer Due Diligence completion',
      status: data.customerDueDiligence.identityVerified && data.customerDueDiligence.sanctionsCheck ? 'met' : 'not_met',
      details: 'Customer due diligence must be completed and documented'
    });
  }

  private validateSuitabilityAssessment(
    data: SuitabilityAssessment,
    errors: ClientReportValidationResult['errors'],
    warnings: ClientReportValidationResult['warnings'],
    complianceChecks: ClientReportValidationResult['complianceChecks']
  ): void {
    if (data.investmentObjectives.length === 0) {
      errors.push({ field: 'investmentObjectives', message: 'Investment objectives are required', severity: 'error' });
    }

    if (data.financialSituation.netWorth <= 0) {
      warnings.push({ field: 'financialSituation.netWorth', message: 'Net worth should be properly assessed' });
    }

    complianceChecks.push({
      requirement: 'Investment objectives documentation',
      status: data.investmentObjectives.length > 0 ? 'met' : 'not_met',
      details: 'Client investment objectives must be documented'
    });

    complianceChecks.push({
      requirement: 'Financial situation assessment',
      status: data.financialSituation.netWorth > 0 ? 'met' : 'partial',
      details: 'Client financial situation must be assessed'
    });
  }

  private async processReportDelivery(
    report: ClientRegulatoryReport,
    deliveryOptions: ClientReportGenerationOptions['deliveryOptions']
  ): Promise<any> {
    // Mock delivery process
    logger.info('Processing report delivery', {
      reportId: report.id,
      method: deliveryOptions.method,
      encrypted: deliveryOptions.encryptionRequired
    });

    // Simulate delivery processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  private determineJurisdiction(taxResidence: string[]): ClientRegulatoryReport['jurisdiction'] {
    if (taxResidence.includes('US')) return 'US';
    if (taxResidence.some(r => ['DE', 'FR', 'IT', 'ES', 'NL'].includes(r))) return 'EU';
    if (taxResidence.includes('GB')) return 'UK';
    if (taxResidence.includes('CA')) return 'CA';
    if (taxResidence.includes('AU')) return 'AU';
    if (taxResidence.includes('JP')) return 'JP';
    return 'INTERNATIONAL';
  }

  private generateMockReportData(
    reportType: ClientRegulatoryReport['reportType'],
    clientId: string,
    reportingPeriod: { startDate: Date; endDate: Date }
  ): any {
    switch (reportType) {
      case 'crs':
        return {
          accountNumber: `ACC-${clientId}`,
          accountHolderInfo: {
            name: `Client ${clientId}`,
            address: '123 Main St, City, State 12345',
            taxResidence: ['US'],
            tin: [`TIN-${clientId}`],
            dateOfBirth: new Date('1980-01-01'),
            placeOfBirth: 'New York, NY'
          },
          accountBalance: 1000000,
          income: {
            dividends: 25000,
            interest: 15000,
            capitalGains: 50000,
            other: 5000
          },
          reportingYear: reportingPeriod.endDate.getFullYear()
        };
      default:
        return {};
    }
  }

  private getRegulatoryRequirements(reportType: ClientRegulatoryReport['reportType']): string[] {
    switch (reportType) {
      case 'crs':
        return ['OECD Common Reporting Standard', 'Automatic Exchange of Information'];
      case 'fatca':
        return ['Foreign Account Tax Compliance Act', 'IRS reporting requirements'];
      case 'qib_certification':
        return ['Rule 144A QIB qualification', 'Asset threshold verification'];
      case 'aml_summary':
        return ['Bank Secrecy Act compliance', 'Customer Due Diligence requirements'];
      case 'suitability_assessment':
        return ['FINRA suitability requirements', 'Investment objective alignment'];
      default:
        return [];
    }
  }
}

