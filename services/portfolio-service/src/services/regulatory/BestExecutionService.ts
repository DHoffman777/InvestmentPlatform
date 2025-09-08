import { randomUUID } from 'crypto';
import { BestExecutionReport, FilingStatus, RegulatoryFiling, FormType, RegulatoryJurisdiction } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface ExecutionVenueData {
  venueId: string;
  venueName: string;
  venueType: 'exchange' | 'dark_pool' | 'market_maker' | 'ecn' | 'ats' | 'other';
  orderFlow: {
    totalOrders: number;
    totalShares: number;
    totalNotionalValue: number;
    marketOrders: number;
    limitOrders: number;
    otherOrders: number;
  };
  executionMetrics: {
    priceImprovement: number;
    marketableOrderFillRate: number;
    nonMarketableOrderFillRate: number;
    averageEffectiveSpread: number;
    averageRealizedSpread: number;
    priceImprovementRate: number;
  };
}

interface BestExecutionReportData {
  tenantId: string;
  reportingPeriod: {
    startDate: Date;
    endDate: Date;
  };
  reportType: 'quarterly' | 'annual' | 'ad_hoc';
  executionVenues: ExecutionVenueData[];
  orderAnalysis: {
    totalOrders: number;
    ordersByAssetClass: Array<{
      assetClass: string;
      orderCount: number;
      shareVolume: number;
      notionalValue: number;
    }>;
    ordersBySize: Array<{
      sizeRange: string;
      orderCount: number;
      averageExecutionQuality: number;
    }>;
    ordersByTimeOfDay: Array<{
      timeRange: string;
      orderCount: number;
      executionQuality: number;
    }>;
  };
  conflictsOfInterest?: {
    identified: boolean;
    description?: string;
    mitigationMeasures?: string[];
  };
}

interface BestExecutionValidationResult {
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
  analysisResults: {
    totalExecutionValue: number;
    venueConcentration: number;
    averageExecutionQuality: number;
    complianceScore: number;
  };
}

interface ExecutionQualityMetrics {
  implementation_shortfall: number;
  volume_weighted_average_price_variance: number;
  effective_spread: number;
  realized_spread: number;
  price_improvement_opportunity: number;
  market_impact: number;
  timing_risk: number;
  opportunity_cost: number;
}

export class BestExecutionService {
  private eventPublisher: EventPublisher;
  private reports: Map<string, BestExecutionReport> = new Map();
  private filings: Map<string, RegulatoryFiling> = new Map();

  constructor() {
    this.eventPublisher = new EventPublisher('BestExecution');
  }

  async createBestExecutionReport(data: BestExecutionReportData): Promise<BestExecutionReport> {
    try {
      logger.info('Creating best execution report', {
        tenantId: data.tenantId,
        reportType: data.reportType,
        startDate: data.reportingPeriod.startDate,
        endDate: data.reportingPeriod.endDate,
        venuesCount: data.executionVenues.length
      });

      const reportId = randomUUID();
      
      // Calculate execution quality metrics
      const executionQualityMetrics = this.calculateExecutionQualityMetrics(data.executionVenues);
      
      const report: BestExecutionReport = {
        id: reportId,
        tenantId: data.tenantId,
        reportingPeriod: data.reportingPeriod,
        reportType: data.reportType,
        
        executionVenues: data.executionVenues.map(venue => ({
          venueId: venue.venueId,
          venueName: venue.venueName,
          venueType: venue.venueType,
          executionQuality: {
            priceImprovement: venue.executionMetrics.priceImprovement,
            marketableOrderFillRate: venue.executionMetrics.marketableOrderFillRate,
            nonMarketableOrderFillRate: venue.executionMetrics.nonMarketableOrderFillRate,
            averageEffectiveSpread: venue.executionMetrics.averageEffectiveSpread,
            averageRealizedSpread: venue.executionMetrics.averageRealizedSpread,
            priceImprovementRate: venue.executionMetrics.priceImprovementRate
          },
          orderFlow: venue.orderFlow
        })),
        
        orderAnalysis: data.orderAnalysis,
        
        bestExecutionAnalysis: {
          executionQualityMetrics,
          venueSelection: {
            primaryFactors: [
              'Price improvement opportunity',
              'Fill rates and execution speed',
              'Market impact and liquidity',
              'Transaction costs',
              'Venue reliability and technology'
            ],
            selectionProcess: 'Venues are selected based on quantitative analysis of execution quality metrics, historical performance, and suitability for specific order characteristics.',
            regularReviewProcess: 'Venue performance is reviewed monthly with comprehensive analysis conducted quarterly. Venue selection criteria are updated based on changing market conditions and regulatory requirements.'
          },
          conflictsOfInterest: data.conflictsOfInterest || {
            identified: false
          }
        },
        
        regulatoryInfo: {
          rule605Compliance: true,
          rule606Compliance: true,
          mifidIICompliance: false, // Default for US-based reporting
          additionalRequirements: []
        },
        
        status: FilingStatus.DRAFT,
        submittedBy: '',
        
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.reports.set(reportId, report);

      await this.eventPublisher.publish('regulatory.best_execution.report_created', {
        tenantId: data.tenantId,
        reportId,
        reportType: data.reportType,
        venuesAnalyzed: data.executionVenues.length
      });

      return report;

    } catch (error: any) {
      logger.error('Error creating best execution report:', error);
      throw error;
    }
  }

  async validateBestExecutionReport(reportId: string): Promise<BestExecutionValidationResult> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error('Best execution report not found');
      }

