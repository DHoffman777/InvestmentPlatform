import { EventEmitter } from 'events';
export interface IntrusionRule {
    id: string;
    name: string;
    description: string;
    category: 'malware' | 'dos' | 'reconnaissance' | 'exploitation' | 'policy_violation' | 'financial_fraud';
    severity: 'low' | 'medium' | 'high' | 'critical';
    pattern: string;
    patternType: 'regex' | 'signature' | 'behavioral' | 'statistical';
    protocol: 'tcp' | 'udp' | 'icmp' | 'http' | 'https' | 'ftp' | 'smtp' | 'any';
    direction: 'inbound' | 'outbound' | 'both';
    action: 'alert' | 'block' | 'drop' | 'reset' | 'quarantine';
    threshold: number;
    timeWindow: number;
    enabled: boolean;
    lastUpdated: Date;
    falsePositiveRate: number;
    accuracy: number;
}
export interface SecurityEvent {
    id: string;
    timestamp: Date;
    ruleId: string;
    ruleName: string;
    category: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    sourceIp: string;
    destinationIp: string;
    sourcePort: number;
    destinationPort: number;
    protocol: string;
    payload?: string;
    action: 'alerted' | 'blocked' | 'dropped' | 'reset' | 'quarantined';
    confidence: number;
    riskScore: number;
    geoLocation?: {
        country: string;
        region: string;
        city: string;
        latitude: number;
        longitude: number;
    };
    threatIntelligence?: {
        isMalicious: boolean;
        reputation: 'good' | 'suspicious' | 'malicious' | 'unknown';
        categories: string[];
        sources: string[];
    };
    investigationStatus: 'new' | 'investigating' | 'confirmed' | 'false_positive' | 'resolved';
    assignedTo?: string;
    notes?: string;
}
export interface BehavioralProfile {
    entityId: string;
    entityType: 'ip' | 'user' | 'service' | 'device';
    baseline: {
        trafficVolume: number;
        connectionCount: number;
        portUsage: number[];
        timePatterns: {
            [hour: string]: number;
        };
        protocols: {
            [protocol: string]: number;
        };
        destinationCountries: {
            [country: string]: number;
        };
    };
    currentMetrics: {
        trafficVolume: number;
        connectionCount: number;
        portUsage: number[];
        protocols: {
            [protocol: string]: number;
        };
        anomalyScore: number;
        lastUpdated: Date;
    };
    anomalies: BehavioralAnomaly[];
    learningPeriod: number;
    established: boolean;
}
export interface BehavioralAnomaly {
    id: string;
    type: 'volume_spike' | 'unusual_ports' | 'geographic_anomaly' | 'time_anomaly' | 'protocol_deviation';
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    detectedAt: Date;
    score: number;
    threshold: number;
    evidence: any;
}
export interface ThreatFeed {
    id: string;
    name: string;
    source: string;
    type: 'ip_reputation' | 'domain_reputation' | 'malware_signatures' | 'vulnerability_intel';
    updateFrequency: number;
    lastUpdated: Date;
    enabled: boolean;
    reliability: number;
    entries: ThreatIndicator[];
}
export interface ThreatIndicator {
    indicator: string;
    type: 'ip' | 'domain' | 'hash' | 'signature';
    severity: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    category: string[];
    firstSeen: Date;
    lastSeen: Date;
    sources: string[];
    context: string;
}
export interface MitigationAction {
    id: string;
    name: string;
    type: 'firewall_rule' | 'ip_block' | 'rate_limit' | 'quarantine' | 'alert_only' | 'service_restart';
    description: string;
    automated: boolean;
    parameters: Record<string, any>;
    duration: number;
    conditions: string[];
    enabled: boolean;
}
export interface SecurityIncident {
    id: string;
    title: string;
    description: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    category: string;
    status: 'open' | 'investigating' | 'contained' | 'resolved' | 'false_positive';
    createdAt: Date;
    updatedAt: Date;
    resolvedAt?: Date;
    assignedTo?: string;
    events: SecurityEvent[];
    timeline: IncidentTimelineEntry[];
    mitigation: MitigationAction[];
    impact: {
        affectedSystems: string[];
        affectedUsers: number;
        businessImpact: 'low' | 'medium' | 'high' | 'critical';
        estimatedCost: number;
    };
    rootCause?: string;
    lessonsLearned?: string;
}
export interface IncidentTimelineEntry {
    timestamp: Date;
    action: string;
    actor: string;
    description: string;
    evidence?: any;
}
/**
 * Intrusion Detection and Prevention System (IDS/IPS)
 * Provides real-time threat detection, behavioral analysis, and automated response
 */
