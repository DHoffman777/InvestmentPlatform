import { randomUUID } from 'crypto';
import { GIPSComposite } from '../../models/regulatory/Regulatory';
import { logger } from '../../utils/logger';
import { EventPublisher } from '../../utils/eventPublisher';

interface GIPSCompositeCreationData {
  tenantId: string;
  compositeName: string;
  compositeDescription: string;
  benchmarkName: string;
  benchmarkDescription: string;
  investmentObjective: string;
  investmentStrategy: string;
  investmentUniverse: string;
  inclusionCriteria: string[];
  exclusionCriteria: string[];
  significantCashFlowThreshold: number;
  significantCashFlowMethod: 'temporary_removal' | 'revaluation';
  minimumPortfolioSize?: number;
  feeSchedule: {
    description: string;
    feeStructure: Array<{
      assetRange: string;
      annualFee: number;
    }>;
  };
}

interface GIPSPerformanceData {
  year: number;
  compositeGrossReturn: number;
  compositeNetReturn: number;
  benchmarkReturn: number;
  numberOfPortfolios: number;
  compositeAssets: number;
  totalFirmAssets: number;
  compositeStandardDeviation?: number;
  benchmarkStandardDeviation?: number;
  percentage3YearStandardDeviation?: number;
  compositeDispersion?: number;
}

interface GIPSValidationResult {
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
  complianceStatus: {
    gipsCompliant: boolean;
    missingRequirements: string[];
    recommendedActions: string[];
  };
  completionPercentage: number;
}

interface GIPSReport {
  composite: GIPSComposite;
  performanceSummary: {
    annualizedReturns: {
      oneYear?: number;
      threeYear?: number;
      fiveYear?: number;
      tenYear?: number;
      sinceInception: number;
    };
    riskMetrics: {
      standardDeviation: number;
      sharpeRatio: number;
      trackingError: number;
      informationRatio: number;
    };
    benchmarkComparison: {
      outperformancePeriods: number;
      averageOutperformance: number;
      correlationToBenchmark: number;
    };
  };
  complianceChecklist: {
    requirement: string;
    status: 'compliant' | 'non_compliant' | 'not_applicable';
    notes?: string;
  }[];
}

export class GIPSCompositeService {
  private eventPublisher: EventPublisher;
  private composites: Map<string, GIPSComposite> = new Map();

  constructor() {
    this.eventPublisher = new EventPublisher();
  }

