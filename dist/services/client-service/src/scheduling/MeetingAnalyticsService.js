"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MeetingAnalyticsService = void 0;
const events_1 = require("events");
const crypto_1 = require("crypto");
class MeetingAnalyticsService extends events_1.EventEmitter {
    metrics = new Map();
    reports = new Map();
    dashboards = new Map();
    benchmarks = new Map();
    insights = new Map();
    config;
    constructor(config = {}) {
        super();
        this.config = {
            enabled: true,
            realTimeProcessing: true,
            batchProcessingInterval: 60, // 1 hour
            retentionDays: 365,
            anonymizeData: false,
            enablePredictive: true,
            benchmarkSources: ['internal', 'industry'],
            defaultDashboard: 'executive_overview',
            alertThresholds: {
                lowAttendance: 70,
                poorEngagement: 40,
                highCancellationRate: 25,
                techIssues: 3,
                lowSatisfaction: 3.0
            },
            exportFormats: ['pdf', 'excel', 'csv'],
            scheduledReports: true,
            apiRateLimit: 1000,
            ...config
        };
        this.initializeBenchmarks();
        this.initializeDefaultDashboard();
        this.startBackgroundProcessing();
    }
    initializeBenchmarks() {
        // Attendance benchmarks
        this.benchmarks.set('attendance_rate', {
            id: 'attendance_rate',
            category: 'attendance',
            metric: 'Attendance Rate',
            industry: {
                value: 82,
                source: 'Meeting Industry Study 2024',
                lastUpdated: new Date()
            },
            internal: {
                value: 85,
                calculation: 'average',
                period: 90,
                lastCalculated: new Date()
            },
            target: {
                value: 90,
                setBy: 'management',
                reasoning: 'Industry leading performance target'
            },
            thresholds: {
                excellent: 90,
                good: 80,
                fair: 70,
                poor: 60
            },
            unit: '%',
            description: 'Percentage of invited participants who attend meetings',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Engagement benchmarks
        this.benchmarks.set('engagement_score', {
            id: 'engagement_score',
            category: 'engagement',
            metric: 'Engagement Score',
            industry: {
                value: 65,
                source: 'Virtual Meeting Effectiveness Report 2024',
                lastUpdated: new Date()
            },
            target: {
                value: 75,
                setBy: 'hr_team',
                reasoning: 'Drive higher collaboration and participation'
            },
            thresholds: {
                excellent: 80,
                good: 65,
                fair: 50,
                poor: 35
            },
            unit: 'score',
            description: 'Composite score measuring active participation in meetings',
            createdAt: new Date(),
            updatedAt: new Date()
        });
        // Productivity benchmarks
        this.benchmarks.set('effectiveness_score', {
            id: 'effectiveness_score',
            category: 'productivity',
            metric: 'Meeting Effectiveness',
            industry: {
                value: 58,
                source: 'Harvard Business Review Meeting Productivity Study',
                lastUpdated: new Date()
            },
            target: {
                value: 75,
                setBy: 'operations',
                reasoning: 'Improve meeting ROI and decision-making velocity'
            },
            thresholds: {
                excellent: 80,
                good: 65,
                fair: 50,
                poor: 35
            },
            unit: 'score',
            description: 'Score based on agenda completion, decisions made, and action items',
            createdAt: new Date(),
            updatedAt: new Date()
        });
    }
    initializeDefaultDashboard() {
        const dashboard = {
            id: 'executive_overview',
            tenantId: 'default',
            name: 'Executive Overview',
            description: 'High-level meeting analytics for executives',
            layout: {
                widgets: [
                    {
                        id: 'total_meetings',
                        type: 'metric_card',
                        title: 'Total Meetings',
                        position: { x: 0, y: 0, width: 3, height: 2 },
                        config: {
                            metric: 'totalMeetings',
                            dataSource: 'meetings',
                            thresholds: { good: 100, warning: 50, critical: 25 }
                        }
                    },
                    {
                        id: 'attendance_rate',
                        type: 'gauge',
                        title: 'Attendance Rate',
                        position: { x: 3, y: 0, width: 3, height: 2 },
                        config: {
                            metric: 'attendanceRate',
                            dataSource: 'metrics',
                            thresholds: { good: 85, warning: 75, critical: 65 }
                        }
                    },
                    {
                        id: 'engagement_trend',
                        type: 'chart',
                        title: 'Engagement Trend',
                        position: { x: 0, y: 2, width: 6, height: 3 },
                        config: {
                            metric: 'engagementScore',
                            visualization: { type: 'line', period: '30d' }
                        }
                    },
                    {
                        id: 'meeting_types',
                        type: 'chart',
                        title: 'Meeting Types',
                        position: { x: 6, y: 0, width: 3, height: 2 },
                        config: {
                            visualization: { type: 'pie' },
                            dataSource: 'meeting_types'
                        }
                    },
                    {
                        id: 'top_issues',
                        type: 'table',
                        title: 'Top Issues',
                        position: { x: 6, y: 2, width: 3, height: 3 },
                        config: {
                            dataSource: 'issues',
                            filters: { severity: 'high' }
                        }
                    }
                ],
                theme: {
                    primaryColor: '#1f77b4',
                    secondaryColor: '#ff7f0e',
                    backgroundColor: '#ffffff',
                    fontFamily: 'Inter, sans-serif'
                }
            },
            permissions: {
                viewers: [],
                editors: [],
                public: false
            },
            realTimeEnabled: true,
            refreshInterval: 300, // 5 minutes
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(dashboard.id, dashboard);
    }
    startBackgroundProcessing() {
        if (!this.config.enabled)
            return;
        // Process metrics periodically
        setInterval(() => {
            this.processMetricsBatch().catch(error => {
                console.error('Error processing metrics batch:', error);
            });
        }, this.config.batchProcessingInterval * 60 * 1000);
        // Generate predictive insights daily
        if (this.config.enablePredictive) {
            setInterval(() => {
                this.generatePredictiveInsights().catch(error => {
                    console.error('Error generating predictive insights:', error);
                });
            }, 24 * 60 * 60 * 1000);
        }
        // Update benchmarks weekly
        setInterval(() => {
            this.updateInternalBenchmarks().catch(error => {
                console.error('Error updating benchmarks:', error);
            });
        }, 7 * 24 * 60 * 60 * 1000);
    }
    // Metrics collection and processing
    async collectMeetingMetrics(meetingData) {
        const metrics = {
            id: (0, crypto_1.randomUUID)(),
            tenantId: meetingData.tenantId,
            meetingId: meetingData.meetingId,
            period: {
                start: meetingData.startTime,
                end: meetingData.endTime,
                type: 'custom'
            },
            attendance: this.calculateAttendanceMetrics(meetingData.participants),
            engagement: this.calculateEngagementMetrics(meetingData.engagement),
            productivity: this.calculateProductivityMetrics(meetingData.outcomes),
            technical: this.calculateTechnicalMetrics(meetingData.technical),
            satisfaction: this.calculateSatisfactionMetrics(meetingData),
            cost: this.calculateCostMetrics(meetingData.cost, meetingData.participants.length),
            outcomes: this.calculateOutcomeMetrics(meetingData.outcomes),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.metrics.set(metrics.id, metrics);
        // Real-time processing
        if (this.config.realTimeProcessing) {
            await this.processMetricsRealTime(metrics);
        }
        this.emit('metricsCollected', {
            metricsId: metrics.id,
            meetingId: meetingData.meetingId,
            tenantId: meetingData.tenantId,
            timestamp: new Date()
        });
        return metrics;
    }
    calculateAttendanceMetrics(participants) {
        const invited = participants.length;
        const attended = participants.filter(p => p.status === 'attended' || p.joinTime).length;
        const declined = participants.filter(p => p.status === 'declined').length;
        const noShow = invited - attended - declined;
        const attendanceRate = invited > 0 ? (attended / invited) * 100 : 0;
        // Calculate average join time (minutes after start)
        const joinTimes = participants
            .filter(p => p.joinTime && p.meetingStartTime)
            .map(p => (new Date(p.joinTime).getTime() - new Date(p.meetingStartTime).getTime()) / (1000 * 60));
        const avgJoinTime = joinTimes.length > 0 ? joinTimes.reduce((a, b) => a + b, 0) / joinTimes.length : 0;
        // Calculate average duration per participant
        const durations = participants
            .filter(p => p.duration)
            .map(p => p.duration);
        const avgDuration = durations.length > 0 ? durations.reduce((a, b) => a + b, 0) / durations.length : 0;
        // On-time rate (joined within 5 minutes)
        const onTime = joinTimes.filter(time => time <= 5).length;
        const onTimeRate = attended > 0 ? (onTime / attended) * 100 : 0;
        return {
            invited,
            attended,
            declined,
            noShow,
            attendanceRate,
            avgJoinTime,
            avgDuration,
            onTimeRate
        };
    }
    calculateEngagementMetrics(engagement = {}) {
        const { participationRate = Math.random() * 40 + 40, // Mock: 40-80%
        chatMessages = Math.floor(Math.random() * 50), screenShares = Math.floor(Math.random() * 5), pollsAnswered = Math.floor(Math.random() * 10), reactionsUsed = Math.floor(Math.random() * 20), questionsAsked = Math.floor(Math.random() * 8), avgSpeakingTime = Math.random() * 15 + 2, // 2-17 minutes
        silencePercentage = Math.random() * 30 + 10 // 10-40%
         } = engagement;
        // Calculate interaction score based on various factors
        const interactionScore = Math.min(100, (participationRate * 0.3) +
            (Math.min(chatMessages / 20, 1) * 20) +
            (Math.min(screenShares / 3, 1) * 15) +
            (Math.min(pollsAnswered / 5, 1) * 15) +
            (Math.min(reactionsUsed / 10, 1) * 10) +
            (Math.min(questionsAsked / 5, 1) * 10));
        return {
            participationRate,
            chatMessages,
            screenShares,
            pollsAnswered,
            reactionsUsed,
            questionsAsked,
            avgSpeakingTime,
            silencePercentage,
            interactionScore
        };
    }
    calculateProductivityMetrics(outcomes = {}) {
        const { agendaItemsCovered = Math.floor(Math.random() * 8) + 3, totalAgendaItems = Math.floor(Math.random() * 10) + 5, decisionsRecorded = Math.floor(Math.random() * 5), actionItemsCreated = Math.floor(Math.random() * 8), actionItemsCompleted = Math.floor(Math.random() * 3), followUpMeetingsScheduled = Math.floor(Math.random() * 2), timeBoxAdherence = Math.random() * 40 + 60 // 60-100%
         } = outcomes;
        const agendaCompletionRate = totalAgendaItems > 0 ?
            (agendaItemsCovered / totalAgendaItems) * 100 : 0;
        // Calculate effectiveness score
        const meetingEffectivenessScore = Math.min(100, (agendaCompletionRate * 0.3) +
            (Math.min(decisionsRecorded / 3, 1) * 25) +
            (Math.min(actionItemsCreated / 5, 1) * 25) +
            (timeBoxAdherence * 0.2));
        return {
            agendaItemsCovered,
            agendaCompletionRate,
            decisionsRecorded,
            actionItemsCreated,
            actionItemsCompleted,
            followUpMeetingsScheduled,
            meetingEffectivenessScore,
            timeBoxAdherence
        };
    }
    calculateTechnicalMetrics(technical = {}) {
        const { avgVideoQuality = Math.random() * 2 + 3, // 3-5
        avgAudioQuality = Math.random() * 2 + 3, // 3-5
        connectionIssues = Math.floor(Math.random() * 5), techSupportRequests = Math.floor(Math.random() * 2), recordingSuccessRate = Math.random() * 20 + 80 // 80-100%
         } = technical;
        // Mock device and browser breakdown
        const deviceBreakdown = {
            desktop: Math.floor(Math.random() * 10) + 5,
            mobile: Math.floor(Math.random() * 5) + 2,
            tablet: Math.floor(Math.random() * 3),
            phone: Math.floor(Math.random() * 2)
        };
        const browserBreakdown = {
            chrome: Math.floor(Math.random() * 12) + 8,
            firefox: Math.floor(Math.random() * 4) + 2,
            safari: Math.floor(Math.random() * 3) + 1,
            edge: Math.floor(Math.random() * 2) + 1
        };
        const networkQuality = {
            excellent: Math.floor(Math.random() * 8) + 5,
            good: Math.floor(Math.random() * 5) + 3,
            fair: Math.floor(Math.random() * 3) + 1,
            poor: Math.floor(Math.random() * 2)
        };
        return {
            avgVideoQuality,
            avgAudioQuality,
            connectionIssues,
            techSupportRequests,
            deviceBreakdown,
            browserBreakdown,
            networkQuality,
            recordingSuccessRate
        };
    }
    calculateSatisfactionMetrics(meetingData) {
        // Mock satisfaction data - would come from post-meeting surveys
        const overallRating = Math.random() * 2 + 3; // 3-5 range
        const responseRate = Math.random() * 40 + 40; // 40-80%
        const ratings = {
            content: Math.random() * 2 + 3,
            facilitation: Math.random() * 2 + 3,
            technology: Math.random() * 2 + 3,
            duration: Math.random() * 2 + 3,
            timing: Math.random() * 2 + 3
        };
        // Calculate NPS (mock)
        const npsScore = Math.floor(Math.random() * 60 - 10); // -10 to 50 range
        const feedbackCount = Math.floor(Math.random() * 10) + 2;
        const improvementSuggestions = [
            'Better time management',
            'More interactive elements',
            'Clearer agenda',
            'Improved audio quality',
            'More focused discussion'
        ].slice(0, Math.floor(Math.random() * 3) + 1);
        return {
            overallRating,
            responseRate,
            ratings,
            npsScore,
            feedbackCount,
            improvementSuggestions
        };
    }
    calculateCostMetrics(costData = {}, participantCount) {
        const { hourlyRates = { employee: 75, manager: 120, executive: 200 }, duration = 60, // minutes
        technologyCost = 25, facilitiesCost = 50, materialsCost = 15 } = costData;
        // Estimate personnel cost based on participant mix
        const avgHourlyRate = 85; // Simplified average
        const personnel = (avgHourlyRate * participantCount * duration) / 60;
        const cost = {
            estimated: personnel + technologyCost + facilitiesCost + materialsCost,
            currency: 'USD',
            breakdown: {
                personnel,
                technology: technologyCost,
                facilities: facilitiesCost,
                materials: materialsCost
            },
            costPerParticipant: 0,
            costPerMinute: 0
        };
        cost.costPerParticipant = participantCount > 0 ? cost.estimated / participantCount : 0;
        cost.costPerMinute = duration > 0 ? cost.estimated / duration : 0;
        return cost;
    }
    calculateOutcomeMetrics(outcomes = {}) {
        const { objectivesDefined = Math.floor(Math.random() * 5) + 2, objectivesAchieved = Math.floor(Math.random() * 4) + 1, objectivesPartiallyAchieved = Math.floor(Math.random() * 2), nextStepsDefined = Math.floor(Math.random() * 8) + 3, nextStepsAssigned = Math.floor(Math.random() * 6) + 2, nextStepsStarted = Math.floor(Math.random() * 3) + 1 } = outcomes;
        const objectivesNotAchieved = Math.max(0, objectivesDefined - objectivesAchieved - objectivesPartiallyAchieved);
        const achievementRate = objectivesDefined > 0 ?
            (objectivesAchieved / objectivesDefined) * 100 : 0;
        const completionRate = nextStepsAssigned > 0 ?
            (nextStepsStarted / nextStepsAssigned) * 100 : 0;
        return {
            objectives: {
                defined: objectivesDefined,
                achieved: objectivesAchieved,
                partially_achieved: objectivesPartiallyAchieved,
                not_achieved: objectivesNotAchieved,
                achievementRate
            },
            nextSteps: {
                defined: nextStepsDefined,
                assigned: nextStepsAssigned,
                started: nextStepsStarted,
                completionRate
            },
            roi: {
            // ROI would be calculated based on actual business impact
            }
        };
    }
    async processMetricsRealTime(metrics) {
        // Check for alerts
        await this.checkAlertThresholds(metrics);
        // Update dashboards
        await this.updateDashboards(metrics);
        // Generate insights
        if (this.config.enablePredictive) {
            await this.updatePredictiveModels(metrics);
        }
    }
    async checkAlertThresholds(metrics) {
        const alerts = [];
        // Low attendance alert
        if (metrics.attendance.attendanceRate < this.config.alertThresholds.lowAttendance) {
            alerts.push({
                type: 'low_attendance',
                message: `Low attendance rate: ${metrics.attendance.attendanceRate.toFixed(1)}%`,
                severity: 'medium'
            });
        }
        // Poor engagement alert
        if (metrics.engagement.interactionScore < this.config.alertThresholds.poorEngagement) {
            alerts.push({
                type: 'poor_engagement',
                message: `Low engagement score: ${metrics.engagement.interactionScore.toFixed(1)}`,
                severity: 'medium'
            });
        }
        // Technical issues alert
        if (metrics.technical.connectionIssues >= this.config.alertThresholds.techIssues) {
            alerts.push({
                type: 'tech_issues',
                message: `Multiple technical issues reported: ${metrics.technical.connectionIssues}`,
                severity: 'high'
            });
        }
        // Low satisfaction alert
        if (metrics.satisfaction.overallRating < this.config.alertThresholds.lowSatisfaction) {
            alerts.push({
                type: 'low_satisfaction',
                message: `Low satisfaction rating: ${metrics.satisfaction.overallRating.toFixed(1)}/5`,
                severity: 'high'
            });
        }
        // Emit alerts
        for (const alert of alerts) {
            this.emit('alert', {
                ...alert,
                meetingId: metrics.meetingId,
                metricsId: metrics.id,
                timestamp: new Date()
            });
        }
    }
    async updateDashboards(metrics) {
        // Update real-time dashboards
        const realTimeDashboards = Array.from(this.dashboards.values())
            .filter(dashboard => dashboard.realTimeEnabled);
        for (const dashboard of realTimeDashboards) {
            dashboard.lastUpdated = new Date();
            this.dashboards.set(dashboard.id, dashboard);
        }
        this.emit('dashboardsUpdated', {
            count: realTimeDashboards.length,
            timestamp: new Date()
        });
    }
    // Report generation
    async generateReport(reportRequest) {
        const report = {
            id: (0, crypto_1.randomUUID)(),
            tenantId: reportRequest.tenantId,
            name: reportRequest.name,
            description: reportRequest.description,
            type: reportRequest.type,
            period: {
                start: reportRequest.period.start,
                end: reportRequest.period.end,
                comparison: reportRequest.comparison
            },
            filters: reportRequest.filters || {},
            metrics: await this.calculateReportMetrics(reportRequest),
            insights: await this.generateReportInsights(reportRequest),
            recommendations: await this.generateRecommendations(reportRequest),
            visualizations: await this.generateVisualizations(reportRequest),
            export: {
                formats: this.config.exportFormats
            },
            status: 'generating',
            generatedBy: {
                userId: reportRequest.userId,
                userName: reportRequest.userName
            },
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.reports.set(report.id, report);
        // Simulate report generation
        setTimeout(() => {
            report.status = 'ready';
            report.updatedAt = new Date();
            this.reports.set(report.id, report);
            this.emit('reportGenerated', {
                reportId: report.id,
                type: report.type,
                tenantId: report.tenantId,
                timestamp: new Date()
            });
        }, 5000);
        return report;
    }
    async calculateReportMetrics(request) {
        // Filter metrics based on request criteria
        const filteredMetrics = Array.from(this.metrics.values())
            .filter(metric => metric.tenantId === request.tenantId &&
            metric.period.start >= request.period.start &&
            metric.period.end <= request.period.end);
        const totalMeetings = filteredMetrics.length;
        const totalHours = filteredMetrics.reduce((sum, m) => sum + (m.period.end.getTime() - m.period.start.getTime()) / (1000 * 60 * 60), 0);
        const totalParticipants = filteredMetrics.reduce((sum, m) => sum + m.attendance.attended, 0);
        const avgMeetingDuration = totalMeetings > 0 ? (totalHours * 60) / totalMeetings : 0;
        const avgParticipants = totalMeetings > 0 ? totalParticipants / totalMeetings : 0;
        // Find top and underperforming meetings
        const sortedByScore = filteredMetrics
            .map(m => ({
            meetingId: m.meetingId,
            title: `Meeting ${m.meetingId}`,
            score: (m.engagement.interactionScore + m.productivity.meetingEffectivenessScore) / 2
        }))
            .sort((a, b) => b.score - a.score);
        const topPerformingMeetings = sortedByScore.slice(0, 5).map(m => ({
            ...m,
            reason: 'High engagement and productivity scores'
        }));
        const underperformingMeetings = sortedByScore.slice(-5).map(m => ({
            ...m,
            issues: ['Low engagement', 'Poor time management', 'Technical issues']
        }));
        // Calculate trends (simplified)
        const trends = [
            {
                metric: 'Attendance Rate',
                direction: Math.random() > 0.5 ? 'up' : 'down',
                change: Math.random() * 10 + 2,
                significance: 'medium'
            },
            {
                metric: 'Engagement Score',
                direction: Math.random() > 0.4 ? 'up' : 'down',
                change: Math.random() * 8 + 1,
                significance: 'high'
            }
        ];
        // Benchmarks comparison
        const benchmarks = Array.from(this.benchmarks.values()).map(benchmark => ({
            metric: benchmark.metric,
            current: Math.random() * 40 + 60, // Mock current value
            industry: benchmark.industry?.value,
            internal: benchmark.internal?.value,
            target: benchmark.target?.value,
            status: Math.random() > 0.6 ? 'above' : 'below'
        }));
        return {
            totalMeetings,
            totalHours,
            totalParticipants,
            avgMeetingDuration,
            avgParticipants,
            topPerformingMeetings,
            underperformingMeetings,
            trends,
            benchmarks
        };
    }
    async generateReportInsights(request) {
        return [
            {
                type: 'positive',
                category: 'engagement',
                message: 'Meeting engagement has increased by 15% compared to last quarter',
                impact: 'medium',
                confidence: 0.85,
                recommendations: ['Continue current facilitation practices', 'Share best practices across teams']
            },
            {
                type: 'opportunity',
                category: 'productivity',
                message: 'Meetings scheduled for 30 minutes show 23% higher effectiveness scores',
                impact: 'high',
                confidence: 0.78,
                recommendations: ['Default meeting duration to 30 minutes', 'Provide time management training']
            },
            {
                type: 'negative',
                category: 'technical',
                message: 'Audio quality issues increased by 12% in remote meetings',
                impact: 'medium',
                confidence: 0.92,
                recommendations: ['Upgrade audio equipment', 'Provide technical training']
            }
        ];
    }
    async generateRecommendations(request) {
        return [
            {
                id: (0, crypto_1.randomUUID)(),
                category: 'scheduling',
                priority: 'high',
                title: 'Implement Default 30-Minute Meetings',
                description: 'Change default meeting duration from 60 to 30 minutes to improve focus and productivity',
                expectedImpact: '15-20% improvement in effectiveness scores',
                effort: 'low',
                timeline: '1-2 weeks',
                cost: 0,
                roi: 25000,
                status: 'pending'
            },
            {
                id: (0, crypto_1.randomUUID)(),
                category: 'technology',
                priority: 'medium',
                title: 'Audio Equipment Upgrade Program',
                description: 'Deploy high-quality headsets to frequent meeting participants',
                expectedImpact: 'Reduce audio quality complaints by 80%',
                effort: 'medium',
                timeline: '4-6 weeks',
                cost: 15000,
                roi: 35000,
                status: 'pending'
            },
            {
                id: (0, crypto_1.randomUUID)(),
                category: 'training',
                priority: 'medium',
                title: 'Meeting Facilitation Training',
                description: 'Provide training for meeting organizers on effective facilitation techniques',
                expectedImpact: '10-15% improvement in engagement scores',
                effort: 'high',
                timeline: '8-12 weeks',
                cost: 25000,
                roi: 45000,
                status: 'pending'
            }
        ];
    }
    async generateVisualizations(request) {
        return [
            {
                type: 'line_chart',
                title: 'Meeting Trends Over Time',
                data: {
                    labels: ['Week 1', 'Week 2', 'Week 3', 'Week 4'],
                    datasets: [
                        {
                            label: 'Attendance Rate',
                            data: [82, 85, 78, 87]
                        },
                        {
                            label: 'Engagement Score',
                            data: [65, 68, 62, 71]
                        }
                    ]
                }
            },
            {
                type: 'bar_chart',
                title: 'Meeting Types Performance',
                data: {
                    labels: ['Client Meetings', 'Team Meetings', 'Board Meetings', 'Training'],
                    datasets: [
                        {
                            label: 'Effectiveness Score',
                            data: [78, 65, 85, 72]
                        }
                    ]
                }
            },
            {
                type: 'pie_chart',
                title: 'Meeting Duration Distribution',
                data: {
                    labels: ['< 30 min', '30-60 min', '60-90 min', '> 90 min'],
                    data: [25, 45, 20, 10]
                }
            }
        ];
    }
    // Dashboard management
    async createDashboard(dashboardData) {
        const dashboard = {
            id: (0, crypto_1.randomUUID)(),
            ...dashboardData,
            lastUpdated: new Date(),
            createdAt: new Date(),
            updatedAt: new Date()
        };
        this.dashboards.set(dashboard.id, dashboard);
        this.emit('dashboardCreated', {
            dashboardId: dashboard.id,
            tenantId: dashboard.tenantId,
            timestamp: new Date()
        });
        return dashboard;
    }
    async getDashboards(tenantId) {
        return Array.from(this.dashboards.values())
            .filter(dashboard => dashboard.tenantId === tenantId || dashboard.tenantId === 'default');
    }
    async getDashboard(dashboardId) {
        return this.dashboards.get(dashboardId) || null;
    }
    // Predictive analytics
    async generatePredictiveInsights() {
        if (!this.config.enablePredictive)
            return;
        console.log('Generating predictive insights...');
        // Mock predictive insights
        const insights = [
            {
                id: (0, crypto_1.randomUUID)(),
                tenantId: 'default',
                type: 'trend_forecast',
                metric: 'attendance_rate',
                category: 'attendance',
                prediction: {
                    timeframe: 30,
                    confidence: 0.82,
                    direction: 'increase',
                    magnitude: 'medium'
                },
                factors: [
                    { factor: 'meeting_duration', influence: -0.3, confidence: 0.75 },
                    { factor: 'time_of_day', influence: 0.2, confidence: 0.68 },
                    { factor: 'meeting_type', influence: 0.15, confidence: 0.71 }
                ],
                recommendations: [
                    {
                        action: 'Schedule more meetings between 10 AM - 2 PM',
                        impact: 'Increase attendance by 8-12%',
                        effort: 'low',
                        priority: 'medium'
                    }
                ],
                model: {
                    type: 'random_forest',
                    accuracy: 0.82,
                    lastTrained: new Date(),
                    features: ['meeting_duration', 'time_of_day', 'meeting_type', 'day_of_week']
                },
                status: 'active',
                createdAt: new Date(),
                updatedAt: new Date()
            }
        ];
        for (const insight of insights) {
            this.insights.set(insight.id, insight);
        }
        this.emit('predictiveInsightsGenerated', {
            count: insights.length,
            timestamp: new Date()
        });
    }
    async updatePredictiveModels(metrics) {
        // Update ML models with new data
        console.log(`Updating predictive models with metrics from meeting ${metrics.meetingId}`);
    }
    async processMetricsBatch() {
        console.log('Processing metrics batch...');
        // Update internal benchmarks
        await this.updateInternalBenchmarks();
        // Clean up old metrics
        await this.cleanupOldMetrics();
    }
    async updateInternalBenchmarks() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - 90); // Last 90 days
        const recentMetrics = Array.from(this.metrics.values())
            .filter(metric => metric.createdAt >= cutoffDate);
        if (recentMetrics.length === 0)
            return;
        // Update attendance rate benchmark
        const attendanceRates = recentMetrics.map(m => m.attendance.attendanceRate);
        const avgAttendanceRate = attendanceRates.reduce((a, b) => a + b, 0) / attendanceRates.length;
        const attendanceBenchmark = this.benchmarks.get('attendance_rate');
        if (attendanceBenchmark && attendanceBenchmark.internal) {
            attendanceBenchmark.internal.value = avgAttendanceRate;
            attendanceBenchmark.internal.lastCalculated = new Date();
        }
        // Update engagement score benchmark
        const engagementScores = recentMetrics.map(m => m.engagement.interactionScore);
        const avgEngagementScore = engagementScores.reduce((a, b) => a + b, 0) / engagementScores.length;
        const engagementBenchmark = this.benchmarks.get('engagement_score');
        if (engagementBenchmark && engagementBenchmark.internal) {
            engagementBenchmark.internal.value = avgEngagementScore;
            engagementBenchmark.internal.lastCalculated = new Date();
        }
        console.log('Internal benchmarks updated');
    }
    async cleanupOldMetrics() {
        const cutoffDate = new Date();
        cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
        const oldMetrics = Array.from(this.metrics.entries())
            .filter(([_, metric]) => metric.createdAt < cutoffDate);
        for (const [id] of oldMetrics) {
            this.metrics.delete(id);
        }
        console.log(`Cleaned up ${oldMetrics.length} old metrics`);
    }
    // API methods
    async getMetrics(filters) {
        let metrics = Array.from(this.metrics.values());
        if (filters) {
            if (filters.tenantId) {
                metrics = metrics.filter(m => m.tenantId === filters.tenantId);
            }
            if (filters.meetingId) {
                metrics = metrics.filter(m => m.meetingId === filters.meetingId);
            }
            if (filters.startDate) {
                metrics = metrics.filter(m => m.period.start >= filters.startDate);
            }
            if (filters.endDate) {
                metrics = metrics.filter(m => m.period.end <= filters.endDate);
            }
        }
        return metrics.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async getReports(tenantId) {
        return Array.from(this.reports.values())
            .filter(report => report.tenantId === tenantId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }
    async getReport(reportId) {
        return this.reports.get(reportId) || null;
    }
    async getBenchmarks() {
        return Array.from(this.benchmarks.values());
    }
    async getPredictiveInsights(tenantId) {
        return Array.from(this.insights.values())
            .filter(insight => insight.tenantId === tenantId || insight.tenantId === 'default')
            .filter(insight => insight.status === 'active');
    }
    // System health and monitoring
    async getSystemHealth() {
        const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const metrics = {
            total: this.metrics.size,
            recent: Array.from(this.metrics.values()).filter(m => m.createdAt >= oneDayAgo).length
        };
        const reports = {
            total: this.reports.size,
            generating: Array.from(this.reports.values()).filter(r => r.status === 'generating').length,
            failed: Array.from(this.reports.values()).filter(r => r.status === 'failed').length
        };
        const dashboards = {
            total: this.dashboards.size,
            realTime: Array.from(this.dashboards.values()).filter(d => d.realTimeEnabled).length
        };
        const insights = {
            total: this.insights.size,
            active: Array.from(this.insights.values()).filter(i => i.status === 'active').length
        };
        const processing = {
            realTimeEnabled: this.config.realTimeProcessing,
            lastBatchProcessing: new Date(), // Mock
            queueSize: 0 // Mock
        };
        let status = 'healthy';
        if (reports.failed > 5 || !this.config.enabled) {
            status = 'degraded';
        }
        if (reports.failed > 20 || metrics.recent === 0) {
            status = 'unhealthy';
        }
        return {
            status,
            metrics,
            reports,
            dashboards,
            insights,
            processing,
            timestamp: new Date()
        };
    }
    async shutdown() {
        console.log('Shutting down Meeting Analytics Service...');
        // Clear all data
        this.metrics.clear();
        this.reports.clear();
        this.dashboards.clear();
        this.benchmarks.clear();
        this.insights.clear();
        console.log('Meeting Analytics Service shutdown complete');
    }
}
exports.MeetingAnalyticsService = MeetingAnalyticsService;
exports.default = MeetingAnalyticsService;
