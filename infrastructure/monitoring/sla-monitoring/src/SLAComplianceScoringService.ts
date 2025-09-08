import { EventEmitter } from 'events';
import {
  SLAComplianceScore,
  SLAScoreBreakdown,
  SLAScoreTrend,
  SLAMetric,
  SLABreach,
  SLADefinition,
  SLASeverity,
  SLAStatus
} from './SLADataModel';

export interface ComplianceScoringConfig {
  scoringMethod: 'weighted' | 'geometric' | 'harmonic' | 'custom';
  weights: {
    availability: number;
    performance: number;
    reliability: number;
    penalties: number;
    breaches: number;
  };
  penalties: {
    breachPenalty: number;
    escalationMultiplier: number;
    durationFactor: number;
    severityMultipliers: Record<SLASeverity, number>;
  };
  bonuses: {
    perfectComplianceBonus: number;
    earlyResolutionBonus: number;
    proactiveActionBonus: number;
  };
  thresholds: {
    excellent: number;
    good: number;
    acceptable: number;
    poor: number;
  };
  trendAnalysis: {
    periods: number[];
    significance: number;
    volatilityWeight: number;
  };
}

export interface ScoringContext {
  slaDefinition: SLADefinition;
  timeWindow: { start: Date; end: Date };
  metrics: SLAMetric[];
  breaches: SLABreach[];
  historicalScores: SLAComplianceScore[];
  businessContext: BusinessContext;
}

export interface BusinessContext {
  criticalityLevel: 'low' | 'medium' | 'high' | 'critical';
  businessHours: boolean;
  seasonalFactor: number;
  userImpact: number;
  revenueImpact: number;
  contractualRequirements: {
    minimumScore: number;
    penaltyThreshold: number;
    bonusThreshold: number;
  };
}

export interface ScoreComponent {
  name: string;
  weight: number;
  rawValue: number;
  normalizedValue: number;
  weightedValue: number;
  confidence: number;
  factors: string[];
}

export interface ComplianceGrade {
  score: number;
  grade: 'A+' | 'A' | 'A-' | 'B+' | 'B' | 'B-' | 'C+' | 'C' | 'C-' | 'D' | 'F';
  description: string;
  recommendations: string[];
}

export interface BenchmarkComparison {
  currentScore: number;
  industryAverage: number;
  industryBest: number;
  peerAverage: number;
  ranking: number;
  percentile: number;
}

export class SLAComplianceScoringService extends EventEmitter {
  private scores: Map<string, SLAComplianceScore[]> = new Map();
  private config: ComplianceScoringConfig;
  private scoringCache: Map<string, SLAComplianceScore> = new Map();
  private benchmarkData: Map<string, BenchmarkComparison> = new Map();

  constructor(config: ComplianceScoringConfig) {
    super();
    this.config = config;
  }

  async calculateComplianceScore(context: ScoringContext): Promise<SLAComplianceScore> {
    const cacheKey = this.generateCacheKey(context);
    const cachedScore = this.scoringCache.get(cacheKey);
    
    if (cachedScore && this.isCacheValid(cachedScore)) {
      return cachedScore;
    }

    const scoreComponents = await this.calculateScoreComponents(context);
    const breakdown = this.calculateScoreBreakdown(scoreComponents);
    const overallScore = this.calculateOverallScore(breakdown);
    const trends = await this.calculateScoreTrends(context);
    const recommendations = this.generateScoreRecommendations(breakdown, trends, context);

    const complianceScore: SLAComplianceScore = {
      slaId: context.slaDefinition.id,
      timeWindow: context.timeWindow,
      overallScore,
      availability: breakdown.metricScores.availability || 0,
      performance: breakdown.metricScores.performance || 0,
      reliability: breakdown.metricScores.reliability || 0,
      breakdown,
      trends,
      recommendations,
      calculatedAt: new Date()
    };

    // Cache the score
    this.scoringCache.set(cacheKey, complianceScore);
    
    // Store in history
    const slaScores = this.scores.get(context.slaDefinition.id) || [];
    slaScores.push(complianceScore);
    
    // Keep only recent scores (last 90 days)
    const cutoffDate = new Date(Date.now() - (90 * 24 * 60 * 60 * 1000));
    const recentScores = slaScores.filter(score => score.calculatedAt >= cutoffDate);
    this.scores.set(context.slaDefinition.id, recentScores);

    this.emit('scoreCalculated', { slaId: context.slaDefinition.id, score: complianceScore });
    return complianceScore;
  }