  async createComposite(data: GIPSCompositeCreationData): Promise<GIPSComposite> {
    try {
      logger.info('Creating GIPS composite', {
        tenantId: data.tenantId,
        compositeName: data.compositeName
      });

      const compositeId = randomUUID();
      
      const composite: GIPSComposite = {
        id: compositeId,
        tenantId: data.tenantId,
        compositeName: data.compositeName,
        compositeDescription: data.compositeDescription,
        compositeCreationDate: new Date(),
        benchmarkName: data.benchmarkName,
        benchmarkDescription: data.benchmarkDescription,
        
        definition: {
          investmentObjective: data.investmentObjective,
          investmentStrategy: data.investmentStrategy,
          investmentUniverse: data.investmentUniverse,
          inclusionCriteria: data.inclusionCriteria,
          exclusionCriteria: data.exclusionCriteria,
          significantCashFlowPolicy: {
            threshold: data.significantCashFlowThreshold,
            method: data.significantCashFlowMethod
          }
        },
        
        performanceData: [], // Will be populated as data is added
        
        additionalInfo: {
          feeSchedule: data.feeSchedule,
          minimumPortfolioSize: data.minimumPortfolioSize,
          tradingExpensePolicy: 'Trading expenses are included in gross-of-fees returns and excluded from net-of-fees returns',
          valuationPolicy: 'Portfolios are valued using fair value pricing methodologies consistent with GIPS requirements',
          significantEvents: []
        },
        
        compliance: {
          gipsCompliant: false, // Will be determined through validation
          complianceBeginDate: new Date(),
          claimOfCompliance: `[Firm Name] claims compliance with the Global Investment Performance Standards (GIPS®) and has prepared and presented this report in compliance with the GIPS standards. [Firm Name] has been independently verified for the periods [Date Range].`
        },
        
        status: 'active',
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.composites.set(compositeId, composite);

      await this.eventPublisher.publish('regulatory.gips_composite.created', {
        tenantId: data.tenantId,
        compositeId,
        compositeName: data.compositeName
      });

      return composite;

    } catch (error) {
      logger.error('Error creating GIPS composite:', error);
      throw error;
    }
  }

  async addPerformanceData(
    compositeId: string,
    performanceData: GIPSPerformanceData[]
  ): Promise<GIPSComposite> {
    try {
      const composite = this.composites.get(compositeId);
      if (!composite) {
        throw new Error('GIPS composite not found');
      }

      logger.info('Adding performance data to GIPS composite', {
        compositeId,
        periodsAdded: performanceData.length
      });

      // Validate performance data
      for (const data of performanceData) {
        this.validatePerformanceData(data);
      }

      // Merge with existing data, avoiding duplicates
      const existingYears = new Set(composite.performanceData.map(d => d.year));
      const newData = performanceData.filter(data => !existingYears.has(data.year));
      
      composite.performanceData = [...composite.performanceData, ...newData]
        .sort((a, b) => a.year - b.year);

      // Calculate derived metrics for new data
      for (const data of newData) {
        if (composite.performanceData.length >= 3) {
          data.percentage3YearStandardDeviation = this.calculate3YearStandardDeviation(
            composite.performanceData,
            data.year
          );
        }

        if (data.numberOfPortfolios > 1) {
          data.compositeDispersion = this.calculateCompositeDispersion(
            data.compositeGrossReturn,
            data.numberOfPortfolios
          );
        }
      }

      composite.updatedAt = new Date();
      this.composites.set(compositeId, composite);

      await this.eventPublisher.publish('regulatory.gips_composite.performance_updated', {
        tenantId: composite.tenantId,
        compositeId,
        periodsAdded: newData.length
      });

      return composite;

    } catch (error) {
      logger.error('Error adding performance data to GIPS composite:', error);
      throw error;
    }
  }

  async validateComposite(compositeId: string): Promise<GIPSValidationResult> {
    try {
      const composite = this.composites.get(compositeId);
      if (!composite) {
        throw new Error('GIPS composite not found');
      }

      logger.info('Validating GIPS composite', {
        compositeId,
        compositeName: composite.compositeName
      });

      const errors: GIPSValidationResult['errors'] = [];
      const warnings: GIPSValidationResult['warnings'] = [];
      const missingRequirements: string[] = [];
      const recommendedActions: string[] = [];

      // Composite Definition Validations
      if (!composite.definition.investmentObjective || composite.definition.investmentObjective.trim().length < 10) {
        errors.push({
          section: 'Definition',
          field: 'investmentObjective',
          message: 'Investment objective must be clearly defined with at least 10 characters',
          severity: 'error'
        });
        missingRequirements.push('Clear investment objective');
      }

      if (!composite.definition.investmentStrategy || composite.definition.investmentStrategy.trim().length < 20) {
        errors.push({
          section: 'Definition',
          field: 'investmentStrategy',
          message: 'Investment strategy must be detailed with at least 20 characters',
          severity: 'error'
        });
        missingRequirements.push('Detailed investment strategy');
      }

      if (composite.definition.inclusionCriteria.length === 0) {
        errors.push({
          section: 'Definition',
          field: 'inclusionCriteria',
          message: 'At least one inclusion criterion is required',
          severity: 'error'
        });
        missingRequirements.push('Inclusion criteria');
      }

      // Performance Data Validations
      if (composite.performanceData.length === 0) {
        errors.push({
          section: 'Performance',
          field: 'performanceData',
          message: 'At least one year of performance data is required',
          severity: 'error'
        });
        missingRequirements.push('Performance data');
      } else {
        // Check for minimum required history
        const currentYear = new Date().getFullYear();
        const hasMinimumHistory = composite.performanceData.some(d => d.year <= currentYear - 1);
        
        if (!hasMinimumHistory) {
          warnings.push({
            section: 'Performance',
            field: 'performanceData',
            message: 'GIPS requires at least one full year of compliant performance history'
          });
          recommendedActions.push('Ensure complete calendar year performance data');
        }

        // Check for data consistency
        for (const data of composite.performanceData) {
          if (data.compositeGrossReturn < data.compositeNetReturn) {
            errors.push({
              section: 'Performance',
              field: `performanceData[${data.year}]`,
              message: `Gross return cannot be less than net return for year ${data.year}`,
              severity: 'error'
            });
          }

          if (data.numberOfPortfolios <= 0) {
            errors.push({
              section: 'Performance',
              field: `performanceData[${data.year}]`,
              message: `Number of portfolios must be greater than zero for year ${data.year}`,
              severity: 'error'
            });
          }

          if (data.compositeAssets <= 0) {
            errors.push({
              section: 'Performance',
              field: `performanceData[${data.year}]`,
              message: `Composite assets must be greater than zero for year ${data.year}`,
              severity: 'error'
            });
          }

          // Check for missing standard deviation (required for periods after 2011)
          if (data.year >= 2011 && data.compositeStandardDeviation === undefined) {
            warnings.push({
              section: 'Performance',
              field: `performanceData[${data.year}]`,
              message: `Standard deviation is required for periods after 2010 (year ${data.year})`
            });
            recommendedActions.push('Calculate and provide standard deviation for all applicable periods');
          }

          // Check for missing dispersion (required when composite has multiple portfolios)
          if (data.numberOfPortfolios > 1 && data.compositeDispersion === undefined) {
            warnings.push({
              section: 'Performance',
              field: `performanceData[${data.year}]`,
              message: `Composite dispersion is required when composite contains multiple portfolios (year ${data.year})`
            });
            recommendedActions.push('Calculate composite dispersion for multi-portfolio periods');
          }
        }
      }

      // Fee Schedule Validations
      if (!composite.additionalInfo.feeSchedule || composite.additionalInfo.feeSchedule.feeStructure.length === 0) {
        errors.push({
          section: 'AdditionalInfo',
          field: 'feeSchedule',
          message: 'Fee schedule is required for GIPS compliance',
          severity: 'error'
        });
        missingRequirements.push('Fee schedule');
      }

      // Compliance Validations
      if (!composite.compliance.claimOfCompliance.includes('GIPS')) {
        warnings.push({
          section: 'Compliance',
          field: 'claimOfCompliance',
          message: 'Claim of compliance should reference GIPS standards'
        });
        recommendedActions.push('Update claim of compliance to reference GIPS standards');
      }

      // Benchmark Validations
      if (!composite.benchmarkName || !composite.benchmarkDescription) {
        warnings.push({
          section: 'Benchmark',
          field: 'benchmark',
          message: 'Benchmark name and description should be provided'
        });
        recommendedActions.push('Define appropriate benchmark for the composite');
      }

      // Calculate compliance status
      const gipsCompliant = errors.length === 0 && missingRequirements.length === 0;
      
      // Update composite compliance status
      composite.compliance.gipsCompliant = gipsCompliant;
      composite.updatedAt = new Date();
      this.composites.set(compositeId, composite);

      // Calculate completion percentage
      const totalRequiredItems = 15; // Simplified count of major GIPS requirements
      const completedItems = totalRequiredItems - errors.length - missingRequirements.length;
      const completionPercentage = Math.max(0, (completedItems / totalRequiredItems) * 100);

      const validationResult: GIPSValidationResult = {
        isValid: errors.length === 0,
        errors,
        warnings,
        complianceStatus: {
          gipsCompliant,
          missingRequirements,
          recommendedActions
        },
        completionPercentage
      };

      return validationResult;

    } catch (error) {
      logger.error('Error validating GIPS composite:', error);
      throw error;
    }
  }

  async generateGIPSReport(compositeId: string): Promise<GIPSReport> {
    try {
      const composite = this.composites.get(compositeId);
      if (!composite) {
        throw new Error('GIPS composite not found');
      }

      logger.info('Generating GIPS report', {
        compositeId,
        compositeName: composite.compositeName
      });

      // Calculate annualized returns
      const returns = composite.performanceData.map(d => d.compositeGrossReturn);
      const performanceSummary = {
        annualizedReturns: {
          oneYear: returns.length >= 1 ? returns[returns.length - 1] : undefined,
          threeYear: returns.length >= 3 ? this.calculateAnnualizedReturn(returns.slice(-3)) : undefined,
          fiveYear: returns.length >= 5 ? this.calculateAnnualizedReturn(returns.slice(-5)) : undefined,
          tenYear: returns.length >= 10 ? this.calculateAnnualizedReturn(returns.slice(-10)) : undefined,
          sinceInception: this.calculateAnnualizedReturn(returns)
        },
        riskMetrics: {
          standardDeviation: this.calculateStandardDeviation(returns),
          sharpeRatio: this.calculateSharpeRatio(returns),
          trackingError: this.calculateTrackingError(composite.performanceData),
          informationRatio: this.calculateInformationRatio(composite.performanceData)
        },
        benchmarkComparison: {
          outperformancePeriods: this.calculateOutperformancePeriods(composite.performanceData),
          averageOutperformance: this.calculateAverageOutperformance(composite.performanceData),
          correlationToBenchmark: this.calculateCorrelation(composite.performanceData)
        }
      };

      // Generate compliance checklist
      const complianceChecklist = this.generateComplianceChecklist(composite);

      return {
        composite,
        performanceSummary,
        complianceChecklist
      };

    } catch (error) {
      logger.error('Error generating GIPS report:', error);
      throw error;
    }
  }

  async getComposite(compositeId: string): Promise<GIPSComposite | null> {
    return this.composites.get(compositeId) || null;
  }

  async getCompositesByTenant(tenantId: string): Promise<GIPSComposite[]> {
    return Array.from(this.composites.values()).filter(composite => composite.tenantId === tenantId);
  }

  async updateComposite(compositeId: string, updates: Partial<GIPSComposite>): Promise<GIPSComposite> {
    const composite = this.composites.get(compositeId);
    if (!composite) {
      throw new Error('GIPS composite not found');
    }

    const updatedComposite = {
      ...composite,
      ...updates,
      updatedAt: new Date()
    };

    this.composites.set(compositeId, updatedComposite);

    await this.eventPublisher.publish('regulatory.gips_composite.updated', {
      tenantId: composite.tenantId,
      compositeId,
      compositeName: composite.compositeName
    });

    return updatedComposite;
  }

  async terminateComposite(
    compositeId: string,
    terminationDate: Date,
    reason: string
  ): Promise<GIPSComposite> {
    const composite = this.composites.get(compositeId);
    if (!composite) {
      throw new Error('GIPS composite not found');
    }

    composite.status = 'terminated';
    composite.additionalInfo.significantEvents = composite.additionalInfo.significantEvents || [];
    composite.additionalInfo.significantEvents.push({
      date: terminationDate,
      description: `Composite terminated: ${reason}`,
      impact: 'Composite discontinued as of this date'
    });
    composite.updatedAt = new Date();

    this.composites.set(compositeId, composite);

    await this.eventPublisher.publish('regulatory.gips_composite.terminated', {
      tenantId: composite.tenantId,
      compositeId,
      compositeName: composite.compositeName,
      terminationDate,
      reason
    });

    return composite;
  }

  private validatePerformanceData(data: GIPSPerformanceData): void {
    if (!data.year || data.year < 1900 || data.year > new Date().getFullYear()) {
      throw new Error(`Invalid year: ${data.year}`);
    }

    if (typeof data.compositeGrossReturn !== 'number') {
      throw new Error(`Invalid composite gross return for year ${data.year}`);
    }

    if (typeof data.compositeNetReturn !== 'number') {
      throw new Error(`Invalid composite net return for year ${data.year}`);
    }

    if (data.compositeGrossReturn < data.compositeNetReturn) {
      throw new Error(`Gross return cannot be less than net return for year ${data.year}`);
    }

    if (data.numberOfPortfolios <= 0) {
      throw new Error(`Number of portfolios must be positive for year ${data.year}`);
    }

    if (data.compositeAssets <= 0 || data.totalFirmAssets <= 0) {
      throw new Error(`Asset values must be positive for year ${data.year}`);
    }

    if (data.compositeAssets > data.totalFirmAssets) {
      throw new Error(`Composite assets cannot exceed total firm assets for year ${data.year}`);
    }
  }

  private calculate3YearStandardDeviation(performanceData: GIPSPerformanceData[], year: number): number {
    const relevantData = performanceData
      .filter(d => d.year >= year - 2 && d.year <= year)
      .map(d => d.compositeGrossReturn);
    
    if (relevantData.length !== 3) return 0;
    
    return this.calculateStandardDeviation(relevantData);
  }

  private calculateCompositeDispersion(compositeReturn: number, numberOfPortfolios: number): number {
    // Mock dispersion calculation - in reality, this would use individual portfolio returns
    const baseDispersion = Math.abs(compositeReturn) * 0.1; // 10% of absolute return as base
    const portfolioFactor = Math.min(1, numberOfPortfolios / 10); // Scale with number of portfolios
    return baseDispersion * portfolioFactor;
  }

  private calculateAnnualizedReturn(returns: number[]): number {
    if (returns.length === 0) return 0;
    if (returns.length === 1) return returns[0];
    
    const compoundReturn = returns.reduce((product, ret) => product * (1 + ret / 100), 1);
    return (Math.pow(compoundReturn, 1 / returns.length) - 1) * 100;
  }

  private calculateStandardDeviation(returns: number[]): number {
    if (returns.length < 2) return 0;
    
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (returns.length - 1);
    return Math.sqrt(variance);
  }

  private calculateSharpeRatio(returns: number[], riskFreeRate: number = 2.0): number {
    if (returns.length === 0) return 0;
    
    const avgReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
    const stdDev = this.calculateStandardDeviation(returns);
    
    return stdDev > 0 ? (avgReturn - riskFreeRate) / stdDev : 0;
  }

  private calculateTrackingError(performanceData: GIPSPerformanceData[]): number {
    if (performanceData.length < 2) return 0;
    
    const excessReturns = performanceData.map(d => d.compositeGrossReturn - d.benchmarkReturn);
    return this.calculateStandardDeviation(excessReturns);
  }

  private calculateInformationRatio(performanceData: GIPSPerformanceData[]): number {
    if (performanceData.length === 0) return 0;
    
    const excessReturns = performanceData.map(d => d.compositeGrossReturn - d.benchmarkReturn);
    const avgExcessReturn = excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
    const trackingError = this.calculateStandardDeviation(excessReturns);
    
    return trackingError > 0 ? avgExcessReturn / trackingError : 0;
  }

  private calculateOutperformancePeriods(performanceData: GIPSPerformanceData[]): number {
    return performanceData.filter(d => d.compositeGrossReturn > d.benchmarkReturn).length;
  }

  private calculateAverageOutperformance(performanceData: GIPSPerformanceData[]): number {
    if (performanceData.length === 0) return 0;
    
    const excessReturns = performanceData.map(d => d.compositeGrossReturn - d.benchmarkReturn);
    return excessReturns.reduce((sum, ret) => sum + ret, 0) / excessReturns.length;
  }

  private calculateCorrelation(performanceData: GIPSPerformanceData[]): number {
    if (performanceData.length < 2) return 0;
    
    const compositeReturns = performanceData.map(d => d.compositeGrossReturn);
    const benchmarkReturns = performanceData.map(d => d.benchmarkReturn);
    
    const n = compositeReturns.length;
    const sumComposite = compositeReturns.reduce((sum, ret) => sum + ret, 0);
    const sumBenchmark = benchmarkReturns.reduce((sum, ret) => sum + ret, 0);
    const sumCompositeSq = compositeReturns.reduce((sum, ret) => sum + ret * ret, 0);
    const sumBenchmarkSq = benchmarkReturns.reduce((sum, ret) => sum + ret * ret, 0);
    const sumProduct = compositeReturns.reduce((sum, ret, i) => sum + ret * benchmarkReturns[i], 0);
    
    const numerator = n * sumProduct - sumComposite * sumBenchmark;
    const denominator = Math.sqrt((n * sumCompositeSq - sumComposite * sumComposite) * (n * sumBenchmarkSq - sumBenchmark * sumBenchmark));
    
    return denominator > 0 ? numerator / denominator : 0;
  }

  private generateComplianceChecklist(composite: GIPSComposite): GIPSReport['complianceChecklist'] {
    return [
      {
        requirement: 'Composite definition clearly stated',
        status: composite.definition.investmentObjective && composite.definition.investmentStrategy ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Inclusion/exclusion criteria documented',
        status: composite.definition.inclusionCriteria.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Fee schedule disclosed',
        status: composite.additionalInfo.feeSchedule ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Gross-of-fees returns presented',
        status: composite.performanceData.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Net-of-fees returns presented',
        status: composite.performanceData.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Benchmark returns presented',
        status: composite.performanceData.length > 0 && composite.benchmarkName ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Number of portfolios disclosed',
        status: composite.performanceData.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Composite assets disclosed',
        status: composite.performanceData.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Total firm assets disclosed',
        status: composite.performanceData.length > 0 ? 'compliant' : 'non_compliant'
      },
      {
        requirement: 'Standard deviation presented (if required)',
        status: composite.performanceData.some(d => d.year >= 2011 && d.compositeStandardDeviation !== undefined) ? 'compliant' : 'not_applicable'
      },
      {
        requirement: 'Composite dispersion presented (if applicable)',
        status: composite.performanceData.some(d => d.numberOfPortfolios > 1 && d.compositeDispersion !== undefined) ? 'compliant' : 'not_applicable'
      },
      {
        requirement: 'Claim of compliance included',
        status: composite.compliance.claimOfCompliance.includes('GIPS') ? 'compliant' : 'non_compliant'
      }
    ];
  }
}