      logger.info('Validating best execution report', {
        reportId,
        reportType: report.reportType,
        venuesCount: report.executionVenues.length
      });

      const errors: BestExecutionValidationResult['errors'] = [];
      const warnings: BestExecutionValidationResult['warnings'] = [];

      // Reporting Period Validations
      const reportingDays = Math.ceil(
        (report.reportingPeriod.endDate.getTime() - report.reportingPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (reportingDays <= 0) {
        errors.push({
          section: 'ReportingPeriod',
          field: 'dateRange',
          message: 'End date must be after start date',
          severity: 'error'
        });
      }

      if (report.reportType === 'quarterly' && (reportingDays < 85 || reportingDays > 95)) {
        warnings.push({
          section: 'ReportingPeriod',
          field: 'dateRange',
          message: 'Quarterly reports should cover approximately 90 days'
        });
      }

      if (report.reportType === 'annual' && (reportingDays < 360 || reportingDays > 370)) {
        warnings.push({
          section: 'ReportingPeriod',
          field: 'dateRange',
          message: 'Annual reports should cover approximately 365 days'
        });
      }

      // Execution Venues Validations
      if (report.executionVenues.length === 0) {
        errors.push({
          section: 'ExecutionVenues',
          field: 'venues',
          message: 'At least one execution venue is required',
          severity: 'error'
        });
      }

      let totalExecutionValue = 0;
      let totalOrders = 0;

      report.executionVenues.forEach((venue, index) => {
        // Venue identification validations
        if (!venue.venueName || venue.venueName.trim().length === 0) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].venueName`,
            message: 'Venue name is required',
            severity: 'error'
          });
        }

        if (!venue.venueId || venue.venueId.trim().length === 0) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].venueId`,
            message: 'Venue ID is required',
            severity: 'error'
          });
        }