  async calculateScoreComponents(context: ScoringContext): Promise<ScoreComponent[]> {
    const components: ScoreComponent[] = [];

    // Availability Component
    const availabilityComponent = await this.calculateAvailabilityScore(context);
    components.push(availabilityComponent);

    // Performance Component
    const performanceComponent = await this.calculatePerformanceScore(context);
    components.push(performanceComponent);

    // Reliability Component
    const reliabilityComponent = await this.calculateReliabilityScore(context);
    components.push(reliabilityComponent);

    // Breach Impact Component
    const breachComponent = await this.calculateBreachImpactScore(context);
    components.push(breachComponent);

    // Business Context Component
    const businessComponent = await this.calculateBusinessContextScore(context);
    components.push(businessComponent);

    return components;
  }

  async calculateAvailabilityScore(context: ScoringContext): Promise<ScoreComponent> {
    const availabilityMetrics = context.metrics.filter(m => 
      m.unit === '%' && m.currentValue <= 100
    );

    if (availabilityMetrics.length === 0) {
      return {
        name: 'availability',
        weight: this.config.weights.availability,
        rawValue: 100,
        normalizedValue: 100,
        weightedValue: 100 * this.config.weights.availability,
        confidence: 0.5,
        factors: ['No availability data']
      };
    }

    const avgAvailability = availabilityMetrics.reduce((sum, m) => sum + m.currentValue, 0) / availabilityMetrics.length;
    const targetAvailability = context.slaDefinition.targetValue;
    
    // Calculate score based on how close we are to target
    let score: number;
    if (avgAvailability >= targetAvailability) {
      // Above target - linear bonus up to 105%
      score = 100 + Math.min(5, (avgAvailability - targetAvailability) * 10);
    } else {
      // Below target - exponential penalty
      const deficit = targetAvailability - avgAvailability;
      score = Math.max(0, 100 - Math.pow(deficit * 10, 1.5));
    }

    // Apply business context multiplier
    const businessMultiplier = this.getBusinessContextMultiplier(context.businessContext, 'availability');
    const adjustedScore = score * businessMultiplier;

    const factors = [
      `Average availability: ${avgAvailability.toFixed(2)}%`,
      `Target: ${targetAvailability}%`,
      `Business criticality: ${context.businessContext.criticalityLevel}`
    ];

    return {
      name: 'availability',
      weight: this.config.weights.availability,
      rawValue: avgAvailability,
      normalizedValue: adjustedScore,
      weightedValue: adjustedScore * this.config.weights.availability,
      confidence: this.calculateConfidence(availabilityMetrics.length, context.timeWindow),
      factors
    };
  }

  async calculatePerformanceScore(context: ScoringContext): Promise<ScoreComponent> {
    const performanceMetrics = context.metrics.filter(m => 
      m.unit === 'ms' || m.unit === 'seconds' || m.unit === 'rps'
    );

    if (performanceMetrics.length === 0) {
      return this.createDefaultComponent('performance', 75, ['No performance data']);
    }

    let score = 0;
    const factors: string[] = [];

    for (const metric of performanceMetrics) {
      const target = context.slaDefinition.targetValue;
      let metricScore: number;

      if (metric.unit === 'ms' || metric.unit === 'seconds') {
        // Lower is better for response times
        if (metric.currentValue <= target) {
          metricScore = 100 + Math.min(10, (target - metric.currentValue) / target * 100);
        } else {
          const excess = (metric.currentValue - target) / target;
          metricScore = Math.max(0, 100 - Math.pow(excess * 100, 1.2));
        }
        factors.push(`Response time: ${metric.currentValue}${metric.unit} (target: ${target}${metric.unit})`);
      } else {
        // Higher is better for throughput
        if (metric.currentValue >= target) {
          metricScore = 100 + Math.min(10, (metric.currentValue - target) / target * 100);
        } else {
          const deficit = (target - metric.currentValue) / target;
          metricScore = Math.max(0, 100 - Math.pow(deficit * 100, 1.2));
        }
        factors.push(`Throughput: ${metric.currentValue}${metric.unit} (target: ${target}${metric.unit})`);
      }

      score += metricScore;
    }

    score = score / performanceMetrics.length;

    // Apply trend adjustment
    const trendAdjustment = this.calculateTrendAdjustment(context.metrics);
    score += trendAdjustment;
    factors.push(`Trend adjustment: ${trendAdjustment > 0 ? '+' : ''}${trendAdjustment.toFixed(1)}`);

    return {
      name: 'performance',
      weight: this.config.weights.performance,
      rawValue: score,
      normalizedValue: Math.max(0, Math.min(105, score)),
      weightedValue: score * this.config.weights.performance,
      confidence: this.calculateConfidence(performanceMetrics.length, context.timeWindow),
      factors
    };
  }

