"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BestExecutionService = void 0;
const crypto_1 = require("crypto");
const Regulatory_1 = require("../../models/regulatory/Regulatory");
const logger_1 = require("../../utils/logger");
const eventPublisher_1 = require("../../utils/eventPublisher");
class BestExecutionService {
    eventPublisher;
    reports = new Map();
    filings = new Map();
    constructor() {
        this.eventPublisher = new eventPublisher_1.EventPublisher();
    }
    async createBestExecutionReport(data) {
        try {
            logger_1.logger.info('Creating best execution report', {
                tenantId: data.tenantId,
                reportType: data.reportType,
                startDate: data.reportingPeriod.startDate,
                endDate: data.reportingPeriod.endDate,
                venuesCount: data.executionVenues.length
            });
            const reportId = (0, crypto_1.randomUUID)();
            // Calculate execution quality metrics
            const executionQualityMetrics = this.calculateExecutionQualityMetrics(data.executionVenues);
            const report = {
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
                status: Regulatory_1.FilingStatus.DRAFT,
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
        }
        catch (error) {
            logger_1.logger.error('Error creating best execution report:', error);
            throw error;
        }
    }
    async validateBestExecutionReport(reportId) {
        try {
            const report = this.reports.get(reportId);
            if (!report) {
                throw new Error('Best execution report not found');
            }
            logger_1.logger.info('Validating best execution report', {
                reportId,
                reportType: report.reportType,
                venuesCount: report.executionVenues.length
            });
            const errors = [];
            const warnings = [];
            // Reporting Period Validations
            const reportingDays = Math.ceil((report.reportingPeriod.endDate.getTime() - report.reportingPeriod.startDate.getTime()) / (1000 * 60 * 60 * 24));
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
            const assetClassTotal = report.orderAnalysis.ordersByAssetClass.reduce((sum, ac) => sum + ac.orderCount, 0);
            if (Math.abs(assetClassTotal - report.orderAnalysis.totalOrders) > report.orderAnalysis.totalOrders * 0.05) {
                warnings.push({
                    section: 'OrderAnalysis',
                    field: 'ordersByAssetClass',
                    message: 'Asset class breakdown should account for most orders'
                });
            }
            // Size analysis validation
            const sizeTotal = report.orderAnalysis.ordersBySize.reduce((sum, size) => sum + size.orderCount, 0);
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
            const venueConcentration = this.calculateVenueConcentration(report.executionVenues);
            const averageExecutionQuality = this.calculateAverageExecutionQuality(report.executionVenues);
            const complianceScore = this.calculateComplianceScore(errors.length, warnings.length);
            // Calculate completion percentage
            const totalRequiredFields = 20; // Simplified count
            const completedFields = totalRequiredFields - errors.length;
            const completionPercentage = Math.max(0, (completedFields / totalRequiredFields) * 100);
            // Update report status
            if (errors.length === 0 && completionPercentage >= 90) {
                report.status = Regulatory_1.FilingStatus.REVIEW;
            }
            else {
                report.status = Regulatory_1.FilingStatus.DRAFT;
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
        }
        catch (error) {
            logger_1.logger.error('Error validating best execution report:', error);
            throw error;
        }
    }
    async submitBestExecutionReport(reportId, submittedBy) {
        try {
            const report = this.reports.get(reportId);
            if (!report) {
                throw new Error('Best execution report not found');
            }
            logger_1.logger.info('Submitting best execution report', {
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
            const filingId = (0, crypto_1.randomUUID)();
            const filing = {
                id: filingId,
                tenantId: report.tenantId,
                formType: Regulatory_1.FormType.FORM_ADV, // Best execution reports are typically part of ADV requirements
                jurisdiction: Regulatory_1.RegulatoryJurisdiction.SEC,
                filingDate: new Date(),
                reportingPeriodEnd: report.reportingPeriod.endDate,
                dueDate: this.calculateDueDate(report.reportType, report.reportingPeriod.endDate),
                formData: report,
                status: Regulatory_1.FilingStatus.FILED,
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
            report.status = Regulatory_1.FilingStatus.FILED;
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
        }
        catch (error) {
            logger_1.logger.error('Error submitting best execution report:', error);
            throw error;
        }
    }
    async generateExecutionQualityAnalysis(reportId) {
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
                const strengths = [];
                const improvements = [];
                if (quality.priceImprovementRate > 15)
                    strengths.push('High price improvement rate');
                if (quality.marketableOrderFillRate > 95)
                    strengths.push('Excellent fill rates');
                if (quality.averageEffectiveSpread < 0.005)
                    strengths.push('Tight spreads');
                if (quality.priceImprovementRate < 5)
                    improvements.push('Low price improvement opportunity');
                if (quality.marketableOrderFillRate < 85)
                    improvements.push('Fill rates below benchmark');
                if (quality.averageEffectiveSpread > 0.01)
                    improvements.push('Wide effective spreads');
                let recommendation = 'maintain';
                if (executionScore > 80)
                    recommendation = 'increase';
                else if (executionScore < 50)
                    recommendation = 'decrease';
                else if (executionScore < 30)
                    recommendation = 'discontinue';
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
                    'above_market' : 'at_market',
                improvementOpportunities: [
                    'Enhanced smart order routing algorithms',
                    'Real-time venue performance monitoring',
                    'Improved order timing strategies'
                ]
            };
            return {
                overallMetrics,
                venueComparison,
                recommendations,
                benchmarkComparison
            };
        }
        catch (error) {
            logger_1.logger.error('Error generating execution quality analysis:', error);
            throw error;
        }
    }
    async getBestExecutionReport(reportId) {
        return this.reports.get(reportId) || null;
    }
    async getBestExecutionReportsByTenant(tenantId) {
        return Array.from(this.reports.values()).filter(report => report.tenantId === tenantId);
    }
    async updateBestExecutionReport(reportId, updates) {
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
    calculateExecutionQualityMetrics(venues) {
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
    calculateVenueConcentration(venues) {
        if (venues.length === 0)
            return 0;
        const totalValue = venues.reduce((sum, venue) => sum + venue.orderFlow.totalNotionalValue, 0);
        const shares = venues.map(venue => (venue.orderFlow.totalNotionalValue / totalValue) * 100);
        // Calculate Herfindahl-Hirschman Index
        return shares.reduce((sum, share) => sum + Math.pow(share, 2), 0);
    }
    calculateAverageExecutionQuality(venues) {
        if (venues.length === 0)
            return 0;
        const totalNotional = venues.reduce((sum, venue) => sum + venue.orderFlow.totalNotionalValue, 0);
        return venues.reduce((weightedSum, venue) => {
            const weight = venue.orderFlow.totalNotionalValue / totalNotional;
            const venueScore = this.calculateVenueExecutionScore(venue.executionMetrics);
            return weightedSum + (venueScore * weight);
        }, 0);
    }
    calculateVenueExecutionScore(metrics) {
        // Weighted scoring of execution quality metrics
        const priceImprovementScore = Math.min(100, metrics.priceImprovementRate * 5); // 0-100
        const fillRateScore = metrics.marketableOrderFillRate; // Already 0-100
        const spreadScore = Math.max(0, 100 - (metrics.averageEffectiveSpread * 10000)); // Lower is better
        return (priceImprovementScore * 0.4) + (fillRateScore * 0.4) + (spreadScore * 0.2);
    }
    calculateComplianceScore(errorCount, warningCount) {
        const maxScore = 100;
        const errorPenalty = errorCount * 15;
        const warningPenalty = warningCount * 5;
        return Math.max(0, maxScore - errorPenalty - warningPenalty);
    }
    calculateDueDate(reportType, periodEnd) {
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
exports.BestExecutionService = BestExecutionService;
