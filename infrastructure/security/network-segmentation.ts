import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';
import * as ipaddr from 'ipaddr.js';

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
  portRange?: { start: number; end: number };
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
  portRange?: { start: number; end: number };
  action: 'allow' | 'deny' | 'log' | 'reject';
  logging: boolean;
  enabled: boolean;
  schedule?: ScheduleRule;
  createdAt: Date;
  updatedAt: Date;
}

export interface ScheduleRule {
  startTime: string; // HH:MM format
  endTime: string;
  days: string[]; // ['monday', 'tuesday', etc.]
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
  timeWindow: number; // minutes
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
export class NetworkSegmentationManager extends EventEmitter {
  private segments: Map<string, NetworkSegment> = new Map();
  private policies: Map<string, NetworkPolicy> = new Map();
  private trafficFlows: TrafficFlow[] = [];
  private incidents: Map<string, SecurityIncident> = new Map();
  private alertThresholds: Map<string, number> = new Map();

  constructor() {
    super();
    this.initializeDefaultSegments();
    this.initializeDefaultPolicies();
    this.startTrafficMonitoring();
  }

  /**
   * Create network segment
   */
  public createSegment(segment: Omit<NetworkSegment, 'id' | 'createdAt' | 'updatedAt'>): NetworkSegment {
    try {
      // Validate CIDR
      this.validateCIDR(segment.cidr);
      
      // Check for overlapping subnets
      this.checkSubnetOverlap(segment.cidr);

      const segmentId = randomUUID();
      const now = new Date();

      const newSegment: NetworkSegment = {
        ...segment,
        id: segmentId,
        createdAt: now,
        updatedAt: now
      };

      this.segments.set(segmentId, newSegment);

      this.emit('segmentCreated', {
        segmentId,
        name: segment.name,
        cidr: segment.cidr,
        securityZone: segment.securityZone,
        timestamp: now
      });

      return newSegment;

    } catch (error) {
      this.emit('segmentError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create firewall rule
   */
  public createFirewallRule(rule: Omit<FirewallRule, 'id' | 'createdAt' | 'updatedAt'>): FirewallRule {
    try {
      const ruleId = randomUUID();
      const now = new Date();

      const newRule: FirewallRule = {
        ...rule,
        id: ruleId,
        createdAt: now,
        updatedAt: now
      };

      this.emit('firewallRuleCreated', {
        ruleId,
        name: rule.name,
        action: rule.action,
        priority: rule.priority,
        timestamp: now
      });

      return newRule;

    } catch (error) {
      this.emit('firewallRuleError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Create network policy
   */
  public createNetworkPolicy(
    policy: Omit<NetworkPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'>
  ): NetworkPolicy {
    try {
      const policyId = randomUUID();
      const now = new Date();

      const newPolicy: NetworkPolicy = {
        ...policy,
        id: policyId,
        version: 1,
        createdAt: now,
        updatedAt: now
      };

      this.policies.set(policyId, newPolicy);

      this.emit('networkPolicyCreated', {
        policyId,
        name: policy.name,
        segments: policy.segments,
        rulesCount: policy.rules.length,
        timestamp: now
      });

      return newPolicy;

    } catch (error) {
      this.emit('networkPolicyError', {
        operation: 'create',
        error: error.message,
        timestamp: new Date()
      });
      throw error;
    }
  }

  /**
   * Evaluate traffic against network policies
   */
  public evaluateTraffic(
    sourceIp: string,
    destinationIp: string,
    port: number,
    protocol: string
  ): {
    action: 'allow' | 'deny' | 'log';
    ruleId?: string;
    policyId?: string;
    reason: string;
  } {
    try {
      const sourceSegment = this.findSegmentByIp(sourceIp);
      const destinationSegment = this.findSegmentByIp(destinationIp);

      // Find applicable policies
      const applicablePolicies = this.findApplicablePolicies(sourceSegment, destinationSegment);

      for (const policy of applicablePolicies) {
        if (!policy.active) continue;

        // Sort rules by priority
        const sortedRules = policy.rules
          .filter(rule => rule.enabled)
          .sort((a, b) => a.priority - b.priority);

        for (const rule of sortedRules) {
          if (this.matchesRule(rule, sourceIp, destinationIp, port, protocol)) {
            // Log traffic if rule requires logging
            if (rule.logging || policy.logLevel !== 'none') {
              this.logTrafficFlow(sourceIp, destinationIp, port, protocol, rule.action, rule.id);
            }

            return {
              action: rule.action === 'reject' ? 'deny' : rule.action,
              ruleId: rule.id,
              policyId: policy.id,
              reason: `Matched rule: ${rule.name}`
            };
          }
        }

        // Apply default policy action if no rules matched
        return {
          action: policy.defaultAction,
          policyId: policy.id,
          reason: `Default policy action: ${policy.defaultAction}`
        };
      }

      // No applicable policies found - default deny for security
      return {
        action: 'deny',
        reason: 'No applicable policy found - default deny'
      };

    } catch (error) {
      this.emit('trafficEvaluationError', {
        sourceIp,
        destinationIp,
        port,
        protocol,
        error: error.message,
        timestamp: new Date()
      });

      // Fail closed - deny traffic on evaluation error
      return {
        action: 'deny',
        reason: `Evaluation error: ${error.message}`
      };
    }
  }

  /**
   * Analyze traffic patterns for anomalies
   */
  public analyzeTrafficPatterns(timeWindow: number = 60): {
    anomalies: TrafficAnomaly[];
    topTalkers: { ip: string; bytes: number; connections: number }[];
    portAnalysis: { port: number; connections: number; protocols: string[] }[];
    geoAnalysis: { country: string; connections: number; bytes: number }[];
  } {
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 1000);
    const recentTraffic = this.trafficFlows.filter(flow => flow.timestamp >= cutoffTime);

    const anomalies = this.detectAnomalies(recentTraffic);
    const topTalkers = this.analyzeTopTalkers(recentTraffic);
    const portAnalysis = this.analyzePortUsage(recentTraffic);
    const geoAnalysis = this.analyzeGeoLocation(recentTraffic);

    return {
      anomalies,
      topTalkers,
      portAnalysis,
      geoAnalysis
    };
  }

  /**
   * Get network topology visualization
   */
  public getNetworkTopology(): NetworkTopology {
    const connections = this.generateNetworkConnections();

    return {
      segments: Array.from(this.segments.values()),
      connections,
      policies: Array.from(this.policies.values()),
      lastUpdated: new Date()
    };
  }

  /**
   * Generate security report
   */
  public generateSecurityReport(timeRange: { start: Date; end: Date }): {
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
  } {
    const relevantTraffic = this.trafficFlows.filter(
      flow => flow.timestamp >= timeRange.start && flow.timestamp <= timeRange.end
    );

    const summary = {
      totalTraffic: relevantTraffic.length,
      blockedConnections: relevantTraffic.filter(f => f.action === 'blocked').length,
      allowedConnections: relevantTraffic.filter(f => f.action === 'allowed').length,
      incidents: Array.from(this.incidents.values()).filter(
        i => i.detectedAt >= timeRange.start && i.detectedAt <= timeRange.end
      ).length,
      topThreats: this.getTopThreats(relevantTraffic)
    };

    const segmentAnalysis = this.analyzeSegmentSecurity(relevantTraffic);
    const recommendations = this.generateSecurityRecommendations(relevantTraffic);

    return {
      summary,
      segmentAnalysis,
      recommendations
    };
  }

  // Private helper methods

  private validateCIDR(cidr: string): void {
    try {
      ipaddr.parseCIDR(cidr);
    } catch (error) {
      throw new Error(`Invalid CIDR notation: ${cidr}`);
    }
  }

  private checkSubnetOverlap(newCidr: string): void {
    const [newAddr, newPrefix] = ipaddr.parseCIDR(newCidr);

    for (const segment of this.segments.values()) {
      const [existingAddr, existingPrefix] = ipaddr.parseCIDR(segment.cidr);
      
      // Check for overlapping subnets
      if (newAddr.match(existingAddr, existingPrefix) || existingAddr.match(newAddr, newPrefix)) {
        throw new Error(`Subnet ${newCidr} overlaps with existing segment ${segment.name} (${segment.cidr})`);
      }
    }
  }

  private findSegmentByIp(ip: string): NetworkSegment | null {
    const addr = ipaddr.process(ip);

    for (const segment of this.segments.values()) {
      const [segmentAddr, prefix] = ipaddr.parseCIDR(segment.cidr);
      if (addr.match(segmentAddr, prefix)) {
        return segment;
      }
    }

    return null;
  }

  private findApplicablePolicies(
    sourceSegment: NetworkSegment | null,
    destinationSegment: NetworkSegment | null
  ): NetworkPolicy[] {
    const policies: NetworkPolicy[] = [];

    for (const policy of this.policies.values()) {
      if (!policy.active) continue;

      const sourceMatches = !sourceSegment || policy.segments.includes(sourceSegment.id);
      const destMatches = !destinationSegment || policy.segments.includes(destinationSegment.id);

      if (sourceMatches || destMatches) {
        policies.push(policy);
      }
    }

    return policies;
  }

  private matchesRule(
    rule: FirewallRule,
    sourceIp: string,
    destinationIp: string,
    port: number,
    protocol: string
  ): boolean {
    // Check protocol
    if (rule.protocol !== 'any' && rule.protocol !== protocol) {
      return false;
    }

    // Check port
    if (rule.port && rule.port !== port) {
      return false;
    }

    if (rule.portRange) {
      if (port < rule.portRange.start || port > rule.portRange.end) {
        return false;
      }
    }

    // Check source IP
    if (rule.sourceIp && !this.ipMatches(sourceIp, rule.sourceIp)) {
      return false;
    }

    // Check destination IP  
    if (rule.destinationIp && !this.ipMatches(destinationIp, rule.destinationIp)) {
      return false;
    }

    // Check schedule if specified
    if (rule.schedule && !this.isWithinSchedule(rule.schedule)) {
      return false;
    }

    return true;
  }

  private ipMatches(ip: string, pattern: string): boolean {
    if (pattern.includes('/')) {
      // CIDR notation
      try {
        const [patternAddr, prefix] = ipaddr.parseCIDR(pattern);
        const addr = ipaddr.process(ip);
        return addr.match(patternAddr, prefix);
      } catch {
        return false;
      }
    }

    // Exact match
    return ip === pattern;
  }

  private isWithinSchedule(schedule: ScheduleRule): boolean {
    const now = new Date();
    const currentDay = now.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
    const currentTime = now.toTimeString().substring(0, 5); // HH:MM format

    if (!schedule.days.includes(currentDay)) {
      return false;
    }

    return currentTime >= schedule.startTime && currentTime <= schedule.endTime;
  }

  private logTrafficFlow(
    sourceIp: string,
    destinationIp: string,
    port: number,
    protocol: string,
    action: string,
    ruleId?: string
  ): void {
    const flow: TrafficFlow = {
      id: randomUUID(),
      timestamp: new Date(),
      sourceIp,
      destinationIp,
      sourcePort: Math.floor(Math.random() * 65535), // Random source port
      destinationPort: port,
      protocol,
      bytes: Math.floor(Math.random() * 10000),
      packets: Math.floor(Math.random() * 100),
      duration: Math.floor(Math.random() * 300),
      action: action as any,
      ruleId,
      flagged: false
    };

    this.trafficFlows.push(flow);

    // Keep only recent traffic (last 24 hours)
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
    this.trafficFlows = this.trafficFlows.filter(f => f.timestamp >= cutoff);

    this.emit('trafficLogged', {
      sourceIp,
      destinationIp,
      port,
      protocol,
      action,
      timestamp: flow.timestamp
    });
  }

  private detectAnomalies(traffic: TrafficFlow[]): TrafficAnomaly[] {
    const anomalies: TrafficAnomaly[] = [];

    // Detect port scanning
    const portScans = this.detectPortScanning(traffic);
    anomalies.push(...portScans);

    // Detect unusual traffic volumes
    const volumeAnomalies = this.detectVolume Anomalies(traffic);
    anomalies.push(...volumeAnomalies);

    // Detect geographic anomalies
    const geoAnomalies = this.detectGeographicAnomalies(traffic);
    anomalies.push(...geoAnomalies);

    return anomalies;
  }

  private detectPortScanning(traffic: TrafficFlow[]): TrafficAnomaly[] {
    const anomalies: TrafficAnomaly[] = [];
    const scanThreshold = 10; // Number of different ports to consider scanning

    const ipPortMap = new Map<string, Set<number>>();
    
    for (const flow of traffic) {
      if (!ipPortMap.has(flow.sourceIp)) {
        ipPortMap.set(flow.sourceIp, new Set());
      }
      ipPortMap.get(flow.sourceIp)!.add(flow.destinationPort);
    }

    for (const [ip, ports] of ipPortMap.entries()) {
      if (ports.size >= scanThreshold) {
        anomalies.push({
          type: 'port_scanning',
          severity: 'high',
          sourceIp: ip,
          description: `Port scanning detected: ${ports.size} different ports accessed`,
          detectedAt: new Date(),
          evidence: traffic.filter(f => f.sourceIp === ip).slice(0, 10)
        });
      }
    }

    return anomalies;
  }

  private detectVolumeAnomalies(traffic: TrafficFlow[]): TrafficAnomaly[] {
    const anomalies: TrafficAnomaly[] = [];
    const volumeThreshold = 1000000; // 1MB threshold

    const ipVolumeMap = new Map<string, number>();
    
    for (const flow of traffic) {
      const currentVolume = ipVolumeMap.get(flow.sourceIp) || 0;
      ipVolumeMap.set(flow.sourceIp, currentVolume + flow.bytes);
    }

    for (const [ip, volume] of ipVolumeMap.entries()) {
      if (volume >= volumeThreshold) {
        anomalies.push({
          type: 'high_volume',
          severity: 'medium',
          sourceIp: ip,
          description: `Unusual high volume traffic: ${(volume / 1024 / 1024).toFixed(2)}MB`,
          detectedAt: new Date(),
          evidence: traffic.filter(f => f.sourceIp === ip).slice(0, 5)
        });
      }
    }

    return anomalies;
  }

  private detectGeographicAnomalies(traffic: TrafficFlow[]): TrafficAnomaly[] {
    // Placeholder for geographic anomaly detection
    // In production, would integrate with GeoIP services
    return [];
  }

  private analyzeTopTalkers(traffic: TrafficFlow[]) {
    const ipStats = new Map<string, { bytes: number; connections: number }>();

    for (const flow of traffic) {
      const stats = ipStats.get(flow.sourceIp) || { bytes: 0, connections: 0 };
      stats.bytes += flow.bytes;
      stats.connections += 1;
      ipStats.set(flow.sourceIp, stats);
    }

    return Array.from(ipStats.entries())
      .map(([ip, stats]) => ({ ip, ...stats }))
      .sort((a, b) => b.bytes - a.bytes)
      .slice(0, 10);
  }

  private analyzePortUsage(traffic: TrafficFlow[]) {
    const portStats = new Map<number, { connections: number; protocols: Set<string> }>();

    for (const flow of traffic) {
      const stats = portStats.get(flow.destinationPort) || { connections: 0, protocols: new Set() };
      stats.connections += 1;
      stats.protocols.add(flow.protocol);
      portStats.set(flow.destinationPort, stats);
    }

    return Array.from(portStats.entries())
      .map(([port, stats]) => ({
        port,
        connections: stats.connections,
        protocols: Array.from(stats.protocols)
      }))
      .sort((a, b) => b.connections - a.connections)
      .slice(0, 20);
  }

  private analyzeGeoLocation(traffic: TrafficFlow[]) {
    // Placeholder - would integrate with actual GeoIP service
    return [];
  }

  private generateNetworkConnections(): NetworkConnection[] {
    const connections: NetworkConnection[] = [];
    const segments = Array.from(this.segments.values());

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const sourceSegment = segments[i];
        const destSegment = segments[j];

        // Determine connection type based on security zones
        let connectionType: 'allowed' | 'blocked' | 'monitored' = 'monitored';
        
        if (sourceSegment.securityZone === 'external' && destSegment.securityZone === 'internal') {
          connectionType = 'blocked';
        } else if (sourceSegment.trustLevel === 'critical' && destSegment.trustLevel === 'untrusted') {
          connectionType = 'blocked';
        } else if (sourceSegment.securityZone === destSegment.securityZone) {
          connectionType = 'allowed';
        }

        connections.push({
          id: randomUUID(),
          sourceSegment: sourceSegment.id,
          destinationSegment: destSegment.id,
          connectionType,
          bandwidth: Math.floor(Math.random() * 1000), // Mbps
          latency: Math.floor(Math.random() * 50), // ms
          reliability: 95 + Math.random() * 5, // 95-100%
          lastActive: new Date(Date.now() - Math.random() * 24 * 60 * 60 * 1000)
        });
      }
    }

    return connections;
  }

  private getTopThreats(traffic: TrafficFlow[]): string[] {
    const threatMap = new Map<string, number>();

    for (const flow of traffic) {
      if (flow.action === 'blocked' || flow.flagged) {
        const threat = flow.sourceIp;
        threatMap.set(threat, (threatMap.get(threat) || 0) + 1);
      }
    }

    return Array.from(threatMap.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([ip]) => ip);
  }

  private analyzeSegmentSecurity(traffic: TrafficFlow[]) {
    const segmentStats = new Map<string, any>();

    for (const segment of this.segments.values()) {
      segmentStats.set(segment.id, {
        segmentId: segment.id,
        name: segment.name,
        inboundTraffic: 0,
        outboundTraffic: 0,
        blockedAttempts: 0,
        riskScore: 0
      });
    }

    for (const flow of traffic) {
      const sourceSegment = this.findSegmentByIp(flow.sourceIp);
      const destSegment = this.findSegmentByIp(flow.destinationIp);

      if (sourceSegment) {
        const stats = segmentStats.get(sourceSegment.id);
        if (stats) {
          stats.outboundTraffic += flow.bytes;
          if (flow.action === 'blocked') stats.blockedAttempts++;
        }
      }

      if (destSegment) {
        const stats = segmentStats.get(destSegment.id);
        if (stats) {
          stats.inboundTraffic += flow.bytes;
          if (flow.action === 'blocked') stats.blockedAttempts++;
        }
      }
    }

    // Calculate risk scores
    for (const stats of segmentStats.values()) {
      const totalTraffic = stats.inboundTraffic + stats.outboundTraffic;
      const blockRatio = totalTraffic > 0 ? stats.blockedAttempts / totalTraffic : 0;
      stats.riskScore = Math.min(100, blockRatio * 100 + (stats.blockedAttempts / 100));
    }

    return Array.from(segmentStats.values());
  }

  private generateSecurityRecommendations(traffic: TrafficFlow[]): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    const blockedTraffic = traffic.filter(f => f.action === 'blocked');
    if (blockedTraffic.length > 100) {
      recommendations.push({
        type: 'policy_review',
        priority: 'high',
        title: 'Review Firewall Policies',
        description: `${blockedTraffic.length} blocked connections detected`,
        action: 'Review and optimize firewall rules to reduce false positives',
        impact: 'Improved security posture and reduced operational overhead',
        effort: 'medium'
      });
    }

    return recommendations;
  }

  private startTrafficMonitoring(): void {
    // Simulate traffic monitoring
    setInterval(() => {
      this.generateSimulatedTraffic();
    }, 60000); // Every minute
  }

  private generateSimulatedTraffic(): void {
    const segments = Array.from(this.segments.values());
    if (segments.length === 0) return;

    // Generate random traffic flows
    for (let i = 0; i < Math.floor(Math.random() * 50); i++) {
      const sourceSegment = segments[Math.floor(Math.random() * segments.length)];
      const destSegment = segments[Math.floor(Math.random() * segments.length)];
      
      const sourceIp = this.generateRandomIpInSegment(sourceSegment.cidr);
      const destIp = this.generateRandomIpInSegment(destSegment.cidr);
      const port = Math.floor(Math.random() * 65535);
      const protocol = ['tcp', 'udp'][Math.floor(Math.random() * 2)];

      // Evaluate traffic and log
      const evaluation = this.evaluateTraffic(sourceIp, destIp, port, protocol);
      // Traffic is already logged in evaluateTraffic method
    }
  }

  private generateRandomIpInSegment(cidr: string): string {
    // Simplified IP generation - in production would use proper CIDR logic
    const baseIp = cidr.split('/')[0].split('.');
    const randomHost = Math.floor(Math.random() * 254) + 1;
    return `${baseIp[0]}.${baseIp[1]}.${baseIp[2]}.${randomHost}`;
  }

  private initializeDefaultSegments(): void {
    const defaultSegments = [
      {
        name: 'DMZ',
        description: 'Demilitarized zone for public-facing services',
        cidr: '10.0.1.0/24',
        securityZone: 'dmz' as const,
        trustLevel: 'low' as const,
        services: ['web', 'api-gateway'],
        allowedPorts: [
          { protocol: 'tcp' as const, port: 80, direction: 'inbound' as const, action: 'allow' as const, description: 'HTTP' },
          { protocol: 'tcp' as const, port: 443, direction: 'inbound' as const, action: 'allow' as const, description: 'HTTPS' }
        ],
        active: true
      },
      {
        name: 'Application Tier',
        description: 'Internal application servers',
        cidr: '10.0.2.0/24',
        securityZone: 'internal' as const,
        trustLevel: 'medium' as const,
        services: ['portfolio-service', 'auth-service'],
        allowedPorts: [
          { protocol: 'tcp' as const, port: 8080, direction: 'inbound' as const, action: 'allow' as const, description: 'Application' }
        ],
        active: true
      },
      {
        name: 'Database Tier',
        description: 'Secure database servers',
        cidr: '10.0.3.0/24',
        securityZone: 'secure' as const,
        trustLevel: 'high' as const,
        services: ['postgresql', 'redis'],
        allowedPorts: [
          { protocol: 'tcp' as const, port: 5432, direction: 'inbound' as const, action: 'allow' as const, description: 'PostgreSQL' },
          { protocol: 'tcp' as const, port: 6379, direction: 'inbound' as const, action: 'allow' as const, description: 'Redis' }
        ],
        active: true
      }
    ];

    for (const segment of defaultSegments) {
      this.createSegment(segment);
    }
  }

  private initializeDefaultPolicies(): void {
    const segments = Array.from(this.segments.values());
    if (segments.length === 0) return;

    const defaultPolicy: Omit<NetworkPolicy, 'id' | 'version' | 'createdAt' | 'updatedAt'> = {
      name: 'Default Security Policy',
      description: 'Standard network security policy for investment platform',
      segments: segments.map(s => s.id),
      rules: [
        {
          id: randomUUID(),
          name: 'Allow HTTP/HTTPS to DMZ',
          priority: 100,
          destinationSegment: segments.find(s => s.name === 'DMZ')?.id,
          protocol: 'tcp',
          portRange: { start: 80, end: 443 },
          action: 'allow',
          logging: true,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: randomUUID(),
          name: 'Deny External to Database',
          priority: 50,
          destinationSegment: segments.find(s => s.name === 'Database Tier')?.id,
          sourceIp: '0.0.0.0/0',
          protocol: 'any',
          action: 'deny',
          logging: true,
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ],
      defaultAction: 'deny',
      logLevel: 'detailed',
      monitoring: true,
      alerts: [
        {
          type: 'blocked_connection',
          threshold: 10,
          timeWindow: 5,
          severity: 'medium',
          notification: {
            email: ['security@investment-platform.com']
          }
        }
      ],
      active: true
    };

    this.createNetworkPolicy(defaultPolicy);
  }
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