  async calculateReliabilityScore(context: ScoringContext): Promise<ScoreComponent> {
    const totalTimeMs = context.timeWindow.end.getTime() - context.timeWindow.start.getTime();
    const breaches = context.breaches.filter(b => b.status === 'resolved' || b.status === 'active');
    
    let score = 100;
    const factors: string[] = [];

    // Penalize for number of breaches
    const breachPenalty = breaches.length * this.config.penalties.breachPenalty;
    score -= breachPenalty;
    factors.push(`Breach penalty: -${breachPenalty} (${breaches.length} breaches)`);

    // Penalize for breach duration
    let totalBreachDuration = 0;
    for (const breach of breaches) {
      const duration = breach.duration || (Date.now() - breach.startTime.getTime());
      totalBreachDuration += duration;
      
      // Apply severity multiplier
      const severityMultiplier = this.config.penalties.severityMultipliers[breach.severity] || 1;
      const durationPenalty = (duration / totalTimeMs) * 100 * severityMultiplier;
      score -= durationPenalty;
    }

    if (totalBreachDuration > 0) {
      const breachPercentage = (totalBreachDuration / totalTimeMs) * 100;
      factors.push(`Breach duration: ${breachPercentage.toFixed(2)}% of time window`);
    }

    // Calculate mean time between failures (MTBF)
    if (breaches.length > 1) {
      const mtbf = totalTimeMs / breaches.length;
      const mtbfHours = mtbf / (60 * 60 * 1000);
      factors.push(`MTBF: ${mtbfHours.toFixed(1)} hours`);
      
      // Bonus for high MTBF
      if (mtbfHours > 168) { // > 1 week
        score += 5;
        factors.push('MTBF bonus: +5');
      }
    }

    // Calculate mean time to recovery (MTTR)
    const resolvedBreaches = breaches.filter(b => b.status === 'resolved' && b.duration);
    if (resolvedBreaches.length > 0) {
      const avgMttr = resolvedBreaches.reduce((sum, b) => sum + (b.duration || 0), 0) / resolvedBreaches.length;
      const mttrHours = avgMttr / (60 * 60 * 1000);
      factors.push(`MTTR: ${mttrHours.toFixed(1)} hours`);
      
      // Bonus for fast recovery
      if (mttrHours < 1) {
        score += this.config.bonuses.earlyResolutionBonus;
        factors.push(`Fast recovery bonus: +${this.config.bonuses.earlyResolutionBonus}`);
      }
    }

    return {
      name: 'reliability',
      weight: this.config.weights.reliability,
      rawValue: score,
      normalizedValue: Math.max(0, Math.min(105, score)),
      weightedValue: score * this.config.weights.reliability,
      confidence: this.calculateConfidence(breaches.length + 1, context.timeWindow),
      factors
    };
  }

  async calculateBreachImpactScore(context: ScoringContext): Promise<ScoreComponent> {
    let score = 100;
    const factors: string[] = [];
    const breaches = context.breaches;

    if (breaches.length === 0) {
      score += this.config.bonuses.perfectComplianceBonus;
      factors.push(`Perfect compliance bonus: +${this.config.bonuses.perfectComplianceBonus}`);
    } else {
      // Penalize based on breach severity distribution
      const severityDistribution = breaches.reduce((acc, breach) => {
        acc[breach.severity] = (acc[breach.severity] || 0) + 1;
        return acc;
      }, {} as Record<SLASeverity, number>);

      for (const [severity, count] of Object.entries(severityDistribution)) {
        const multiplier = this.config.penalties.severityMultipliers[severity as SLASeverity] || 1;
        const penalty = count * multiplier * 5; // Base penalty of 5 per breach
        score -= penalty;
        factors.push(`${severity} breach penalty: -${penalty} (${count} breaches)`);
      }

      // Escalation penalty
      const escalatedBreaches = breaches.filter(b => b.metadata?.escalated);
      if (escalatedBreaches.length > 0) {
        const escalationPenalty = escalatedBreaches.length * this.config.penalties.escalationMultiplier;
        score -= escalationPenalty;
        factors.push(`Escalation penalty: -${escalationPenalty}`);
      }

      // Pattern penalty (for recurring breaches)
      const recentBreaches = breaches.filter(b => 
        b.startTime.getTime() > (Date.now() - (7 * 24 * 60 * 60 * 1000))
      );
      if (recentBreaches.length > 3) {
        const patternPenalty = (recentBreaches.length - 3) * 2;
        score -= patternPenalty;
        factors.push(`Recurring breach pattern penalty: -${patternPenalty}`);
      }
    }

    return {
      name: 'breach_impact',
      weight: this.config.weights.breaches,
      rawValue: score,
      normalizedValue: Math.max(0, Math.min(105, score)),
      weightedValue: score * this.config.weights.breaches,
      confidence: 0.9,
      factors
    };
  }