export declare class IntrusionDetectionSystem extends EventEmitter {
    private rules;
    private events;
    private behavioralProfiles;
    private threatFeeds;
    private incidents;
    private mitigationActions;
    private activeBlocks;
    constructor();
    /**
     * Analyze network traffic for threats
     */
    analyzeTraffic(sourceIp: string, destinationIp: string, sourcePort: number, destinationPort: number, protocol: string, payload?: string): Promise<{
        threats: SecurityEvent[];
        action: 'allow' | 'block' | 'alert' | 'quarantine';
        reason: string;
    }>;
    /**
     * Create custom intrusion rule
     */
    createRule(rule: Omit<IntrusionRule, 'id' | 'lastUpdated' | 'falsePositiveRate' | 'accuracy'>): IntrusionRule;
    /**
     * Get security events with filtering
     */
    getSecurityEvents(filters?: {
        severity?: string[];
        category?: string[];
        timeRange?: {
            start: Date;
            end: Date;
        };
        sourceIp?: string;
        investigationStatus?: string[];
        limit?: number;
    }): SecurityEvent[];
    /**
     * Generate security dashboard metrics
     */
    getDashboardMetrics(timeRange: {
        start: Date;
        end: Date;
    }): {
        summary: {
            totalEvents: number;
            criticalEvents: number;
            highEvents: number;
            blockedIPs: number;
            activeIncidents: number;
            falsePositiveRate: number;
        };
        trends: {
            hourly: {
                hour: number;
                events: number;
                blocked: number;
            }[];
            daily: {
                date: string;
                events: number;
                severity: {
                    [key: string]: number;
                };
            }[];
        };
        topThreats: {
            sourceIps: {
                ip: string;
                events: number;
                severity: string;
            }[];
            categories: {
                category: string;
                count: number;
                percentage: number;
            }[];
            countries: {
                country: string;
                count: number;
                threat_score: number;
            }[];
        };
        behavioralInsights: {
            profilesEstablished: number;
            anomaliesDetected: number;
            averageAnomalyScore: number;
        };
    };
    /**
     * Manual incident response actions
     */
    respondToIncident(incidentId: string, action: 'block_ip' | 'quarantine_user' | 'isolate_system' | 'escalate' | 'resolve', parameters?: Record<string, any>): Promise<void>;
    private applySignatureRules;
    private applyBehavioralAnalysis;
    private checkThreatIntelligence;
    private determineAction;
    private executeMitigation;
    private blockIP;
    private quarantineIP;
    private quarantineUser;
    private updateBehavioralProfile;
    private checkIncidentCreation;
    private calculateRiskScore;
    private severityToScore;
    private isInternalIP;
    private checkBehavioralPattern;
    private checkStatisticalPattern;
    private getGeoLocation;
    private getThreatIntelligence;
    private calculateFalsePositiveRate;
    private generateTrends;
    private analyzeTopThreats;
    private getBehavioralInsights;
    private startThreatIntelligenceUpdates;
    private startBehavioralAnalysis;
    private updateThreatFeeds;
    private generateMockThreatIndicators;
    private initializeDefaultRules;
    private initializeThreatFeeds;
    private initializeMitigationActions;
}
export default IntrusionDetectionSystem;
