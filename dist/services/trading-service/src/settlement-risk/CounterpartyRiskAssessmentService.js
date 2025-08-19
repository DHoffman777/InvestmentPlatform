"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CounterpartyRiskAssessmentService = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
class CounterpartyRiskAssessmentService extends events_1.EventEmitter {
    counterpartyProfiles;
    exposureLimits;
    riskMetrics;
    creditEvents;
    concentrationAnalyses;
    // Risk calculation parameters
    INDUSTRY_RISK_WEIGHTS = new Map([
        ['FINANCIAL_SERVICES', 1.2],
        ['TECHNOLOGY', 0.9],
        ['HEALTHCARE', 0.8],
        ['ENERGY', 1.3],
        ['UTILITIES', 0.7],
        ['MANUFACTURING', 1.0],
        ['RETAIL', 1.1],
        ['REAL_ESTATE', 1.4],
        ['TELECOMMUNICATIONS', 0.9],
        ['GOVERNMENT', 0.5]
    ]);
    COUNTRY_RISK_WEIGHTS = new Map([
        ['US', 0.5], ['CA', 0.6], ['GB', 0.7], ['DE', 0.6], ['FR', 0.7],
        ['JP', 0.8], ['AU', 0.6], ['CH', 0.5], ['NL', 0.6], ['SE', 0.6],
        ['CN', 1.2], ['IN', 1.3], ['BR', 1.4], ['RU', 1.8], ['ZA', 1.5]
    ]);
    constructor() {
        super();
        this.counterpartyProfiles = new Map();
        this.exposureLimits = new Map();
        this.riskMetrics = new Map();
        this.creditEvents = new Map();
        this.concentrationAnalyses = new Map();
    }
    async createCounterpartyProfile(profileData) {
        const profile = {
            ...profileData,
            id: (0, uuid_1.v4)(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.counterpartyProfiles.set(profile.id, profile);
        // Initialize exposure limits array
        this.exposureLimits.set(profile.id, []);
        // Initialize credit events array
        this.creditEvents.set(profile.id, []);
        // Perform initial risk assessment
        await this.performRiskAssessment(profile.id);
        this.emit('counterpartyProfileCreated', profile);
        return profile;
    }
    async updateCounterpartyProfile(counterpartyId, updates) {
        const existingProfile = this.counterpartyProfiles.get(counterpartyId);
        if (!existingProfile) {
            throw new Error(`Counterparty profile not found: ${counterpartyId}`);
        }
        const updatedProfile = {
            ...existingProfile,
            ...updates,
            updatedAt: new Date()
        };
        this.counterpartyProfiles.set(counterpartyId, updatedProfile);
        // Re-assess risk if material changes occurred
        const materialFields = ['creditRating', 'totalAssets', 'netWorth', 'annualRevenue', 'regulatoryStatus'];
        const hasMaterialChanges = materialFields.some(field => updates[field] !== undefined);
        if (hasMaterialChanges) {
            await this.performRiskAssessment(counterpartyId);
        }
        this.emit('counterpartyProfileUpdated', updatedProfile);
        return updatedProfile;
    }
    async performRiskAssessment(counterpartyId) {
        const profile = this.counterpartyProfiles.get(counterpartyId);
        if (!profile) {
            throw new Error(`Counterparty profile not found: ${counterpartyId}`);
        }
        const riskScoreComponents = this.calculateRiskScoreComponents(profile);
        const riskTier = this.determineRiskTier(riskScoreComponents.compositeScore);
        const maxExposureRecommendation = this.calculateMaxExposureRecommendation(profile, riskScoreComponents);
        const recommendedLimits = this.calculateRecommendedLimits(maxExposureRecommendation, riskTier);
        const riskFactors = this.identifyRiskFactors(profile, riskScoreComponents);
        const mitigationRequirements = this.generateMitigationRequirements(profile, riskScoreComponents, riskTier);
        const riskMetrics = {
            counterpartyId,
            riskScoreComponents,
            riskTier,
            maxExposureRecommendation,
            recommendedLimits,
            riskFactors,
            mitigationRequirements,
            nextReviewDate: this.calculateNextReviewDate(riskTier),
            lastAssessmentDate: new Date()
        };
        this.riskMetrics.set(counterpartyId, riskMetrics);
        this.emit('riskAssessmentCompleted', riskMetrics);
        if (riskTier === 'HIGH' || riskTier === 'SEVERE') {
            this.emit('highRiskCounterpartyIdentified', riskMetrics);
        }
        return riskMetrics;
    }
    calculateRiskScoreComponents(profile) {
        const creditScore = this.calculateCreditScore(profile);
        const financialStrengthScore = this.calculateFinancialStrengthScore(profile);
        const operationalRiskScore = this.calculateOperationalRiskScore(profile);
        const concentrationRiskScore = this.calculateConcentrationRiskScore(profile.id);
        const geopoliticalRiskScore = this.calculateGeopoliticalRiskScore(profile);
        const industryRiskScore = this.calculateIndustryRiskScore(profile);
        const historicalPerformanceScore = this.calculateHistoricalPerformanceScore(profile.id);
        // Weighted composite score
        const weights = {
            credit: 0.25,
            financial: 0.20,
            operational: 0.15,
            concentration: 0.15,
            geopolitical: 0.10,
            industry: 0.10,
            historical: 0.05
        };
        const compositeScore = creditScore * weights.credit +
            financialStrengthScore * weights.financial +
            operationalRiskScore * weights.operational +
            concentrationRiskScore * weights.concentration +
            geopoliticalRiskScore * weights.geopolitical +
            industryRiskScore * weights.industry +
            historicalPerformanceScore * weights.historical;
        return {
            creditScore,
            financialStrengthScore,
            operationalRiskScore,
            concentrationRiskScore,
            geopoliticalRiskScore,
            industryRiskScore,
            historicalPerformanceScore,
            compositeScore: Math.min(Math.max(compositeScore, 0), 100)
        };
    }
    calculateCreditScore(profile) {
        // Convert credit rating to numerical score (0-100, higher is better)
        const ratingScores = {
            'AAA': 95, 'AA+': 90, 'AA': 85, 'AA-': 80,
            'A+': 75, 'A': 70, 'A-': 65,
            'BBB+': 60, 'BBB': 55, 'BBB-': 50,
            'BB+': 45, 'BB': 40, 'BB-': 35,
            'B+': 30, 'B': 25, 'B-': 20,
            'CCC+': 15, 'CCC': 10, 'CCC-': 5,
            'CC': 3, 'C': 1, 'D': 0
        };
        let baseScore = ratingScores[profile.creditRating] || 25;
        // Adjust for probability of default
        if (profile.probabilityOfDefault > 0.1)
            baseScore *= 0.5;
        else if (profile.probabilityOfDefault > 0.05)
            baseScore *= 0.7;
        else if (profile.probabilityOfDefault > 0.02)
            baseScore *= 0.85;
        // Adjust for sanctions or blacklist status
        if (profile.sanctions || profile.blacklisted)
            baseScore *= 0.1;
        // KYC status adjustment
        if (profile.kycStatus !== 'APPROVED')
            baseScore *= 0.3;
        // Regulatory status adjustment
        if (profile.regulatoryStatus !== 'ACTIVE')
            baseScore *= 0.4;
        return Math.min(Math.max(baseScore, 0), 100);
    }
    calculateFinancialStrengthScore(profile) {
        let score = 50; // Base score
        // Asset size adjustment
        if (profile.totalAssets > 10000000000)
            score += 20; // >$10B
        else if (profile.totalAssets > 1000000000)
            score += 15; // >$1B
        else if (profile.totalAssets > 100000000)
            score += 10; // >$100M
        else if (profile.totalAssets < 10000000)
            score -= 20; // <$10M
        // Net worth adjustment
        const debtToEquity = (profile.totalAssets - profile.netWorth) / profile.netWorth;
        if (debtToEquity < 0.5)
            score += 15;
        else if (debtToEquity < 1.0)
            score += 10;
        else if (debtToEquity < 2.0)
            score += 5;
        else if (debtToEquity > 5.0)
            score -= 20;
        // Revenue stability (mock calculation based on establishment date)
        const yearsInBusiness = (Date.now() - profile.establishedDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
        if (yearsInBusiness > 20)
            score += 10;
        else if (yearsInBusiness > 10)
            score += 5;
        else if (yearsInBusiness < 2)
            score -= 15;
        // Recent financial data freshness
        const dataAge = (Date.now() - profile.lastFinancialUpdate.getTime()) / (30 * 24 * 60 * 60 * 1000);
        if (dataAge > 12)
            score -= 20; // >12 months old
        else if (dataAge > 6)
            score -= 10; // >6 months old
        return Math.min(Math.max(score, 0), 100);
    }
    calculateOperationalRiskScore(profile) {
        let score = 50; // Base score
        // Industry-specific operational risk
        const industryWeight = this.INDUSTRY_RISK_WEIGHTS.get(profile.industry) || 1.0;
        score *= (2.0 - industryWeight); // Invert so lower weight = higher score
        // Regulatory status
        if (profile.regulatoryStatus === 'SUSPENDED' || profile.regulatoryStatus === 'RESTRICTED') {
            score *= 0.3;
        }
        else if (profile.regulatoryStatus === 'INACTIVE') {
            score *= 0.1;
        }
        // KYC compliance
        if (profile.kycStatus === 'PENDING')
            score *= 0.7;
        else if (profile.kycStatus === 'REJECTED' || profile.kycStatus === 'EXPIRED')
            score *= 0.2;
        return Math.min(Math.max(score, 0), 100);
    }
    calculateConcentrationRiskScore(counterpartyId) {
        const analysis = this.concentrationAnalyses.get(counterpartyId);
        if (!analysis)
            return 50; // Default score if no concentration analysis
        let score = 100; // Start with perfect score
        // Penalize high concentration
        if (analysis.concentrationPercentage > 0.20)
            score -= 40; // >20% concentration
        else if (analysis.concentrationPercentage > 0.15)
            score -= 30; // >15% concentration
        else if (analysis.concentrationPercentage > 0.10)
            score -= 20; // >10% concentration
        else if (analysis.concentrationPercentage > 0.05)
            score -= 10; // >5% concentration
        // Account for diversification benefit
        score += analysis.diversificationBenefit * 20;
        return Math.min(Math.max(score, 0), 100);
    }
    calculateGeopoliticalRiskScore(profile) {
        let score = 75; // Base score
        // Country risk adjustment
        const countryWeight = this.COUNTRY_RISK_WEIGHTS.get(profile.country) || 1.0;
        score *= (2.0 - countryWeight); // Invert so lower weight = higher score
        // Sanctions check
        if (profile.sanctions)
            score *= 0.1;
        return Math.min(Math.max(score, 0), 100);
    }
    calculateIndustryRiskScore(profile) {
        let score = 75; // Base score
        // Industry risk adjustment
        const industryWeight = this.INDUSTRY_RISK_WEIGHTS.get(profile.industry) || 1.0;
        score *= (2.0 - industryWeight); // Invert so lower weight = higher score
        return Math.min(Math.max(score, 0), 100);
    }
    calculateHistoricalPerformanceScore(counterpartyId) {
        const events = this.creditEvents.get(counterpartyId) || [];
        let score = 75; // Base score
        // Analyze recent credit events (last 2 years)
        const recentEvents = events.filter(event => (Date.now() - event.eventDate.getTime()) < (2 * 365.25 * 24 * 60 * 60 * 1000));
        recentEvents.forEach(event => {
            if (event.impact === 'NEGATIVE') {
                if (event.severity === 'CRITICAL')
                    score -= 30;
                else if (event.severity === 'HIGH')
                    score -= 20;
                else if (event.severity === 'MEDIUM')
                    score -= 10;
                else
                    score -= 5;
            }
            else if (event.impact === 'POSITIVE') {
                if (event.severity === 'HIGH')
                    score += 10;
                else if (event.severity === 'MEDIUM')
                    score += 5;
            }
        });
        return Math.min(Math.max(score, 0), 100);
    }
    determineRiskTier(compositeScore) {
        if (compositeScore >= 80)
            return 'MINIMAL';
        if (compositeScore >= 65)
            return 'LOW';
        if (compositeScore >= 50)
            return 'MODERATE';
        if (compositeScore >= 30)
            return 'HIGH';
        return 'SEVERE';
    }
    calculateMaxExposureRecommendation(profile, riskComponents) {
        let baseExposure = profile.netWorth * 0.1; // 10% of net worth as starting point
        // Adjust based on credit rating
        const ratingMultipliers = {
            'AAA': 2.0, 'AA+': 1.8, 'AA': 1.6, 'AA-': 1.4,
            'A+': 1.2, 'A': 1.0, 'A-': 0.8,
            'BBB+': 0.6, 'BBB': 0.5, 'BBB-': 0.4,
            'BB+': 0.3, 'BB': 0.25, 'BB-': 0.2,
            'B+': 0.15, 'B': 0.1, 'B-': 0.05,
            'CCC': 0.02, 'CC': 0.01, 'C': 0.005, 'D': 0
        };
        const ratingMultiplier = ratingMultipliers[profile.creditRating] || 0.1;
        baseExposure *= ratingMultiplier;
        // Adjust based on composite risk score
        const riskMultiplier = riskComponents.compositeScore / 100;
        baseExposure *= riskMultiplier;
        // Cap exposure based on our own risk appetite
        const maxAbsoluteExposure = 100000000; // $100M max
        return Math.min(baseExposure, maxAbsoluteExposure);
    }
    calculateRecommendedLimits(maxExposure, riskTier) {
        const tierMultipliers = {
            'MINIMAL': { daily: 0.20, weekly: 0.60, monthly: 1.0 },
            'LOW': { daily: 0.15, weekly: 0.45, monthly: 0.8 },
            'MODERATE': { daily: 0.10, weekly: 0.30, monthly: 0.6 },
            'HIGH': { daily: 0.05, weekly: 0.15, monthly: 0.3 },
            'SEVERE': { daily: 0.02, weekly: 0.06, monthly: 0.1 }
        };
        const multipliers = tierMultipliers[riskTier] || tierMultipliers.MODERATE;
        return {
            dailyLimit: maxExposure * multipliers.daily,
            weeklyLimit: maxExposure * multipliers.weekly,
            monthlyLimit: maxExposure * multipliers.monthly
        };
    }
    identifyRiskFactors(profile, riskComponents) {
        const factors = [];
        if (riskComponents.creditScore < 50) {
            factors.push(`Low credit rating: ${profile.creditRating}`);
        }
        if (profile.probabilityOfDefault > 0.05) {
            factors.push(`High probability of default: ${(profile.probabilityOfDefault * 100).toFixed(2)}%`);
        }
        if (profile.sanctions || profile.blacklisted) {
            factors.push('Subject to sanctions or blacklisted');
        }
        if (profile.kycStatus !== 'APPROVED') {
            factors.push(`KYC status: ${profile.kycStatus}`);
        }
        if (profile.regulatoryStatus !== 'ACTIVE') {
            factors.push(`Regulatory status: ${profile.regulatoryStatus}`);
        }
        if (riskComponents.concentrationRiskScore < 50) {
            factors.push('High concentration risk in portfolio');
        }
        if (riskComponents.geopoliticalRiskScore < 50) {
            factors.push(`Geopolitical risk from country: ${profile.country}`);
        }
        const dataAge = (Date.now() - profile.lastFinancialUpdate.getTime()) / (30 * 24 * 60 * 60 * 1000);
        if (dataAge > 6) {
            factors.push(`Stale financial data (${Math.round(dataAge)} months old)`);
        }
        return factors;
    }
    generateMitigationRequirements(profile, riskComponents, riskTier) {
        const requirements = [];
        if (riskTier === 'HIGH' || riskTier === 'SEVERE') {
            requirements.push('Require additional collateral or guarantee');
            requirements.push('Daily position monitoring required');
            requirements.push('Senior management approval for new trades');
        }
        if (riskComponents.creditScore < 40) {
            requirements.push('Credit insurance or credit default swap hedge');
            requirements.push('Quarterly financial statement review');
        }
        if (profile.kycStatus !== 'APPROVED') {
            requirements.push('Complete KYC verification before trading');
        }
        if (riskComponents.concentrationRiskScore < 50) {
            requirements.push('Implement position limits to reduce concentration');
            requirements.push('Diversification requirements for new positions');
        }
        if (profile.probabilityOfDefault > 0.1) {
            requirements.push('Close-out netting agreement required');
            requirements.push('Real-time credit monitoring');
        }
        return requirements;
    }
    calculateNextReviewDate(riskTier) {
        const reviewIntervals = {
            'MINIMAL': 12, // 12 months
            'LOW': 6, // 6 months
            'MODERATE': 3, // 3 months
            'HIGH': 1, // 1 month
            'SEVERE': 0.25 // 1 week
        };
        const months = reviewIntervals[riskTier] || 3;
        return new Date(Date.now() + months * 30 * 24 * 60 * 60 * 1000);
    }
    async addExposureLimit(counterpartyId, limitData) {
        const limits = this.exposureLimits.get(counterpartyId) || [];
        const exposureLimit = {
            ...limitData,
            utilizationAmount: 0,
            utilizationPercentage: 0
        };
        limits.push(exposureLimit);
        this.exposureLimits.set(counterpartyId, limits);
        this.emit('exposureLimitAdded', exposureLimit);
        return exposureLimit;
    }
    async recordCreditEvent(counterpartyId, eventData) {
        const events = this.creditEvents.get(counterpartyId) || [];
        const creditEvent = {
            ...eventData,
            id: (0, uuid_1.v4)(),
            processedAt: new Date()
        };
        events.push(creditEvent);
        this.creditEvents.set(counterpartyId, events);
        // Re-assess risk if significant event
        if (creditEvent.severity === 'HIGH' || creditEvent.severity === 'CRITICAL') {
            await this.performRiskAssessment(counterpartyId);
        }
        this.emit('creditEventRecorded', creditEvent);
        return creditEvent;
    }
    async performConcentrationAnalysis(counterpartyId, totalPortfolioValue) {
        const profile = this.counterpartyProfiles.get(counterpartyId);
        if (!profile) {
            throw new Error(`Counterparty profile not found: ${counterpartyId}`);
        }
        // Mock calculation - in reality would aggregate actual positions
        const totalExposure = profile.exposureAtDefault;
        const concentrationPercentage = totalExposure / totalPortfolioValue;
        const riskAdjustedExposure = totalExposure * (profile.probabilityOfDefault * profile.lossGivenDefault);
        const diversificationBenefit = Math.max(0, 0.1 - concentrationPercentage); // Benefit decreases with concentration
        const concentrationRisk = Math.max(0, concentrationPercentage - 0.05); // Risk increases above 5%
        const recommendations = [];
        if (concentrationPercentage > 0.15) {
            recommendations.push('Reduce exposure to below 15% of portfolio');
        }
        if (concentrationPercentage > 0.10) {
            recommendations.push('Consider hedging strategies');
        }
        if (diversificationBenefit < 0.02) {
            recommendations.push('Increase portfolio diversification');
        }
        const analysis = {
            counterpartyId,
            totalExposure,
            concentrationPercentage,
            riskAdjustedExposure,
            diversificationBenefit,
            concentrationRisk,
            recommendations,
            calculatedAt: new Date()
        };
        this.concentrationAnalyses.set(counterpartyId, analysis);
        this.emit('concentrationAnalysisCompleted', analysis);
        return analysis;
    }
    // Getter methods
    getCounterpartyProfile(counterpartyId) {
        return this.counterpartyProfiles.get(counterpartyId);
    }
    getRiskMetrics(counterpartyId) {
        return this.riskMetrics.get(counterpartyId);
    }
    getExposureLimits(counterpartyId) {
        return this.exposureLimits.get(counterpartyId) || [];
    }
    getCreditEvents(counterpartyId) {
        return this.creditEvents.get(counterpartyId) || [];
    }
    getConcentrationAnalysis(counterpartyId) {
        return this.concentrationAnalyses.get(counterpartyId);
    }
    getAllCounterparties() {
        return Array.from(this.counterpartyProfiles.values());
    }
    getHighRiskCounterparties() {
        return Array.from(this.riskMetrics.values())
            .filter(metrics => metrics.riskTier === 'HIGH' || metrics.riskTier === 'SEVERE');
    }
    getCounterpartiesDueForReview() {
        const now = new Date();
        return Array.from(this.riskMetrics.values())
            .filter(metrics => metrics.nextReviewDate <= now);
    }
    generateRiskSummaryReport() {
        const allMetrics = Array.from(this.riskMetrics.values());
        const riskTierDistribution = { MINIMAL: 0, LOW: 0, MODERATE: 0, HIGH: 0, SEVERE: 0 };
        let totalScore = 0;
        allMetrics.forEach(metrics => {
            riskTierDistribution[metrics.riskTier]++;
            totalScore += metrics.riskScoreComponents.compositeScore;
        });
        return {
            totalCounterparties: allMetrics.length,
            riskTierDistribution,
            averageCompositeScore: allMetrics.length > 0 ? totalScore / allMetrics.length : 0,
            highRiskCount: riskTierDistribution.HIGH + riskTierDistribution.SEVERE,
            dueForReviewCount: this.getCounterpartiesDueForReview().length
        };
    }
}
exports.CounterpartyRiskAssessmentService = CounterpartyRiskAssessmentService;