  async calculateBusinessContextScore(context: ScoringContext): Promise<ScoreComponent> {
    let score = 100;
    const factors: string[] = [];
    const businessContext = context.businessContext;

    // Criticality adjustment
    const criticalityMultipliers = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.2,
      'critical': 1.5
    };
    
    const multiplier = criticalityMultipliers[businessContext.criticalityLevel];
    factors.push(`Criticality (${businessContext.criticalityLevel}): ${multiplier}x multiplier`);

    // Business hours impact
    if (businessContext.businessHours) {
      score *= 1.1; // 10% boost for business hours compliance
      factors.push('Business hours compliance: +10%');
    }

    // Seasonal adjustment
    if (businessContext.seasonalFactor !== 1.0) {
      const adjustment = (businessContext.seasonalFactor - 1.0) * 100;
      score += adjustment;
      factors.push(`Seasonal adjustment: ${adjustment > 0 ? '+' : ''}${adjustment.toFixed(1)}`);
    }

    // User impact consideration
    if (businessContext.userImpact > 0.8) {
      score -= 5; // High user impact penalty
      factors.push('High user impact penalty: -5');
    }

    // Revenue impact consideration
    if (businessContext.revenueImpact > 0.5) {
      score -= businessContext.revenueImpact * 10;
      factors.push(`Revenue impact penalty: -${(businessContext.revenueImpact * 10).toFixed(1)}`);
    }

