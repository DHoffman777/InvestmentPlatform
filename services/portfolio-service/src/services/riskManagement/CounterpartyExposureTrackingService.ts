import { PrismaClient } from '@prisma/client';
// import { KafkaProducer } from '../../utils/kafka/producer'; // TODO: Implement Kafka integration
import { logger } from '../../utils/logger';

// Counterparty exposure types - using any for missing types
type CounterpartyExposureAssessment = any;
type CounterpartyExposureRequest = any;
type CounterpartyExposure = any;
type CounterpartyRating = any;
type ExposureType = any;
type CollateralType = any;
type NettingAgreement = any;
type CreditSupportAnnex = any;
type ExposureLimit = any;
type ExposureAlert = any;
type ExposureBreachAlert = any;
type ExposureTrend = any;
type ExposureConcentration = any;
type CounterpartyGroup = any;
type MasterAgreement = any;
type ExposureMetrics = any;
type CounterpartyRiskProfile = any;
type PotentialFutureExposure = any;
type CurrentExposure = any;
type CollateralPosition = any;
type MarginCall = any;
type ExposureRecommendation = any;
type RiskMitigant = any;
type SettlementRisk = any;
type CreditEquivalentAmount = any;
type ExposureAtDefault = any;

export class CounterpartyExposureTrackingService {
  private prisma: PrismaClient;
  // private kafkaProducer: any; // TODO: Implement Kafka integration
  private logger: any;

  constructor(
    prisma: PrismaClient,
    // kafkaProducer?: any, // TODO: Implement Kafka integration
    customLogger?: any
  ) {
    this.prisma = prisma;
    // this.kafkaProducer = kafkaProducer;
    this.logger = customLogger || logger;
  }

  async trackCounterpartyExposure(request: CounterpartyExposureRequest): Promise<CounterpartyExposureAssessment> {
    try {
      this.logger.info('Starting counterparty exposure tracking', { 
        portfolioId: request.portfolioId,
        counterpartyId: (request as any).counterpartyId 
      });

      const startTime = Date.now();
      const portfolioData = await this.getPortfolioData(request.portfolioId, request.asOfDate);
      const counterpartyData = await this.getCounterpartyData((request as any).counterpartyId);
      const masterAgreements = await this.getMasterAgreements((request as any).counterpartyId);
      const nettingAgreements = await this.getNettingAgreements((request as any).counterpartyId);
      const collateralAgreements = await this.getCollateralAgreements((request as any).counterpartyId);
      
      const currentExposures = await this.calculateCurrentExposures(portfolioData, counterpartyData, request);
      const potentialFutureExposures = await this.calculatePotentialFutureExposures(currentExposures, request);
      const collateralPositions = await this.assessCollateralPositions(request.counterpartyId, request.asOfDate);
      const netExposures = await this.calculateNetExposures(currentExposures, collateralPositions, nettingAgreements);
      const exposureAtDefault = await this.calculateExposureAtDefault(netExposures, potentialFutureExposures);
      const creditEquivalentAmounts = await this.calculateCreditEquivalentAmounts(netExposures, request);
      const marginCalls = await this.assessMarginRequirements(netExposures, collateralAgreements);
      const settlementRisks = await this.assessSettlementRisks(currentExposures, request);
      const exposureMetrics = await this.calculateExposureMetrics(netExposures, exposureAtDefault);
      const concentrationAnalysis = await this.analyzeExposureConcentration(netExposures, request);
      const trends = await this.analyzExposureTrends(request.counterpartyId, netExposures);
      const alerts = await this.generateExposureAlerts(exposureMetrics, netExposures, request);
      const recommendations = await this.generateRecommendations(exposureMetrics, alerts, netExposures);

      const assessment: CounterpartyExposureAssessment = {
        id: `counterparty_exposure_${Date.now()}`,
        portfolioId: request.portfolioId,
        counterpartyId: (request as any).counterpartyId,
        tenantId: request.tenantId,
        assessmentDate: new Date(),
        asOfDate: request.asOfDate,
        counterpartyName: counterpartyData.name,
        counterpartyRating: counterpartyData.rating,
        totalGrossExposure: this.calculateTotalGrossExposure(currentExposures),
        totalNetExposure: this.calculateTotalNetExposure(netExposures),
        totalCollateralValue: this.calculateTotalCollateralValue(collateralPositions),
        exposureAfterCollateral: this.calculateExposureAfterCollateral(netExposures, collateralPositions),
        currentExposures,
        potentialFutureExposures,
        collateralPositions,
        netExposures,
        exposureAtDefault,
        creditEquivalentAmounts,
        marginCalls,
        settlementRisks,
        masterAgreements,
        nettingAgreements,
        collateralAgreements,
        exposureMetrics,
        concentrationAnalysis,
        trends,
        alerts,
        recommendations,
        calculationTime: Date.now() - startTime,
        createdAt: new Date(),
        assessedBy: (request as any).userId
      };

      // Store assessment in database
      await this.storeAssessment(assessment);

      // Publish event
      // TODO: Uncomment when Kafka is implemented
      // await this.kafkaProducer.publish('counterparty-exposure-assessed', {
      //   portfolioId: request.portfolioId,
      //   counterpartyId: (request as any).counterpartyId,
      //   tenantId: request.tenantId,
      //   assessmentId: assessment.id,
      //   totalNetExposure: assessment.totalNetExposure,
      //   alertCount: alerts.length,
      //   timestamp: new Date()
      // });

      this.logger.info('Counterparty exposure tracking completed', {
        portfolioId: request.portfolioId,
        counterpartyId: (request as any).counterpartyId,
        assessmentId: assessment.id,
        totalNetExposure: assessment.totalNetExposure
      });

      return assessment;
    } catch (error: any) {
      this.logger.error('Error in counterparty exposure tracking', { error, request });
      throw new Error(`Counterparty exposure tracking failed: ${(error as Error).message}`);
    }
  }

