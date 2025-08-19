import { EventEmitter } from 'events';
export interface NetworkSegment {
    id: string;
    name: string;
    description: string;
    cidr: string;
    vlanId?: number;
    securityZone: 'dmz' | 'internal' | 'secure' | 'management' | 'external';
    trustLevel: 'untrusted' | 'low' | 'medium' | 'high' | 'critical';
    services: string[];
    allowedPorts: PortRule[];
    createdAt: Date;
    updatedAt: Date;
    active: boolean;
}
export interface PortRule {
    protocol: 'tcp' | 'udp' | 'icmp' | 'any';
    port?: number;
    portRange?: {
        start: number;
        end: number;
    };
    direction: 'inbound' | 'outbound' | 'both';
    action: 'allow' | 'deny' | 'log';
    description: string;
}
export interface FirewallRule {
    id: string;
    name: string;
    priority: number;
    sourceSegment?: string;
    destinationSegment?: string;
    sourceIp?: string;
    destinationIp?: string;
    protocol: 'tcp' | 'udp' | 'icmp' | 'any';
    port?: number;
    portRange?: {
        start: number;
        end: number;
    };
    action: 'allow' | 'deny' | 'log' | 'reject';
    logging: boolean;
    enabled: boolean;
    schedule?: ScheduleRule;
    createdAt: Date;
    updatedAt: Date;
}
export interface ScheduleRule {
    startTime: string;
    endTime: string;
    days: string[];
    timezone: string;
}
export interface NetworkPolicy {
    id: string;
    name: string;
    description: string;
    segments: string[];
    rules: FirewallRule[];
    defaultAction: 'allow' | 'deny';
    logLevel: 'none' | 'basic' | 'detailed' | 'full';
    monitoring: boolean;
    alerts: AlertConfiguration[];
    version: number;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}
export interface AlertConfiguration {
    type: 'blocked_connection' | 'unusual_traffic' | 'policy_violation' | 'intrusion_attempt';
    threshold: number;
    timeWindow: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    notification: {
        email?: string[];
        webhook?: string;
        sms?: string[];
    };
}
export interface TrafficFlow {
    id: string;
    timestamp: Date;
    sourceIp: string;
    destinationIp: string;
    sourcePort: number;
    destinationPort: number;
    protocol: string;
    bytes: number;
    packets: number;
    duration: number;
    action: 'allowed' | 'blocked' | 'logged';
    ruleId?: string;
    segmentId?: string;
    flagged: boolean;
    geoLocation?: {
        sourceCountry?: string;
        destinationCountry?: string;
    };
}
export interface NetworkTopology {
    segments: NetworkSegment[];
    connections: NetworkConnection[];
    policies: NetworkPolicy[];
    lastUpdated: Date;
}
export interface NetworkConnection {
    id: string;
    sourceSegment: string;
    destinationSegment: string;
    connectionType: 'allowed' | 'blocked' | 'monitored';
    bandwidth: number;
    latency: number;
    reliability: number;
    lastActive: Date;
}
export interface SecurityIncident {
    id: string;
    type: 'intrusion_attempt' | 'policy_violation' | 'anomalous_traffic' | 'unauthorized_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    sourceIp: string;
    destinationIp: string;
    port: number;
    protocol: string;
    description: string;
    detectedAt: Date;
    resolvedAt?: Date;
    status: 'open' | 'investigating' | 'resolved' | 'false_positive';
    assignedTo?: string;
    mitigation?: string;
    evidence: TrafficFlow[];
}
/**
 * Network Segmentation and Security Manager
 * Provides micro-segmentation, policy enforcement, and traffic analysis
 */
export declare class NetworkSegmentationManager extends EventEmitter {
    private segments;
    private policies;
    private trafficFlows;
    private incidents;
    private alertThresholds;
    constructor();
    /**
     * Create network segment
     */
    createSegment(segment: Omit<NetworkSegment, 'id' | 'createdAt' | 'updatedAt'>): NetworkSegment;
    /**
     * Create firewall rule
     */
    createFirewallRule(rule: Omit<FirewallRule, 'id' | 'createdAt' | 'updatedAt'>): FirewallRule;
    /**
     * Create network policy
     */
    createNetworkPolicy(policy: Omit<NetworkPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>): NetworkPolicy;
    /**
     * Evaluate traffic against network policies
     */
    evaluateTraffic(sourceIp: string, destinationIp: string, port: number, protocol: string): {
        action: 'allow' | 'deny' | 'log';
        ruleId?: string;
        policyId?: string;
        reason: string;
    };
    /**
     * Analyze traffic patterns for anomalies
     */
    analyzeTrafficPatterns(timeWindow?: number): {
        anomalies: TrafficAnomaly[];
        topTalkers: {
            ip: string;
            bytes: number;
            connections: number;
        }[];
        portAnalysis: {
            port: number;
            connections: number;
            protocols: string[];
        }[];
        geoAnalysis: {
            country: string;
            connections: number;
            bytes: number;
        }[];
    };
    /**
     * Get network topology visualization
     */
    getNetworkTopology(): NetworkTopology;
    /**
     * Generate security report
     */
    generateSecurityReport(timeRange: {
        start: Date;
        end: Date;
    }): {
        summary: {
            totalTraffic: number;
            blockedConnections: number;
            allowedConnections: number;
            incidents: number;
            topThreats: string[];
        };
        segmentAnalysis: {
            segmentId: string;
            name: string;
            inboundTraffic: number;
            outboundTraffic: number;
            blockedAttempts: number;
            riskScore: number;
        }[];
        recommendations: SecurityRecommendation[];
    };
    private validateCIDR;
    private checkSubnetOverlap;
    private findSegmentByIp;
    private findApplicablePolicies;
    private matchesRule;
    private ipMatches;
    private isWithinSchedule;
    private logTrafficFlow;
    private detectAnomalies;
    private detectPortScanning;
    private detectVolumeAnomalies;
    private detectGeographicAnomalies;
    private analyzeTopTalkers;
    private analyzePortUsage;
    private analyzeGeoLocation;
    private generateNetworkConnections;
    private getTopThreats;
    private analyzeSegmentSecurity;
    private generateSecurityRecommendations;
    private startTrafficMonitoring;
    private generateSimulatedTraffic;
    private generateRandomIpInSegment;
    private initializeDefaultSegments;
    private initializeDefaultPolicies;
}
interface TrafficAnomaly {
    type: string;
    severity: string;
    sourceIp: string;
    description: string;
    detectedAt: Date;
    evidence: TrafficFlow[];
}
interface SecurityRecommendation {
    type: string;
    priority: string;
    title: string;
    description: string;
    action: string;
    impact: string;
    effort: string;
}
export default NetworkSegmentationManager;