    return {
      name: 'business_context',
      weight: 0.1, // Lower weight as it's more of an adjustment
      rawValue: score,
      normalizedValue: Math.max(0, Math.min(105, score)),
      weightedValue: score * 0.1,
      confidence: 0.8,
      factors
    };
  }

  calculateScoreBreakdown(components: ScoreComponent[]): SLAScoreBreakdown {
    const metricScores: Record<string, number> = {};
    const weightedScores: Record<string, number> = {};
    let penaltyDeductions = 0;
    let bonusPoints = 0;

    for (const component of components) {
      metricScores[component.name] = component.normalizedValue;
      weightedScores[component.name] = component.weightedValue;
      
      if (component.normalizedValue < 100) {
        penaltyDeductions += (100 - component.normalizedValue) * component.weight;
      } else if (component.normalizedValue > 100) {
        bonusPoints += (component.normalizedValue - 100) * component.weight;
      }
    }

    const totalWeightedScore = Object.values(weightedScores).reduce((sum, score) => sum + score, 0);
    const totalWeight = components.reduce((sum, comp) => sum + comp.weight, 0);
    const compliancePercentage = totalWeight > 0 ? (totalWeightedScore / totalWeight) : 0;

    return {
      metricScores,
      weightedScores,
      penaltyDeductions,
      bonusPoints,
      compliancePercentage: Math.max(0, Math.min(105, compliancePercentage))
    };
  }

  calculateOverallScore(breakdown: SLAScoreBreakdown): number {
    switch (this.config.scoringMethod) {
      case 'weighted':
        return breakdown.compliancePercentage;
      
      case 'geometric':
        const scores = Object.values(breakdown.metricScores).filter(s => s > 0);
        if (scores.length === 0) return 0;
        const product = scores.reduce((prod, score) => prod * (score / 100), 1);
        return Math.pow(product, 1/scores.length) * 100;
      
      case 'harmonic':
        const harmonicScores = Object.values(breakdown.metricScores).filter(s => s > 0);
        if (harmonicScores.length === 0) return 0;
        const harmonicMean = harmonicScores.length / harmonicScores.reduce((sum, score) => sum + (1/score), 0);
        return harmonicMean;
      
      default:
        return breakdown.compliancePercentage;
    }
  }

  async calculateScoreTrends(context: ScoringContext): Promise<SLAScoreTrend[]> {
    const trends: SLAScoreTrend[] = [];
    const historicalScores = context.historicalScores;

    if (historicalScores.length < 2) {
      return trends;
    }

    for (const period of this.config.trendAnalysis.periods) {
      const cutoffDate = new Date(Date.now() - (period * 24 * 60 * 60 * 1000));
      const periodScores = historicalScores.filter(score => score.calculatedAt >= cutoffDate);
      
      if (periodScores.length < 2) continue;

      const currentScore = periodScores[periodScores.length - 1].overallScore;
      const previousScore = periodScores[0].overallScore;
      const change = currentScore - previousScore;
      const changePercentage = previousScore > 0 ? (change / previousScore) * 100 : 0;

      trends.push({
        period: `${period}d`,
        score: currentScore,
        change,
        changePercentage
      });
    }

    return trends;
  }

  generateScoreRecommendations(
    breakdown: SLAScoreBreakdown, 
    trends: SLAScoreTrend[], 
    context: ScoringContext
  ): string[] {
    const recommendations: string[] = [];
    const overallScore = breakdown.compliancePercentage;

    // Overall score recommendations
    if (overallScore < this.config.thresholds.poor) {
      recommendations.push('CRITICAL: Overall compliance score is below acceptable levels. Immediate action required.');
    } else if (overallScore < this.config.thresholds.acceptable) {
      recommendations.push('WARNING: Compliance score needs improvement to meet acceptable standards.');
    } else if (overallScore > this.config.thresholds.excellent) {
      recommendations.push('EXCELLENT: Outstanding compliance performance. Continue current practices.');
    }

    // Component-specific recommendations
    for (const [component, score] of Object.entries(breakdown.metricScores)) {
      if (score < 80) {
        recommendations.push(`Improve ${component} performance - current score: ${score.toFixed(1)}`);
      }
    }

    // Trend-based recommendations
    for (const trend of trends) {
      if (trend.changePercentage < -10) {
        recommendations.push(`Address declining trend over ${trend.period} (${trend.changePercentage.toFixed(1)}% decrease)`);
      } else if (trend.changePercentage > 15) {
        recommendations.push(`Maintain positive momentum over ${trend.period} (${trend.changePercentage.toFixed(1)}% improvement)`);
      }
    }

    // Breach-specific recommendations
    if (context.breaches.length > 0) {
      const criticalBreaches = context.breaches.filter(b => b.severity === SLASeverity.CRITICAL);
      if (criticalBreaches.length > 0) {
        recommendations.push(`Address ${criticalBreaches.length} critical breaches to prevent score degradation.`);
      }

      const unresolvedBreaches = context.breaches.filter(b => b.status === 'active');
      if (unresolvedBreaches.length > 0) {
        recommendations.push(`Resolve ${unresolvedBreaches.length} active breaches to improve reliability score.`);
      }
    }

    return recommendations;
  }

  async getComplianceGrade(score: number): Promise<ComplianceGrade> {
    let grade: ComplianceGrade['grade'];
    let description: string;
    const recommendations: string[] = [];

    if (score >= 97) {
      grade = 'A+';
      description = 'Exceptional compliance performance';
      recommendations.push('Maintain current excellence', 'Share best practices');
    } else if (score >= 95) {
      grade = 'A';
      description = 'Excellent compliance performance';
      recommendations.push('Minor optimizations possible', 'Monitor for consistency');
    } else if (score >= 92) {
      grade = 'A-';
      description = 'Very good compliance performance';
      recommendations.push('Focus on consistency', 'Address minor issues');
    } else if (score >= 88) {
      grade = 'B+';
      description = 'Good compliance performance';
      recommendations.push('Improve weak areas', 'Enhance monitoring');
    } else if (score >= 85) {
      grade = 'B';
      description = 'Acceptable compliance performance';
      recommendations.push('Address performance gaps', 'Increase oversight');
    } else if (score >= 80) {
      grade = 'B-';
      description = 'Below average compliance performance';
      recommendations.push('Immediate improvements needed', 'Review processes');
    } else if (score >= 75) {
      grade = 'C+';
      description = 'Poor compliance performance';
      recommendations.push('Significant improvements required', 'Management attention needed');
    } else if (score >= 70) {
      grade = 'C';
      description = 'Unsatisfactory compliance performance';
      recommendations.push('Major remediation required', 'Risk assessment needed');
    } else if (score >= 65) {
      grade = 'C-';
      description = 'Very poor compliance performance';
      recommendations.push('Emergency response required', 'Service review mandatory');
    } else if (score >= 60) {
      grade = 'D';
      description = 'Critical compliance failure';
      recommendations.push('Immediate escalation required', 'Service may need suspension');
    } else {
      grade = 'F';
      description = 'Complete compliance failure';
      recommendations.push('Service suspension recommended', 'Complete overhaul required');
    }

    return { score, grade, description, recommendations };
  }

  async getBenchmarkComparison(slaId: string, score: number): Promise<BenchmarkComparison> {
    // This would typically query external benchmark data
    // For now, return mock benchmark data
    return {
      currentScore: score,
      industryAverage: 88.5,
      industryBest: 97.2,
      peerAverage: 91.3,
      ranking: Math.floor(Math.random() * 100) + 1,
      percentile: Math.min(99, Math.max(1, (score / 100) * 100))
    };
  }

  async getHistoricalScores(
    slaId: string, 
    timeRange: { start: Date; end: Date }
  ): Promise<SLAComplianceScore[]> {
    const allScores = this.scores.get(slaId) || [];
    return allScores.filter(score => 
      score.calculatedAt >= timeRange.start && 
      score.calculatedAt <= timeRange.end
    );
  }

  private getBusinessContextMultiplier(businessContext: BusinessContext, component: string): number {
    const baseMultiplier = businessContext.criticalityLevel === 'critical' ? 1.2 : 
                          businessContext.criticalityLevel === 'high' ? 1.1 : 
                          businessContext.criticalityLevel === 'medium' ? 1.0 : 0.9;

    if (component === 'availability' && businessContext.businessHours) {
      return baseMultiplier * 1.05;
    }

    return baseMultiplier;
  }

  private calculateConfidence(dataPoints: number, timeWindow: { start: Date; end: Date }): number {
    const timeSpanHours = (timeWindow.end.getTime() - timeWindow.start.getTime()) / (60 * 60 * 1000);
    const expectedDataPoints = timeSpanHours; // Assuming hourly data
    const completeness = Math.min(1, dataPoints / expectedDataPoints);
    
    // Base confidence on data completeness and sample size
    let confidence = completeness * 0.8;
    if (dataPoints >= 24) confidence += 0.15; // Daily coverage bonus
    if (dataPoints >= 168) confidence += 0.05; // Weekly coverage bonus
    
    return Math.min(1, confidence);
  }

  private calculateTrendAdjustment(metrics: SLAMetric[]): number {
    if (metrics.length < 2) return 0;

    const sortedMetrics = metrics.sort((a, b) => a.calculatedAt.getTime() - b.calculatedAt.getTime());
    const recent = sortedMetrics.slice(-Math.min(10, sortedMetrics.length));
    
    if (recent.length < 2) return 0;

    const values = recent.map(m => m.compliancePercentage);
    const n = values.length;
    
    // Simple linear regression for trend
    const x = Array.from({ length: n }, (_, i) => i);
    const sumX = x.reduce((sum, val) => sum + val, 0);
    const sumY = values.reduce((sum, val) => sum + val, 0);
    const sumXY = x.reduce((sum, val, i) => sum + val * values[i], 0);
    const sumXX = x.reduce((sum, val) => sum + val * val, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    
    // Convert slope to adjustment (-5 to +5)
    return Math.max(-5, Math.min(5, slope * 10));
  }

  private createDefaultComponent(name: string, defaultScore: number, factors: string[]): ScoreComponent {
    const weight = (this.config.weights as any)[name] || 0.2;
    return {
      name,
      weight,
      rawValue: defaultScore,
      normalizedValue: defaultScore,
      weightedValue: defaultScore * weight,
      confidence: 0.5,
      factors
    };
  }

  private generateCacheKey(context: ScoringContext): string {
    return `${context.slaDefinition.id}_${context.timeWindow.start.getTime()}_${context.timeWindow.end.getTime()}`;
  }

  private isCacheValid(score: SLAComplianceScore): boolean {
    const ageMinutes = (Date.now() - score.calculatedAt.getTime()) / (60 * 1000);
    return ageMinutes < 15; // Cache valid for 15 minutes
  }

  async shutdown(): Promise<any> {
    this.scores.clear();
    this.scoringCache.clear();
    this.benchmarkData.clear();
    
    this.emit('shutdown');
  }
}