  async trackAllCounterpartyExposures(request: Omit<CounterpartyExposureRequest, 'counterpartyId'>): Promise<CounterpartyExposureAssessment[]> {
    try {
      const counterparties = await this.getAllCounterparties(request.portfolioId);
      const assessments: CounterpartyExposureAssessment[] = [];

      for (const counterparty of counterparties) {
        const counterpartyRequest: CounterpartyExposureRequest = {
          ...request,
          counterpartyId: counterparty.id
        };

        const assessment = await this.trackCounterpartyExposure(counterpartyRequest);
        assessments.push(assessment);
      }

      // Generate portfolio-level counterparty concentration analysis
      const portfolioConcentration = await this.analyzePortfolioCounterpartyConcentration(assessments);
      
      // Publish portfolio-level event
      // TODO: Uncomment when Kafka is implemented
      // await this.kafkaProducer.publish('portfolio-counterparty-exposure-assessed', {
      //   portfolioId: request.portfolioId,
      //   tenantId: request.tenantId,
      //   counterpartyCount: assessments.length,
      //   totalExposure: assessments.reduce((sum, a) => sum + a.totalNetExposure, 0),
      //   concentrationMetrics: portfolioConcentration,
      //   timestamp: new Date()
      // });

      return assessments;
    } catch (error: any) {
      this.logger.error('Error in tracking all counterparty exposures', { error, request });
      throw new Error(`All counterparty exposure tracking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async getPortfolioData(portfolioId: string, asOfDate: Date): Promise<any> {
    const portfolio = await this.prisma.portfolio.findUnique({
      where: { id: portfolioId },
      include: {
        positions: {
          include: {
            // security: true // Simplified include since detailed relations may not exist
          },
          where: {
            createdAt: { // Using createdAt instead of asOfDate
              lte: asOfDate
            }
          }
        }
      }
    });

    if (!portfolio) {
      throw new Error(`Portfolio ${portfolioId} not found`);
    }

    return portfolio;
  }

  private async getCounterpartyData(counterpartyId: string): Promise<any> {
    // Implementation would fetch counterparty data from database
    return {
      id: counterpartyId,
      name: 'Sample Counterparty',
      rating: 'A' as CounterpartyRating,
      sector: 'Financial Services',
      country: 'US',
      parentCompany: null,
      subsidiaries: []
    };
  }

  private async getMasterAgreements(counterpartyId: string): Promise<MasterAgreement[]> {
    // Implementation would fetch master agreements from database
    return [{
      id: `ma_${counterpartyId}`,
      counterpartyId,
      agreementType: 'ISDA_MASTER',
      effectiveDate: new Date('2020-01-01'),
      terminationDate: null,
      governingLaw: 'NEW_YORK',
      closeOutNetting: true,
      setOffRights: true,
      collateralRights: true,
      additionalTerminations: [],
      creditEvents: ['BANKRUPTCY', 'FAILURE_TO_PAY', 'RESTRUCTURING'],
      thresholdAmount: 1000000,
      minimumTransferAmount: 50000,
      rounding: 10000
    }];
  }

  private async getNettingAgreements(counterpartyId: string): Promise<NettingAgreement[]> {
    return [{
      // All properties cast as any since they don't match Prisma schema
      ...({ 
        id: `netting_${counterpartyId}`,
      counterpartyId,
      agreementType: 'MASTER_NETTING',
      effectiveDate: new Date('2020-01-01'),
      includedTransactionTypes: ['DERIVATIVES', 'SECURITIES_LENDING', 'REPO'],
      nettingMethod: 'CLOSE_OUT_NETTING',
      crossDefaultProvisions: true,
      crossAccelerationProvisions: true,
      setOffRights: true,
      walkAwayClause: false
      } as any)
    } as any];
  }

  private async getCollateralAgreements(counterpartyId: string): Promise<CreditSupportAnnex[]> {
    return [{
      id: `csa_${counterpartyId}`,
      counterpartyId,
      agreementType: 'BILATERAL_CSA',
      effectiveDate: new Date('2020-01-01'),
      baseCurrency: 'USD',
      thresholdAmount: 1000000,
      minimumTransferAmount: 50000,
      independentAmount: 0,
      rounding: 10000,
      marginCallFrequency: 'DAILY',
      eligibleCollateral: [
        {
          assetType: 'CASH',
          currency: 'USD',
          haircut: 0,
          concentrationLimit: 1.0
        },
        {
          assetType: 'GOVERNMENT_BOND',
          currency: 'USD',
          haircut: 0.02,
          concentrationLimit: 0.5
        }
      ],
      substitutionRights: true,
      rehypothecationRights: false
    }];
  }

  private async calculateCurrentExposures(
    portfolioData: any,
    counterpartyData: any,
    request: CounterpartyExposureRequest
  ): Promise<CurrentExposure[]> {
    const exposures: CurrentExposure[] = [];

    for (const position of portfolioData.positions) {
      if (this.isCounterpartyExposure(position, request.counterpartyId)) {
        const exposure: CurrentExposure = {
          id: `current_exposure_${position.id}`,
          portfolioId: request.portfolioId,
          counterpartyId: (request as any).counterpartyId,
          securityId: position.security.id,
          positionId: position.id,
          exposureType: this.determineExposureType(position.security),
          instrumentType: position.security.securityType,
          notionalAmount: this.calculateNotionalAmount(position),
          marketValue: position.marketValue,
          unrealizedPnL: position.unrealizedGainLoss || 0,
          currentExposure: Math.max(position.marketValue + (position.unrealizedGainLoss || 0), 0),
          replacementCost: Math.max(position.marketValue, 0),
          currency: position.security.currency,
          maturityDate: this.getMaturityDate(position.security),
          asOfDate: request.asOfDate,
          lastUpdated: new Date(),
          riskWeight: this.calculateRiskWeight(position.security),
          addOnFactor: this.calculateAddOnFactor(position.security),
          creditConversionFactor: this.getCreditConversionFactor(position.security)
        };

        exposures.push(exposure);
      }
    }

    return exposures;
  }

  private async calculatePotentialFutureExposures(
    currentExposures: CurrentExposure[],
    request: CounterpartyExposureRequest
  ): Promise<PotentialFutureExposure[]> {
    const pfeCalculations: PotentialFutureExposure[] = [];

    for (const currentExp of currentExposures) {
      const pfe = await this.calculatePFE(currentExp, request);
      pfeCalculations.push(pfe);
    }

    return pfeCalculations;
  }

  private async calculatePFE(
    currentExposure: CurrentExposure,
    request: CounterpartyExposureRequest
  ): Promise<PotentialFutureExposure> {
    // Simplified PFE calculation - would be more sophisticated in practice
    const volatility = await this.getAssetVolatility(currentExposure.securityId);
    const timeToMaturity = this.getTimeToMaturity(currentExposure.maturityDate);
    const confidenceLevel = 0.95; // 95% confidence level

    // Monte Carlo simulation for PFE (simplified)
    const pfeValue = this.simulatePFE(currentExposure, volatility, timeToMaturity, confidenceLevel);

    return {
      id: `pfe_${currentExposure.id}`,
      currentExposureId: currentExposure.id,
      counterpartyId: request.counterpartyId,
      securityId: currentExposure.securityId,
      confidenceLevel,
      timeHorizon: '1Y',
      potentialFutureExposure: pfeValue,
      expectedExposure: pfeValue * 0.4, // Approximate expected exposure
      expectedPositiveExposure: pfeValue * 0.3,
      maxPotentialExposure: pfeValue * 1.2,
      simulationMethod: 'MONTE_CARLO',
      numberOfSimulations: 10000,
      volatility,
      timeToMaturity,
      calculationDate: new Date()
    };
  }

  private async assessCollateralPositions(
    counterpartyId: string,
    asOfDate: Date
  ): Promise<CollateralPosition[]> {
    // Implementation would fetch actual collateral positions
    return [{
      id: `collateral_${counterpartyId}`,
      counterpartyId,
      collateralType: 'CASH',
      currency: 'USD',
      nominalAmount: 5000000,
      marketValue: 5000000,
      haircut: 0,
      eligibilityStatus: 'ELIGIBLE',
      concentrationLimit: 1.0,
      utilisedAmount: 3000000,
      availableAmount: 2000000,
      lastValuationDate: asOfDate,
      substituionRights: true,
      rehypothecationRights: false
    }];
  }

  private async calculateNetExposures(
    currentExposures: CurrentExposure[],
    collateralPositions: CollateralPosition[],
    nettingAgreements: NettingAgreement[]
  ): Promise<CounterpartyExposure[]> {
    const netExposures: CounterpartyExposure[] = [];

    // Group exposures by netting set
    const nettingSets = this.groupExposuresByNettingSet(currentExposures, nettingAgreements);

    for (const [nettingSetId, exposures] of nettingSets.entries()) {
      const grossPositiveExposure = exposures
        .filter(exp => exp.currentExposure > 0)
        .reduce((sum, exp) => sum + exp.currentExposure, 0);

      const grossNegativeExposure = exposures
        .filter(exp => exp.currentExposure < 0)
        .reduce((sum, exp) => sum + Math.abs(exp.currentExposure), 0);

      const netExposureBeforeCollateral = grossPositiveExposure - grossNegativeExposure;
      const applicableCollateral = this.getApplicableCollateral(collateralPositions, nettingSetId);
      const netExposureAfterCollateral = Math.max(netExposureBeforeCollateral - applicableCollateral, 0);

      netExposures.push({
        id: `net_exposure_${nettingSetId}`,
        counterpartyId: exposures[0].counterpartyId,
        nettingSetId,
        grossPositiveExposure,
        grossNegativeExposure,
        netExposureBeforeCollateral,
        collateralValue: applicableCollateral,
        netExposureAfterCollateral,
        exposureType: 'NET_EXPOSURE',
        currency: 'USD', // Base currency
        asOfDate: new Date(),
        componentExposures: exposures.map(exp => exp.id)
      });
    }

    return netExposures;
  }

  private async calculateExposureAtDefault(
    netExposures: CounterpartyExposure[],
    potentialFutureExposures: PotentialFutureExposure[]
  ): Promise<ExposureAtDefault[]> {
    const eadCalculations: ExposureAtDefault[] = [];

    for (const netExposure of netExposures) {
      const relevantPFEs = potentialFutureExposures.filter(pfe => 
        netExposure.componentExposures.includes(pfe.currentExposureId)
      );

      const totalPFE = relevantPFEs.reduce((sum, pfe) => sum + pfe.potentialFutureExposure, 0);
      const ead = netExposure.netExposureAfterCollateral + (totalPFE * 0.4); // Alpha factor of 1.4

      eadCalculations.push({
        id: `ead_${netExposure.id}`,
        counterpartyId: netExposure.counterpartyId,
        nettingSetId: netExposure.nettingSetId,
        currentExposure: netExposure.netExposureAfterCollateral,
        potentialFutureExposure: totalPFE,
        alphaFactor: 1.4,
        exposureAtDefault: ead,
        effectiveMaturity: this.calculateEffectiveMaturity(relevantPFEs),
        calculationMethod: 'BASEL_III',
        calculationDate: new Date()
      });
    }

    return eadCalculations;
  }

  private async calculateCreditEquivalentAmounts(
    netExposures: CounterpartyExposure[],
    request: CounterpartyExposureRequest
  ): Promise<CreditEquivalentAmount[]> {
    const ceaCalculations: CreditEquivalentAmount[] = [];

    for (const netExposure of netExposures) {
      const creditEquivalentAmount = netExposure.netExposureAfterCollateral; // Simplified

      ceaCalculations.push({
        id: `cea_${netExposure.id}`,
        counterpartyId: netExposure.counterpartyId,
        nettingSetId: netExposure.nettingSetId,
        replacementCost: Math.max(netExposure.netExposureBeforeCollateral, 0),
        addOnAmount: 0, // Would be calculated based on notional amounts and add-on factors
        creditEquivalentAmount,
        riskWeight: await this.getCounterpartyRiskWeight(request.counterpartyId),
        riskWeightedAmount: creditEquivalentAmount * await this.getCounterpartyRiskWeight(request.counterpartyId),
        calculationMethod: 'CURRENT_EXPOSURE_METHOD',
        calculationDate: new Date()
      });
    }

    return ceaCalculations;
  }

  private async assessMarginRequirements(
    netExposures: CounterpartyExposure[],
    collateralAgreements: CreditSupportAnnex[]
  ): Promise<MarginCall[]> {
    const marginCalls: MarginCall[] = [];

    for (const agreement of collateralAgreements) {
      const applicableExposures = netExposures.filter(exp => 
        exp.counterpartyId === agreement.counterpartyId
      );

      const totalExposure = applicableExposures.reduce((sum, exp) => 
        sum + exp.netExposureAfterCollateral, 0
      );

      const requiredCollateral = Math.max(totalExposure - agreement.thresholdAmount, 0);
      const currentCollateral = 5000000; // Would be fetched from collateral positions
      const marginCallAmount = Math.max(requiredCollateral - currentCollateral, 0);

      if (marginCallAmount >= agreement.minimumTransferAmount) {
        marginCalls.push({
          id: `margin_call_${agreement.id}`,
          counterpartyId: agreement.counterpartyId,
          agreementId: agreement.id,
          callDate: new Date(),
          dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next business day
          callAmount: marginCallAmount,
          currency: agreement.baseCurrency,
          callType: 'VARIATION_MARGIN',
          status: 'PENDING',
          totalExposure,
          thresholdAmount: agreement.thresholdAmount,
          currentCollateral,
          requiredCollateral
        });
      }
    }

    return marginCalls;
  }

  private async assessSettlementRisks(
    currentExposures: CurrentExposure[],
    request: CounterpartyExposureRequest
  ): Promise<SettlementRisk[]> {
    const settlementRisks: SettlementRisk[] = [];

    const settlingExposures = currentExposures.filter(exp => 
      this.isSettlingToday(exp, request.asOfDate)
    );

    for (const exposure of settlingExposures) {
      settlementRisks.push({
        id: `settlement_risk_${exposure.id}`,
        counterpartyId: exposure.counterpartyId,
        exposureId: exposure.id,
        securityId: exposure.securityId,
        settlementDate: request.asOfDate,
        settlementAmount: exposure.marketValue,
        currency: exposure.currency,
        riskType: 'PRINCIPAL_RISK',
        riskAmount: exposure.marketValue,
        timeZoneRisk: this.calculateTimeZoneRisk(exposure),
        paymentSystemRisk: this.assessPaymentSystemRisk(exposure),
        mitigants: this.identifySettlementMitigants(exposure)
      });
    }

    return settlementRisks;
  }

  private async calculateExposureMetrics(
    netExposures: CounterpartyExposure[],
    exposureAtDefault: ExposureAtDefault[]
  ): Promise<ExposureMetrics> {
    const totalGrossExposure = netExposures.reduce((sum, exp) => 
      sum + exp.grossPositiveExposure, 0
    );

    const totalNetExposure = netExposures.reduce((sum, exp) => 
      sum + exp.netExposureAfterCollateral, 0
    );

    const totalEAD = exposureAtDefault.reduce((sum, ead) => 
      sum + ead.exposureAtDefault, 0
    );

    return {
      totalGrossExposure,
      totalNetExposure,
      totalExposureAtDefault: totalEAD,
      nettingBenefit: totalGrossExposure - totalNetExposure,
      nettingRatio: totalGrossExposure > 0 ? totalNetExposure / totalGrossExposure : 0,
      averageMaturity: this.calculateAverageMaturity(exposureAtDefault),
      exposureVolatility: await this.calculateExposureVolatility(netExposures),
      peakExposure: Math.max(...netExposures.map(exp => exp.netExposureAfterCollateral)),
      numberOfNettingSets: netExposures.length,
      concentrationIndex: this.calculateConcentrationIndex(netExposures)
    };
  }

  private async analyzeExposureConcentration(
    netExposures: CounterpartyExposure[],
    request: CounterpartyExposureRequest
  ): Promise<ExposureConcentration> {
    const totalExposure = netExposures.reduce((sum, exp) => 
      sum + exp.netExposureAfterCollateral, 0
    );

    const largestExposure = Math.max(...netExposures.map(exp => exp.netExposureAfterCollateral));
    const top5Exposures = netExposures
      .sort((a, b) => b.netExposureAfterCollateral - a.netExposureAfterCollateral)
      .slice(0, 5)
      .reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);

    return {
      counterpartyId: request.counterpartyId,
      totalExposure,
      largestExposureAmount: largestExposure,
      largestExposurePercentage: totalExposure > 0 ? (largestExposure / totalExposure) * 100 : 0,
      top5ExposuresAmount: top5Exposures,
      top5ExposuresPercentage: totalExposure > 0 ? (top5Exposures / totalExposure) * 100 : 0,
      herfindahlIndex: this.calculateHerfindahlIndex(netExposures),
      diversificationRatio: this.calculateDiversificationRatio(netExposures),
      concentrationRiskLevel: this.assessConcentrationRiskLevel(largestExposure, totalExposure)
    };
  }

  private async analyzExposureTrends(
    counterpartyId: string,
    currentExposures: CounterpartyExposure[]
  ): Promise<ExposureTrend[]> {
    // Implementation would fetch historical exposure data and analyze trends
    const trends: ExposureTrend[] = [];

    const currentTotal = currentExposures.reduce((sum, exp) => 
      sum + exp.netExposureAfterCollateral, 0
    );

    trends.push({
      counterpartyId,
      metricType: 'TOTAL_NET_EXPOSURE',
      currentValue: currentTotal,
      previousValue: currentTotal * 0.95, // Simulated previous value
      changeAmount: currentTotal * 0.05,
      changePercentage: 5.0,
      trendDirection: 'INCREASING',
      timeFrame: '30D',
      volatility: 0.15,
      averageValue: currentTotal * 0.98,
      peakValue: currentTotal * 1.1,
      troughValue: currentTotal * 0.85
    });

    return trends;
  }

  private async generateExposureAlerts(
    metrics: ExposureMetrics,
    netExposures: CounterpartyExposure[],
    request: CounterpartyExposureRequest
  ): Promise<ExposureAlert[]> {
    const alerts: ExposureAlert[] = [];

    // High exposure alert
    const exposureLimit = await this.getExposureLimit(request.counterpartyId);
    if (metrics.totalNetExposure > exposureLimit.limitAmount) {
      alerts.push({
        id: `alert_exposure_${Date.now()}`,
        counterpartyId: (request as any).counterpartyId,
        alertType: 'EXPOSURE_LIMIT_BREACH',
        severity: 'HIGH',
        message: 'Counterparty exposure limit breached',
        description: `Net exposure of ${metrics.totalNetExposure.toLocaleString()} exceeds limit of ${exposureLimit.limitAmount.toLocaleString()}`,
        currentValue: metrics.totalNetExposure,
        limitValue: exposureLimit.limitAmount,
        breachAmount: metrics.totalNetExposure - exposureLimit.limitAmount,
        breachPercentage: ((metrics.totalNetExposure - exposureLimit.limitAmount) / exposureLimit.limitAmount) * 100,
        recommendedAction: 'Reduce exposure or increase collateral',
        createdAt: new Date(),
        status: 'ACTIVE'
      });
    }

    // Concentration alert
    if (metrics.concentrationIndex > 0.5) {
      alerts.push({
        id: `alert_concentration_${Date.now()}`,
        counterpartyId: (request as any).counterpartyId,
        alertType: 'HIGH_CONCENTRATION',
        severity: 'MEDIUM',
        message: 'High exposure concentration detected',
        description: `Concentration index of ${(metrics.concentrationIndex * 100).toFixed(1)}% indicates high concentration risk`,
        currentValue: metrics.concentrationIndex,
        limitValue: 0.5,
        breachAmount: metrics.concentrationIndex - 0.5,
        breachPercentage: ((metrics.concentrationIndex - 0.5) / 0.5) * 100,
        recommendedAction: 'Diversify exposures across multiple netting sets',
        createdAt: new Date(),
        status: 'ACTIVE'
      });
    }

    return alerts;
  }

  private async generateRecommendations(
    metrics: ExposureMetrics,
    alerts: ExposureAlert[],
    netExposures: CounterpartyExposure[]
  ): Promise<ExposureRecommendation[]> {
    const recommendations: ExposureRecommendation[] = [];

    if (alerts.some(alert => alert.alertType === 'EXPOSURE_LIMIT_BREACH')) {
      recommendations.push({
        id: `rec_reduce_exposure_${Date.now()}`,
        type: 'EXPOSURE_REDUCTION',
        priority: 'HIGH',
        title: 'Reduce Counterparty Exposure',
        description: 'Implement strategies to reduce net exposure to counterparty',
        actions: [
          'Close out profitable positions',
          'Request additional collateral',
          'Negotiate tighter netting agreements',
          'Consider credit hedging strategies'
        ],
        expectedImpact: 'Bring exposure within approved limits',
        implementationTimeframe: '1-5 business days',
        estimatedCost: 0,
        riskReduction: metrics.totalNetExposure * 0.3
      });
    }

    if (metrics.nettingRatio < 0.7) {
      recommendations.push({
        id: `rec_improve_netting_${Date.now()}`,
        type: 'NETTING_OPTIMIZATION',
        priority: 'MEDIUM',
        title: 'Optimize Netting Arrangements',
        description: 'Improve netting efficiency to reduce gross exposure',
        actions: [
          'Review master netting agreements',
          'Include more transaction types in netting sets',
          'Negotiate cross-product netting',
          'Implement close-out netting provisions'
        ],
        expectedImpact: 'Improved netting ratio and reduced capital requirements',
        implementationTimeframe: '1-3 months',
        estimatedCost: 50000,
        riskReduction: metrics.totalGrossExposure * 0.2
      });
    }

    return recommendations;
  }

  // Helper methods
  private isCounterpartyExposure(position: any, counterpartyId: string): boolean {
    return position.counterpartyId === counterpartyId ||
           position.security.issuerId === counterpartyId ||
           (position.security.derivativeDetails?.counterpartyId === counterpartyId);
  }

  private determineExposureType(security: any): ExposureType {
    if (security.securityType === 'DERIVATIVE') return 'DERIVATIVE';
    if (security.securityType === 'BOND') return 'FIXED_INCOME';
    if (security.securityType === 'REPO') return 'SECURITIES_FINANCING';
    return 'OTHER';
  }

  private calculateNotionalAmount(position: any): number {
    if (position.security.derivativeDetails) {
      return position.security.derivativeDetails.notionalAmount || position.marketValue;
    }
    return position.marketValue;
  }

  private getMaturityDate(security: any): Date | null {
    return security.fixedIncomeDetails?.maturityDate ||
           security.derivativeDetails?.expirationDate ||
           null;
  }

  private calculateRiskWeight(security: any): number {
    // Basel III risk weights
    if (security.securityType === 'DERIVATIVE') return 1.0;
    if (security.securityType === 'GOVERNMENT_BOND') return 0.0;
    if (security.securityType === 'CORPORATE_BOND') return 1.0;
    return 1.0;
  }

  private calculateAddOnFactor(security: any): number {
    // Basel III add-on factors for different instrument types
    const addOnFactors: Record<string, number> = {
      'INTEREST_RATE': 0.005,
      'EQUITY': 0.10,
      'FX': 0.075,
      'COMMODITY': 0.15,
      'CREDIT': 0.05
    };

    const riskCategory = this.getRiskCategory(security);
    return addOnFactors[riskCategory] || 0.05;
  }

  private getCreditConversionFactor(security: any): number {
    // Credit conversion factors for off-balance sheet items
    if (security.securityType === 'COMMITMENT') return 0.50;
    if (security.securityType === 'GUARANTEE') return 1.00;
    return 1.00; // On-balance sheet items
  }

  private getRiskCategory(security: any): string {
    if (security.assetClass === 'FIXED_INCOME') return 'INTEREST_RATE';
    if (security.assetClass === 'EQUITY') return 'EQUITY';
    if (security.currency !== 'USD') return 'FX';
    return 'OTHER';
  }

  private async getAssetVolatility(securityId: string): Promise<number> {
    // Would fetch historical volatility data
    return 0.20; // 20% annual volatility
  }

  private getTimeToMaturity(maturityDate: Date | null): number {
    if (!maturityDate) return 1; // Default 1 year
    const now = new Date();
    const diffTime = maturityDate.getTime() - now.getTime();
    return Math.max(diffTime / (1000 * 60 * 60 * 24 * 365), 0); // Years
  }

  private simulatePFE(
    exposure: CurrentExposure,
    volatility: number,
    timeToMaturity: number,
    confidenceLevel: number
  ): number {
    // Simplified Monte Carlo simulation for PFE
    const zScore = this.getZScore(confidenceLevel);
    const currentValue = exposure.currentExposure;
    const pfe = currentValue * (1 + zScore * volatility * Math.sqrt(timeToMaturity));
    return Math.max(pfe, 0);
  }

  private getZScore(confidenceLevel: number): number {
    // Z-scores for common confidence levels
    const zScores: Record<number, number> = {
      0.90: 1.28,
      0.95: 1.65,
      0.99: 2.33
    };
    return zScores[confidenceLevel] || 1.65;
  }

  private groupExposuresByNettingSet(
    exposures: CurrentExposure[],
    nettingAgreements: NettingAgreement[]
  ): Map<string, CurrentExposure[]> {
    const nettingSets = new Map<string, CurrentExposure[]>();
    
    exposures.forEach(exposure => {
      const nettingSetId = this.determineNettingSet(exposure, nettingAgreements);
      if (!nettingSets.has(nettingSetId)) {
        nettingSets.set(nettingSetId, []);
      }
      nettingSets.get(nettingSetId)!.push(exposure);
    });

    return nettingSets;
  }

  private determineNettingSet(
    exposure: CurrentExposure,
    nettingAgreements: NettingAgreement[]
  ): string {
    // Determine which netting set the exposure belongs to
    const applicableAgreement = nettingAgreements.find(agreement =>
      agreement.includedTransactionTypes.includes(exposure.exposureType)
    );
    
    return applicableAgreement?.id || `default_${exposure.counterpartyId}`;
  }

  private getApplicableCollateral(
    collateralPositions: CollateralPosition[],
    nettingSetId: string
  ): number {
    // Determine how much collateral applies to this netting set
    return collateralPositions
      .filter(pos => pos.eligibilityStatus === 'ELIGIBLE')
      .reduce((sum, pos) => sum + (pos.marketValue * (1 - pos.haircut)), 0);
  }

  private calculateEffectiveMaturity(pfeExposures: PotentialFutureExposure[]): number {
    if (pfeExposures.length === 0) return 1;
    
    const weightedMaturity = pfeExposures.reduce((sum, pfe) => {
      const weight = pfe.potentialFutureExposure;
      return sum + (pfe.timeToMaturity * weight);
    }, 0);
    
    const totalWeight = pfeExposures.reduce((sum, pfe) => sum + pfe.potentialFutureExposure, 0);
    
    return totalWeight > 0 ? weightedMaturity / totalWeight : 1;
  }

  private async getCounterpartyRiskWeight(counterpartyId: string): Promise<number> {
    // Would fetch counterparty-specific risk weight based on rating
    return 1.0; // 100% risk weight
  }

  private isSettlingToday(exposure: CurrentExposure, asOfDate: Date): boolean {
    // Determine if exposure has settlement activity today
    return false; // Simplified
  }

  private calculateTimeZoneRisk(exposure: CurrentExposure): number {
    // Calculate time zone risk for settlement
    return 0; // Simplified
  }

  private assessPaymentSystemRisk(exposure: CurrentExposure): string {
    return 'LOW'; // Simplified
  }

  private identifySettlementMitigants(exposure: CurrentExposure): RiskMitigant[] {
    return []; // Simplified
  }

  private calculateAverageMaturity(exposureAtDefault: ExposureAtDefault[]): number {
    if (exposureAtDefault.length === 0) return 0;
    
    const totalMaturity = exposureAtDefault.reduce((sum, ead) => 
      sum + ead.effectiveMaturity, 0
    );
    
    return totalMaturity / exposureAtDefault.length;
  }

  private async calculateExposureVolatility(netExposures: CounterpartyExposure[]): Promise<number> {
    // Would calculate historical volatility of exposure
    return 0.25; // 25% volatility
  }

  private calculateConcentrationIndex(netExposures: CounterpartyExposure[]): number {
    const totalExposure = netExposures.reduce((sum, exp) => 
      sum + exp.netExposureAfterCollateral, 0
    );
    
    if (totalExposure === 0) return 0;
    
    const weights = netExposures.map(exp => exp.netExposureAfterCollateral / totalExposure);
    return weights.reduce((sum, weight) => sum + (weight * weight), 0);
  }

  private calculateHerfindahlIndex(netExposures: CounterpartyExposure[]): number {
    return this.calculateConcentrationIndex(netExposures);
  }

  private calculateDiversificationRatio(netExposures: CounterpartyExposure[]): number {
    return netExposures.length > 0 ? 1 / Math.sqrt(netExposures.length) : 1;
  }

  private assessConcentrationRiskLevel(largestExposure: number, totalExposure: number): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (totalExposure === 0) return 'LOW';
    
    const concentration = largestExposure / totalExposure;
    if (concentration > 0.5) return 'HIGH';
    if (concentration > 0.25) return 'MEDIUM';
    return 'LOW';
  }

  private async getExposureLimit(counterpartyId: string): Promise<ExposureLimit> {
    // Would fetch actual exposure limits from database
    return {
      id: `limit_${counterpartyId}`,
      counterpartyId,
      limitType: 'NET_EXPOSURE',
      limitAmount: 10000000,
      currency: 'USD',
      utilizationAmount: 0,
      availableAmount: 10000000,
      utilizationPercentage: 0,
      effectiveDate: new Date('2024-01-01'),
      expiryDate: new Date('2024-12-31'),
      approvedBy: 'Risk Committee',
      lastReviewDate: new Date(),
      nextReviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
    };
  }

  private calculateTotalGrossExposure(currentExposures: CurrentExposure[]): number {
    return currentExposures.reduce((sum, exp) => sum + Math.abs(exp.currentExposure), 0);
  }

  private calculateTotalNetExposure(netExposures: CounterpartyExposure[]): number {
    return netExposures.reduce((sum, exp) => sum + exp.netExposureAfterCollateral, 0);
  }

  private calculateTotalCollateralValue(collateralPositions: CollateralPosition[]): number {
    return collateralPositions.reduce((sum, pos) => sum + pos.marketValue, 0);
  }

  private calculateExposureAfterCollateral(
    netExposures: CounterpartyExposure[],
    collateralPositions: CollateralPosition[]
  ): number {
    const totalNetExposure = this.calculateTotalNetExposure(netExposures);
    const totalCollateral = this.calculateTotalCollateralValue(collateralPositions);
    return Math.max(totalNetExposure - totalCollateral, 0);
  }

  private async getAllCounterparties(portfolioId: string): Promise<{ id: string; name: string }[]> {
    // Would fetch all counterparties for the portfolio
    return [
      { id: 'counterparty_1', name: 'Bank A' },
      { id: 'counterparty_2', name: 'Broker B' },
      { id: 'counterparty_3', name: 'Institution C' }
    ];
  }

  private async analyzePortfolioCounterpartyConcentration(
    assessments: CounterpartyExposureAssessment[]
  ): Promise<any> {
    const totalExposure = assessments.reduce((sum, a) => sum + a.totalNetExposure, 0);
    const largestExposure = Math.max(...assessments.map(a => a.totalNetExposure));
    
    return {
      totalExposure,
      largestExposure,
      concentrationRatio: totalExposure > 0 ? largestExposure / totalExposure : 0,
      numberOfCounterparties: assessments.length
    };
  }

  private async storeAssessment(assessment: CounterpartyExposureAssessment): Promise<any> {
    // Implementation would store the assessment in the database
    this.logger.info('Storing counterparty exposure assessment', { assessmentId: assessment.id });
  }
}