        // Order flow validations
        const orderFlow = venue.orderFlow;
        if (orderFlow.totalOrders <= 0) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].orderFlow.totalOrders`,
            message: 'Total orders must be greater than zero',
            severity: 'error'
          });
        }

        if (orderFlow.totalShares <= 0) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].orderFlow.totalShares`,
            message: 'Total shares must be greater than zero',
            severity: 'error'
          });
        }

        if (orderFlow.totalNotionalValue <= 0) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].orderFlow.totalNotionalValue`,
            message: 'Total notional value must be greater than zero',
            severity: 'error'
          });
        }

        // Order type consistency check
        const orderTypeSum = orderFlow.marketOrders + orderFlow.limitOrders + orderFlow.otherOrders;
        if (Math.abs(orderTypeSum - orderFlow.totalOrders) > orderFlow.totalOrders * 0.01) {
          warnings.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].orderFlow`,
            message: `Order type breakdown doesn't match total orders for venue ${venue.venueName}`
          });
        }

        // Execution quality validations
        const quality = venue.executionQuality;
        if (quality.marketableOrderFillRate < 0 || quality.marketableOrderFillRate > 100) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].executionQuality.marketableOrderFillRate`,
            message: 'Fill rate must be between 0 and 100',
            severity: 'error'
          });
        }

        if (quality.priceImprovementRate < 0 || quality.priceImprovementRate > 100) {
          errors.push({
            section: 'ExecutionVenues',
            field: `venues[${index}].executionQuality.priceImprovementRate`,
            message: 'Price improvement rate must be between 0 and 100',
            severity: 'error'
          });
        }

        totalExecutionValue += orderFlow.totalNotionalValue;
        totalOrders += orderFlow.totalOrders;
      });

      // Order Analysis Validations
      if (report.orderAnalysis.totalOrders !== totalOrders) {
        warnings.push({
          section: 'OrderAnalysis',
          field: 'totalOrders',
          message: 'Total orders in analysis should match sum of venue order flows'
        });
      }

      // Asset class analysis validation
      const assetClassTotal = report.orderAnalysis.ordersByAssetClass.reduce(
        (sum, ac) => sum + ac.orderCount, 0
      );
      if (Math.abs(assetClassTotal - report.orderAnalysis.totalOrders) > report.orderAnalysis.totalOrders * 0.05) {
        warnings.push({
          section: 'OrderAnalysis',
          field: 'ordersByAssetClass',
          message: 'Asset class breakdown should account for most orders'
        });
      }

      // Size analysis validation
      const sizeTotal = report.orderAnalysis.ordersBySize.reduce(
        (sum, size) => sum + size.orderCount, 0
      );
      if (Math.abs(sizeTotal - report.orderAnalysis.totalOrders) > report.orderAnalysis.totalOrders * 0.05) {
        warnings.push({
          section: 'OrderAnalysis',
          field: 'ordersBySize',
          message: 'Size breakdown should account for most orders'
        });
      }

      // Best Execution Analysis Validations
      if (!report.bestExecutionAnalysis.venueSelection.selectionProcess || 
          report.bestExecutionAnalysis.venueSelection.selectionProcess.length < 50) {
        warnings.push({
          section: 'BestExecutionAnalysis',
          field: 'venueSelection.selectionProcess',
          message: 'Venue selection process should be thoroughly documented'
        });
      }

      if (report.bestExecutionAnalysis.venueSelection.primaryFactors.length < 3) {
        warnings.push({
          section: 'BestExecutionAnalysis',
          field: 'venueSelection.primaryFactors',
          message: 'At least 3 primary factors should be considered for venue selection'
        });
      }

      // Calculate analysis results
      const venueConcentration = this.calculateVenueConcentration(report.executionVenues as ExecutionVenueData[]);
      const averageExecutionQuality = this.calculateAverageExecutionQuality(report.executionVenues as ExecutionVenueData[]);
      const complianceScore = this.calculateComplianceScore(errors.length, warnings.length);

      // Calculate completion percentage
      const totalRequiredFields = 20; // Simplified count
      const completedFields = totalRequiredFields - errors.length;
      const completionPercentage = Math.max(0, (completedFields / totalRequiredFields) * 100);

      // Update report status
      if (errors.length === 0 && completionPercentage >= 90) {
        report.status = FilingStatus.REVIEW;
      } else {
        report.status = FilingStatus.DRAFT;
      }

      report.updatedAt = new Date();
      this.reports.set(reportId, report);

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        completionPercentage,
        analysisResults: {
          totalExecutionValue,
          venueConcentration,
          averageExecutionQuality,
          complianceScore
        }
      };

    } catch (error: any) {
      logger.error('Error validating best execution report:', error);
      throw error;
    }
  }

  async submitBestExecutionReport(
    reportId: string,
    submittedBy: string
  ): Promise<RegulatoryFiling> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error('Best execution report not found');
      }

      logger.info('Submitting best execution report', {
        reportId,
        reportType: report.reportType,
        submittedBy
      });

      // Validate report before submission
      const validation = await this.validateBestExecutionReport(reportId);
      if (!validation.isValid) {
        throw new Error('Best execution report validation failed. Please correct errors before submission.');
      }

      // Create regulatory filing record
      const filingId = randomUUID();
      const filing: RegulatoryFiling = {
        id: filingId,
        tenantId: report.tenantId,
        formType: FormType.FORM_ADV, // Best execution reports are typically part of ADV requirements
        jurisdiction: RegulatoryJurisdiction.SEC,
        filingDate: new Date(),
        reportingPeriodEnd: report.reportingPeriod.endDate,
        dueDate: this.calculateDueDate(report.reportType, report.reportingPeriod.endDate),
        formData: report,
        status: FilingStatus.FILED,
        workflowStage: 'confirmation',
        reviewers: [],
        attachments: [],
        complianceChecks: [{
          checkType: 'best_execution_analysis',
          status: 'passed',
          message: 'Best execution analysis completed successfully',
          checkedAt: new Date()
        }],
        auditTrail: [{
          action: 'report_submitted',
          performedBy: submittedBy,
          performedAt: new Date(),
          details: {
            reportType: report.reportType,
            venuesAnalyzed: report.executionVenues.length,
            totalExecutionValue: validation.analysisResults.totalExecutionValue
          }
        }],
        createdBy: submittedBy,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      // Update report status
      report.status = FilingStatus.FILED;
      report.submittedBy = submittedBy;
      report.submittedAt = new Date();
      report.updatedAt = new Date();

      this.reports.set(reportId, report);
      this.filings.set(filingId, filing);

      await this.eventPublisher.publish('regulatory.best_execution.report_submitted', {
        tenantId: report.tenantId,
        reportId,
        filingId,
        reportType: report.reportType,
        submittedBy
      });

      return filing;

    } catch (error: any) {
      logger.error('Error submitting best execution report:', error);
      throw error;
    }
  }

  async generateExecutionQualityAnalysis(reportId: string): Promise<{
    overallMetrics: ExecutionQualityMetrics;
    venueComparison: Array<{
      venueName: string;
      venueType: string;
      executionScore: number;
      strengths: string[];
      improvements: string[];
      recommendation: 'increase' | 'maintain' | 'decrease' | 'discontinue';
    }>;
    recommendations: {
      immediate: string[];
      shortTerm: string[];
      longTerm: string[];
    };
    benchmarkComparison: {
      industryAverages: Record<string, number>;
      relativePerformance: 'above_market' | 'at_market' | 'below_market';
      improvementOpportunities: string[];
    };
  }> {
    try {
      const report = this.reports.get(reportId);
      if (!report) {
        throw new Error('Best execution report not found');
      }

      // Calculate overall execution quality metrics
      const overallMetrics = report.bestExecutionAnalysis.executionQualityMetrics;

      // Analyze each venue
      const venueComparison = report.executionVenues.map(venue => {
        const quality = venue.executionQuality;
        const executionScore = this.calculateVenueExecutionScore(quality);
        
        const strengths: string[] = [];
        const improvements: string[] = [];

        if (quality.priceImprovementRate > 15) strengths.push('High price improvement rate');
        if (quality.marketableOrderFillRate > 95) strengths.push('Excellent fill rates');
        if (quality.averageEffectiveSpread < 0.005) strengths.push('Tight spreads');

        if (quality.priceImprovementRate < 5) improvements.push('Low price improvement opportunity');
        if (quality.marketableOrderFillRate < 85) improvements.push('Fill rates below benchmark');
        if (quality.averageEffectiveSpread > 0.01) improvements.push('Wide effective spreads');

        let recommendation: 'increase' | 'maintain' | 'decrease' | 'discontinue' = 'maintain';
        if (executionScore > 80) recommendation = 'increase';
        else if (executionScore < 50) recommendation = 'decrease';
        else if (executionScore < 30) recommendation = 'discontinue';

        return {
          venueName: venue.venueName,
          venueType: venue.venueType,
          executionScore,
          strengths,
          improvements,
          recommendation
        };
      });

      // Generate recommendations
      const recommendations = {
        immediate: [
          'Review venues with execution scores below 50',
          'Investigate venues with fill rates below 85%',
          'Analyze price improvement opportunities at top venues'
        ],
        shortTerm: [
          'Conduct venue performance review with top 3 venues',
          'Implement execution quality monitoring dashboard',
          'Establish monthly venue performance review process'
        ],
        longTerm: [
          'Develop algorithmic venue selection based on order characteristics',
          'Establish direct market access for high-volume orders',
          'Implement real-time execution quality monitoring'
        ]
      };

      // Mock benchmark comparison (would integrate with industry data in reality)
      const benchmarkComparison = {
        industryAverages: {
          priceImprovement: 8.5,
          fillRate: 92.3,
          effectiveSpread: 0.0075,
          implementationShortfall: 0.45
        },
        relativePerformance: overallMetrics.implementation_shortfall < 0.45 ? 
          'above_market' as const : 'at_market' as const,
        improvementOpportunities: [
          'Enhanced smart order routing algorithms',
          'Real-time venue performance monitoring',
          'Improved order timing strategies'
        ]
      };

      return {
        overallMetrics: overallMetrics as ExecutionQualityMetrics,
        venueComparison,
        recommendations,
        benchmarkComparison
      };

    } catch (error: any) {
      logger.error('Error generating execution quality analysis:', error);
      throw error;
    }
  }

  async getBestExecutionReport(reportId: string): Promise<BestExecutionReport | null> {
    return this.reports.get(reportId) || null;
  }

  async getBestExecutionReportsByTenant(tenantId: string): Promise<BestExecutionReport[]> {
    return Array.from(this.reports.values()).filter(report => report.tenantId === tenantId);
  }

  async updateBestExecutionReport(
    reportId: string,
    updates: Partial<BestExecutionReport>
  ): Promise<BestExecutionReport> {
    const report = this.reports.get(reportId);
    if (!report) {
      throw new Error('Best execution report not found');
    }

    const updatedReport = {
      ...report,
      ...updates,
      updatedAt: new Date()
    };

    this.reports.set(reportId, updatedReport);

    await this.eventPublisher.publish('regulatory.best_execution.report_updated', {
      tenantId: report.tenantId,
      reportId
    });

    return updatedReport;
  }

  private calculateExecutionQualityMetrics(venues: ExecutionVenueData[]): ExecutionQualityMetrics {
    if (venues.length === 0) {
      return {
        implementation_shortfall: 0,
        volume_weighted_average_price_variance: 0,
        effective_spread: 0,
        realized_spread: 0,
        price_improvement_opportunity: 0,
        market_impact: 0,
        timing_risk: 0,
        opportunity_cost: 0
      };
    }

    // Weight venues by their notional value
    const totalNotional = venues.reduce((sum, venue) => sum + venue.orderFlow.totalNotionalValue, 0);
    
    // Calculate weighted averages
    const weightedMetrics = venues.reduce((acc, venue) => {
      const weight = venue.orderFlow.totalNotionalValue / totalNotional;
      
      return {
        implementation_shortfall: acc.implementation_shortfall + (0.4 * weight), // Mock calculation
        volume_weighted_average_price_variance: acc.volume_weighted_average_price_variance + (venue.executionMetrics.averageEffectiveSpread * weight),
        effective_spread: acc.effective_spread + (venue.executionMetrics.averageEffectiveSpread * weight),
        realized_spread: acc.realized_spread + (venue.executionMetrics.averageRealizedSpread * weight),
        price_improvement_opportunity: acc.price_improvement_opportunity + (venue.executionMetrics.priceImprovement * weight),
        market_impact: acc.market_impact + (0.15 * weight), // Mock calculation
        timing_risk: acc.timing_risk + (0.08 * weight), // Mock calculation
        opportunity_cost: acc.opportunity_cost + (0.12 * weight) // Mock calculation
      };
    }, {
      implementation_shortfall: 0,
      volume_weighted_average_price_variance: 0,
      effective_spread: 0,
      realized_spread: 0,
      price_improvement_opportunity: 0,
      market_impact: 0,
      timing_risk: 0,
      opportunity_cost: 0
    });

    return weightedMetrics;
  }

  private calculateVenueConcentration(venues: ExecutionVenueData[]): number {
    if (venues.length === 0) return 0;

    const totalValue = venues.reduce((sum, venue) => sum + venue.orderFlow.totalNotionalValue, 0);
    const shares = venues.map(venue => (venue.orderFlow.totalNotionalValue / totalValue) * 100);
    
    // Calculate Herfindahl-Hirschman Index
    return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
  }

  private calculateAverageExecutionQuality(venues: ExecutionVenueData[]): number {
    if (venues.length === 0) return 0;

    const totalNotional = venues.reduce((sum, venue) => sum + venue.orderFlow.totalNotionalValue, 0);
    
    return venues.reduce((weightedSum, venue) => {
      const weight = venue.orderFlow.totalNotionalValue / totalNotional;
      const venueScore = this.calculateVenueExecutionScore(venue.executionMetrics);
      return weightedSum + (venueScore * weight);
    }, 0);
  }

  private calculateVenueExecutionScore(metrics: ExecutionVenueData['executionMetrics']): number {
    // Weighted scoring of execution quality metrics
    const priceImprovementScore = Math.min(100, metrics.priceImprovementRate * 5); // 0-100
    const fillRateScore = metrics.marketableOrderFillRate; // Already 0-100
    const spreadScore = Math.max(0, 100 - (metrics.averageEffectiveSpread * 10000)); // Lower is better
    
    return (priceImprovementScore * 0.4) + (fillRateScore * 0.4) + (spreadScore * 0.2);
  }

  private calculateComplianceScore(errorCount: number, warningCount: number): number {
    const maxScore = 100;
    const errorPenalty = errorCount * 15;
    const warningPenalty = warningCount * 5;
    
    return Math.max(0, maxScore - errorPenalty - warningPenalty);
  }

  private calculateDueDate(reportType: BestExecutionReport['reportType'], periodEnd: Date): Date {
    const dueDate = new Date(periodEnd);
    
    switch (reportType) {
      case 'quarterly':
        dueDate.setDate(dueDate.getDate() + 30); // 30 days after quarter end
        break;
      case 'annual':
        dueDate.setDate(dueDate.getDate() + 60); // 60 days after year end
        break;
      case 'ad_hoc':
        dueDate.setDate(dueDate.getDate() + 15); // 15 days
        break;
    }
    
    return dueDate;
  }
}
