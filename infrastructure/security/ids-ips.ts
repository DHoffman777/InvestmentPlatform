import { EventEmitter } from 'events';
import { randomUUID } from 'crypto';

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
  timeWindow: number; // seconds
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
  confidence: number; // 0-100
  riskScore: number; // 0-100
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
  entityId: string; // IP address, user ID, etc.
  entityType: 'ip' | 'user' | 'service' | 'device';
  baseline: {
    trafficVolume: number;
    connectionCount: number;
    portUsage: number[];
    timePatterns: { [hour: string]: number };
    protocols: { [protocol: string]: number };
    destinationCountries: { [country: string]: number };
  };
  currentMetrics: {
    trafficVolume: number;
    connectionCount: number;
    portUsage: number[];
    protocols: { [protocol: string]: number };
    anomalyScore: number;
    lastUpdated: Date;
  };
  anomalies: BehavioralAnomaly[];
  learningPeriod: number; // days
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
  updateFrequency: number; // minutes
  lastUpdated: Date;
  enabled: boolean;
  reliability: number; // 0-100
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
  duration: number; // minutes, 0 = permanent
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
export class IntrusionDetectionSystem extends EventEmitter {
  private rules: Map<string, IntrusionRule> = new Map();
  private events: SecurityEvent[] = [];
  private behavioralProfiles: Map<string, BehavioralProfile> = new Map();
  private threatFeeds: Map<string, ThreatFeed> = new Map();
  private incidents: Map<string, SecurityIncident> = new Map();
  private mitigationActions: Map<string, MitigationAction> = new Map();
  private activeBlocks: Map<string, { until: Date; reason: string }> = new Map();

  constructor() {
    super();
    this.initializeDefaultRules();
    this.initializeThreatFeeds();
    this.initializeMitigationActions();
    this.startThreatIntelligenceUpdates();
    this.startBehavioralAnalysis();
  }

  /**
   * Analyze network traffic for threats
   */
  public async analyzeTraffic(
    sourceIp: string,
    destinationIp: string,
    sourcePort: number,
    destinationPort: number,
    protocol: string,
    payload?: string
  ): Promise<{
    threats: SecurityEvent[];
    action: 'allow' | 'block' | 'alert' | 'quarantine';
    reason: string;
  }> {
    try {
      const threats: SecurityEvent[] = [];

      // Check if source IP is currently blocked
      const blockInfo = this.activeBlocks.get(sourceIp);
      if (blockInfo && blockInfo.until > new Date()) {
        return {
          threats: [],
          action: 'block',
          reason: `IP ${sourceIp} is blocked: ${blockInfo.reason}`
        };
      }

      // Apply signature-based detection
      const signatureThreats = await this.applySignatureRules(
        sourceIp, destinationIp, sourcePort, destinationPort, protocol, payload
      );
      threats.push(...signatureThreats);

      // Apply behavioral analysis
      const behavioralThreats = await this.applyBehavioralAnalysis(
        sourceIp, destinationIp, sourcePort, destinationPort, protocol
      );
      threats.push(...behavioralThreats);

      // Check threat intelligence
      const threatIntelThreats = await this.checkThreatIntelligence(sourceIp, destinationIp);
      threats.push(...threatIntelThreats);

      // Determine overall action
      const action = this.determineAction(threats);

      // Execute mitigation if needed
      if (action !== 'allow') {
        await this.executeMitigation(threats, action, sourceIp);
      }

      // Update behavioral profiles
      this.updateBehavioralProfile(sourceIp, destinationIp, sourcePort, destinationPort, protocol);

      // Create incident if critical threats detected
      await this.checkIncidentCreation(threats);

      return {
        threats,
        action,
        reason: threats.length > 0 ? `${threats.length} threats detected` : 'Traffic allowed'
      };

    } catch (error: any) {
      this.emit('analysisError', {
        sourceIp,
        destinationIp,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date()
      });

      return {
        threats: [],
        action: 'allow',
        reason: `Analysis error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Create custom intrusion rule
   */
  public createRule(rule: Omit<IntrusionRule, 'id' | 'lastUpdated' | 'falsePositiveRate' | 'accuracy'>): IntrusionRule {
    const ruleId = randomUUID();
    const newRule: IntrusionRule = {
      ...rule,
      id: ruleId,
      lastUpdated: new Date(),
      falsePositiveRate: 0,
      accuracy: 100
    };

    this.rules.set(ruleId, newRule);

    this.emit('ruleCreated', {
      ruleId,
      name: rule.name,
      category: rule.category,
      severity: rule.severity,
      timestamp: new Date()
    });

    return newRule;
  }

  /**
   * Get security events with filtering
   */
  public getSecurityEvents(filters?: {
    severity?: string[];
    category?: string[];
    timeRange?: { start: Date; end: Date };
    sourceIp?: string;
    investigationStatus?: string[];
    limit?: number;
  }): SecurityEvent[] {
    let filteredEvents = [...this.events];

    if (filters) {
      if (filters.severity && filters.severity.length > 0) {
        filteredEvents = filteredEvents.filter(e => filters.severity!.includes(e.severity));
      }

      if (filters.category && filters.category.length > 0) {
        filteredEvents = filteredEvents.filter(e => filters.category!.includes(e.category));
      }

      if (filters.timeRange) {
        filteredEvents = filteredEvents.filter(e => 
          e.timestamp >= filters.timeRange!.start && e.timestamp <= filters.timeRange!.end
        );
      }

      if (filters.sourceIp) {
        filteredEvents = filteredEvents.filter(e => e.sourceIp === filters.sourceIp);
      }

      if (filters.investigationStatus && filters.investigationStatus.length > 0) {
        filteredEvents = filteredEvents.filter(e => filters.investigationStatus!.includes(e.investigationStatus));
      }

      if (filters.limit) {
        filteredEvents = filteredEvents.slice(0, filters.limit);
      }
    }

    return filteredEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Generate security dashboard metrics
   */
  public getDashboardMetrics(timeRange: { start: Date; end: Date }): {
    summary: {
      totalEvents: number;
      criticalEvents: number;
      highEvents: number;
      blockedIPs: number;
      activeIncidents: number;
      falsePositiveRate: number;
    };
    trends: {
      hourly: { hour: number; events: number; blocked: number }[];
      daily: { date: string; events: number; severity: { [key: string]: number } }[];
    };
    topThreats: {
      sourceIps: { ip: string; events: number; severity: string }[];
      categories: { category: string; count: number; percentage: number }[];
      countries: { country: string; count: number; threat_score: number }[];
    };
    behavioralInsights: {
      profilesEstablished: number;
      anomaliesDetected: number;
      averageAnomalyScore: number;
    };
  } {
    const relevantEvents = this.events.filter(
      e => e.timestamp >= timeRange.start && e.timestamp <= timeRange.end
    );

    const summary = {
      totalEvents: relevantEvents.length,
      criticalEvents: relevantEvents.filter(e => e.severity === 'critical').length,
      highEvents: relevantEvents.filter(e => e.severity === 'high').length,
      blockedIPs: this.activeBlocks.size,
      activeIncidents: Array.from(this.incidents.values()).filter(i => i.status !== 'resolved').length,
      falsePositiveRate: this.calculateFalsePositiveRate(relevantEvents)
    };

    const trends = this.generateTrends(relevantEvents, timeRange);
    const topThreats = this.analyzeTopThreats(relevantEvents);
    const behavioralInsights = this.getBehavioralInsights();

    return {
      summary,
      trends,
      topThreats,
      behavioralInsights
    };
  }

  /**
   * Manual incident response actions
   */
  public async respondToIncident(
    incidentId: string,
    action: 'block_ip' | 'quarantine_user' | 'isolate_system' | 'escalate' | 'resolve',
    parameters: Record<string, any> = {}
  ): Promise<any> {
    const incident = this.incidents.get(incidentId);
    if (!incident) {
      throw new Error('Incident not found');
    }

    const timelineEntry: IncidentTimelineEntry = {
      timestamp: new Date(),
      action,
      actor: parameters.actor || 'system',
      description: parameters.description || `Manual ${action} action executed`,
      evidence: parameters.evidence
    };

    incident.timeline.push(timelineEntry);
    incident.updatedAt = new Date();

    switch (action) {
      case 'block_ip':
        await this.blockIP(parameters.ip, parameters.duration || 60, parameters.reason || 'Manual block');
        break;
      
      case 'quarantine_user':
        await this.quarantineUser(parameters.userId, parameters.reason || 'Security incident');
        break;
      
      case 'resolve':
        incident.status = 'resolved';
        incident.resolvedAt = new Date();
        if (parameters.rootCause) incident.rootCause = parameters.rootCause;
        if (parameters.lessonsLearned) incident.lessonsLearned = parameters.lessonsLearned;
        break;
    }

    this.emit('incidentResponse', {
      incidentId,
      action,
      parameters,
      timestamp: new Date()
    });
  }

  // Private helper methods

  private async applySignatureRules(
    sourceIp: string,
    destinationIp: string,
    sourcePort: number,
    destinationPort: number,
    protocol: string,
    payload?: string
  ): Promise<SecurityEvent[]> {
    const threats: SecurityEvent[] = [];

    for (const rule of this.rules.values()) {
      if (!rule.enabled) continue;

      if (rule.protocol !== 'any' && rule.protocol !== protocol) continue;

      if (rule.direction === 'inbound' && !this.isInternalIP(destinationIp)) continue;
      if (rule.direction === 'outbound' && !this.isInternalIP(sourceIp)) continue;

      let matches = false;

      switch (rule.patternType) {
        case 'regex':
          if (payload && new RegExp(rule.pattern).test(payload)) {
            matches = true;
          }
          break;
        
        case 'signature':
          if (payload && payload.includes(rule.pattern)) {
            matches = true;
          }
          break;
        
        case 'behavioral':
          matches = await this.checkBehavioralPattern(rule, sourceIp);
          break;
        
        case 'statistical':
          matches = await this.checkStatisticalPattern(rule, sourceIp);
          break;
      }

      if (matches) {
        const event: SecurityEvent = {
          id: randomUUID(),
          timestamp: new Date(),
          ruleId: rule.id,
          ruleName: rule.name,
          category: rule.category,
          severity: rule.severity,
          sourceIp,
          destinationIp,
          sourcePort,
          destinationPort,
          protocol,
          payload: payload?.substring(0, 1000), // Truncate large payloads
          action: 'alerted',
          confidence: rule.accuracy,
          riskScore: this.calculateRiskScore(rule, sourceIp),
          investigationStatus: 'new'
        };

        // Add geolocation data
        event.geoLocation = await this.getGeoLocation(sourceIp);
        
        // Add threat intelligence data
        event.threatIntelligence = await this.getThreatIntelligence(sourceIp);

        threats.push(event);
        this.events.push(event);

        this.emit('threatDetected', {
          eventId: event.id,
          ruleName: rule.name,
          severity: rule.severity,
          sourceIp,
          destinationIp,
          timestamp: new Date()
        });
      }
    }

    // Keep only recent events (last 30 days)
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    this.events = this.events.filter(e => e.timestamp >= cutoff);

    return threats;
  }

  private async applyBehavioralAnalysis(
    sourceIp: string,
    destinationIp: string,
    sourcePort: number,
    destinationPort: number,
    protocol: string
  ): Promise<SecurityEvent[]> {
    const threats: SecurityEvent[] = [];
    const profile = this.behavioralProfiles.get(sourceIp);

    if (!profile || !profile.established) {
      return threats;
    }

    // Check for volume anomalies
    if (profile.currentMetrics.trafficVolume > profile.baseline.trafficVolume * 5) {
      const anomaly: BehavioralAnomaly = {
        id: randomUUID(),
        type: 'volume_spike',
        description: `Traffic volume 5x higher than baseline`,
        severity: 'high',
        detectedAt: new Date(),
        score: 85,
        threshold: profile.baseline.trafficVolume * 5,
        evidence: { current: profile.currentMetrics.trafficVolume, baseline: profile.baseline.trafficVolume }
      };

      profile.anomalies.push(anomaly);

      const event: SecurityEvent = {
        id: randomUUID(),
        timestamp: new Date(),
        ruleId: 'behavioral_volume',
        ruleName: 'Behavioral Volume Anomaly',
        category: 'reconnaissance',
        severity: 'high',
        sourceIp,
        destinationIp,
        sourcePort,
        destinationPort,
        protocol,
        action: 'alerted',
        confidence: 80,
        riskScore: 85,
        investigationStatus: 'new'
      };

      threats.push(event);
      this.events.push(event);
    }

    // Check for unusual port usage
    const unusualPorts = profile.currentMetrics.portUsage.filter(
      port => !profile.baseline.portUsage.includes(port)
    );

    if (unusualPorts.length > 10) {
      const anomaly: BehavioralAnomaly = {
        id: randomUUID(),
        type: 'unusual_ports',
        description: `Accessing ${unusualPorts.length} unusual ports`,
        severity: 'medium',
        detectedAt: new Date(),
        score: 70,
        threshold: 10,
        evidence: { unusualPorts: unusualPorts.slice(0, 20) }
      };

      profile.anomalies.push(anomaly);

      const event: SecurityEvent = {
        id: randomUUID(),
        timestamp: new Date(),
        ruleId: 'behavioral_ports',
        ruleName: 'Behavioral Port Scanning',
        category: 'reconnaissance',
        severity: 'medium',
        sourceIp,
        destinationIp,
        sourcePort,
        destinationPort,
        protocol,
        action: 'alerted',
        confidence: 75,
        riskScore: 70,
        investigationStatus: 'new'
      };

      threats.push(event);
      this.events.push(event);
    }

    return threats;
  }

  private async checkThreatIntelligence(sourceIp: string, destinationIp: string): Promise<SecurityEvent[]> {
    const threats: SecurityEvent[] = [];

    for (const feed of this.threatFeeds.values()) {
      if (!feed.enabled) continue;

      const sourceMatch = feed.entries.find(entry => 
        entry.type === 'ip' && entry.indicator === sourceIp
      );

      if (sourceMatch) {
        const event: SecurityEvent = {
          id: randomUUID(),
          timestamp: new Date(),
          ruleId: `threatintel_${feed.id}`,
          ruleName: `Threat Intelligence: ${feed.name}`,
          category: sourceMatch.category[0] || 'malware',
          severity: sourceMatch.severity,
          sourceIp,
          destinationIp,
          sourcePort: 0,
          destinationPort: 0,
          protocol: 'any',
          action: 'alerted',
          confidence: sourceMatch.confidence,
          riskScore: this.severityToScore(sourceMatch.severity),
          threatIntelligence: {
            isMalicious: true,
            reputation: 'malicious',
            categories: sourceMatch.category,
            sources: sourceMatch.sources
          },
          investigationStatus: 'new'
        };

        threats.push(event);
        this.events.push(event);
      }
    }

    return threats;
  }

  private determineAction(threats: SecurityEvent[]): 'allow' | 'block' | 'alert' | 'quarantine' {
    if (threats.length === 0) return 'allow';

    const criticalThreats = threats.filter(t => t.severity === 'critical');
    const highThreats = threats.filter(t => t.severity === 'high');

    if (criticalThreats.length > 0) return 'block';
    if (highThreats.length >= 3) return 'block';
    if (threats.some(t => t.threatIntelligence?.isMalicious)) return 'block';

    return 'alert';
  }

  private async executeMitigation(threats: SecurityEvent[], action: string, sourceIp: string): Promise<any> {
    for (const threat of threats) {
      const rule = this.rules.get(threat.ruleId);
      if (rule && rule.action !== 'alert') {
        action = rule.action;
      }
    }

    switch (action) {
      case 'block':
        await this.blockIP(sourceIp, 60, 'Automated threat detection');
        break;
      
      case 'quarantine':
        await this.quarantineIP(sourceIp, 30, 'Automated threat quarantine');
        break;
    }

    // Update event actions
    for (const threat of threats) {
      threat.action = action as any;
    }
  }

  private async blockIP(ip: string, duration: number, reason: string): Promise<any> {
    const until = new Date(Date.now() + duration * 60 * 1000);
    this.activeBlocks.set(ip, { until, reason });

    this.emit('ipBlocked', {
      ip,
      duration,
      reason,
      until,
      timestamp: new Date()
    });

    // Remove block after duration
    setTimeout(() => {
      this.activeBlocks.delete(ip);
      this.emit('ipUnblocked', { ip, timestamp: new Date() });
    }, duration * 60 * 1000);
  }

  private async quarantineIP(ip: string, duration: number, reason: string): Promise<any> {
    // Quarantine implementation would integrate with network infrastructure
    this.emit('ipQuarantined', {
      ip,
      duration,
      reason,
      timestamp: new Date()
    });
  }

  private async quarantineUser(userId: string, reason: string): Promise<any> {
    // User quarantine implementation
    this.emit('userQuarantined', {
      userId,
      reason,
      timestamp: new Date()
    });
  }

  private updateBehavioralProfile(
    sourceIp: string,
    destinationIp: string,
    sourcePort: number,
    destinationPort: number,
    protocol: string
  ): void {
    let profile = this.behavioralProfiles.get(sourceIp);

    if (!profile) {
      profile = {
        entityId: sourceIp,
        entityType: 'ip',
        baseline: {
          trafficVolume: 0,
          connectionCount: 0,
          portUsage: [],
          timePatterns: {},
          protocols: {},
          destinationCountries: {}
        },
        currentMetrics: {
          trafficVolume: 0,
          connectionCount: 0,
          portUsage: [],
          protocols: {},
          anomalyScore: 0,
          lastUpdated: new Date()
        },
        anomalies: [],
        learningPeriod: 14,
        established: false
      };
      this.behavioralProfiles.set(sourceIp, profile);
    }

    // Update current metrics
    profile.currentMetrics.connectionCount++;
    profile.currentMetrics.trafficVolume += Math.random() * 1000; // Simulated traffic
    
    if (!profile.currentMetrics.portUsage.includes(destinationPort)) {
      profile.currentMetrics.portUsage.push(destinationPort);
    }

    profile.currentMetrics.protocols[protocol] = (profile.currentMetrics.protocols[protocol] || 0) + 1;
    profile.currentMetrics.lastUpdated = new Date();

    // Establish baseline after learning period
    if (!profile.established) {
      const profileAge = Date.now() - (profile.currentMetrics.lastUpdated.getTime() - 24 * 60 * 60 * 1000);
      if (profileAge > profile.learningPeriod * 24 * 60 * 60 * 1000) {
        profile.baseline = { ...profile.currentMetrics } as any;
        profile.established = true;
      }
    }
  }

  private async checkIncidentCreation(threats: SecurityEvent[]): Promise<any> {
    const criticalThreats = threats.filter(t => t.severity === 'critical');
    if (criticalThreats.length === 0) return;

    const incidentId = randomUUID();
    const incident: SecurityIncident = {
      id: incidentId,
      title: `Critical Security Incident - ${criticalThreats[0].category}`,
      description: `${criticalThreats.length} critical threats detected`,
      severity: 'critical',
      category: criticalThreats[0].category,
      status: 'open',
      createdAt: new Date(),
      updatedAt: new Date(),
      events: criticalThreats,
      timeline: [{
        timestamp: new Date(),
        action: 'created',
        actor: 'system',
        description: 'Incident automatically created due to critical threats'
      }],
      mitigation: [],
      impact: {
        affectedSystems: [],
        affectedUsers: 0,
        businessImpact: 'high',
        estimatedCost: 0
      }
    };

    this.incidents.set(incidentId, incident);

    this.emit('incidentCreated', {
      incidentId,
      title: incident.title,
      severity: incident.severity,
      threatsCount: criticalThreats.length,
      timestamp: new Date()
    });
  }

  private calculateRiskScore(rule: IntrusionRule, sourceIp: string): number {
    let score = this.severityToScore(rule.severity);
    
    // Adjust based on threat intelligence
    const profile = this.behavioralProfiles.get(sourceIp);
    if (profile) {
      score += profile.currentMetrics.anomalyScore * 0.2;
    }

    return Math.min(100, score);
  }

  private severityToScore(severity: string): number {
    const scores: Record<string, number> = { low: 25, medium: 50, high: 75, critical: 100 };
    return scores[severity] || 50;
  }

  private isInternalIP(ip: string): boolean {
    // Simplified internal IP check
    return ip.startsWith('10.') || ip.startsWith('192.168.') || ip.startsWith('172.');
  }

  private async checkBehavioralPattern(rule: IntrusionRule, sourceIp: string): Promise<boolean> {
    const profile = this.behavioralProfiles.get(sourceIp);
    if (!profile || !profile.established) return false;

    return profile.currentMetrics.anomalyScore > rule.threshold;
  }

  private async checkStatisticalPattern(rule: IntrusionRule, sourceIp: string): Promise<boolean> {
    // Statistical pattern matching implementation
    return Math.random() < 0.1; // 10% chance for simulation
  }

  private async getGeoLocation(ip: string): Promise<any> {
    // Mock geolocation - in production would use actual GeoIP service
    const countries = ['US', 'CN', 'RU', 'DE', 'GB', 'FR', 'BR', 'IN'];
    return {
      country: countries[Math.floor(Math.random() * countries.length)],
      region: 'Unknown',
      city: 'Unknown',
      latitude: Math.random() * 180 - 90,
      longitude: Math.random() * 360 - 180
    };
  }

  private async getThreatIntelligence(ip: string): Promise<any> {
    // Check against threat feeds
    for (const feed of this.threatFeeds.values()) {
      const indicator = feed.entries.find(e => e.indicator === ip);
      if (indicator) {
        return {
          isMalicious: true,
          reputation: 'malicious',
          categories: indicator.category,
          sources: indicator.sources
        };
      }
    }

    return {
      isMalicious: false,
      reputation: 'unknown',
      categories: [],
      sources: []
    };
  }

  private calculateFalsePositiveRate(events: SecurityEvent[]): number {
    if (events.length === 0) return 0;
    const falsePositives = events.filter(e => e.investigationStatus === 'false_positive').length;
    return (falsePositives / events.length) * 100;
  }

  private generateTrends(events: SecurityEvent[], timeRange: { start: Date; end: Date }) {
    // Generate hourly trends
    const hourly = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      events: events.filter(e => e.timestamp.getHours() === hour).length,
      blocked: events.filter(e => e.timestamp.getHours() === hour && e.action === 'blocked').length
    }));

    // Generate daily trends
    const daily = [];
    const msPerDay = 24 * 60 * 60 * 1000;
    
    for (let d = new Date(timeRange.start); d <= timeRange.end; d.setTime(d.getTime() + msPerDay)) {
      const dayEvents = events.filter(e => e.timestamp.toDateString() === d.toDateString());
      const severity = {
        low: dayEvents.filter(e => e.severity === 'low').length,
        medium: dayEvents.filter(e => e.severity === 'medium').length,
        high: dayEvents.filter(e => e.severity === 'high').length,
        critical: dayEvents.filter(e => e.severity === 'critical').length
      };

      daily.push({
        date: d.toISOString().split('T')[0],
        events: dayEvents.length,
        severity
      });
    }

    return { hourly, daily };
  }

  private analyzeTopThreats(events: SecurityEvent[]) {
    // Top source IPs
    const ipCounts = new Map<string, { events: number; maxSeverity: string }>();
    for (const event of events) {
      const current = ipCounts.get(event.sourceIp) || { events: 0, maxSeverity: 'low' };
      current.events++;
      if (this.severityToScore(event.severity) > this.severityToScore(current.maxSeverity)) {
        current.maxSeverity = event.severity;
      }
      ipCounts.set(event.sourceIp, current);
    }

    const sourceIps = Array.from(ipCounts.entries())
      .map(([ip, data]) => ({ ip, events: data.events, severity: data.maxSeverity }))
      .sort((a, b) => b.events - a.events)
      .slice(0, 10);

    // Top categories
    const categoryCounts = new Map<string, number>();
    for (const event of events) {
      categoryCounts.set(event.category, (categoryCounts.get(event.category) || 0) + 1);
    }

    const categories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({
        category,
        count,
        percentage: (count / events.length) * 100
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Mock countries data
    const countries = [
      { country: 'China', count: Math.floor(Math.random() * 100), threat_score: 85 },
      { country: 'Russia', count: Math.floor(Math.random() * 50), threat_score: 90 },
      { country: 'Unknown', count: Math.floor(Math.random() * 200), threat_score: 60 }
    ];

    return { sourceIps, categories, countries };
  }

  private getBehavioralInsights() {
    const profiles = Array.from(this.behavioralProfiles.values());
    const established = profiles.filter(p => p.established).length;
    const totalAnomalies = profiles.reduce((sum, p) => sum + p.anomalies.length, 0);
    const avgScore = profiles.length > 0 
      ? profiles.reduce((sum, p) => sum + p.currentMetrics.anomalyScore, 0) / profiles.length 
      : 0;

    return {
      profilesEstablished: established,
      anomaliesDetected: totalAnomalies,
      averageAnomalyScore: avgScore
    };
  }

  private startThreatIntelligenceUpdates(): void {
    // Update threat intelligence feeds every hour
    setInterval(() => {
      this.updateThreatFeeds();
    }, 60 * 60 * 1000);
  }

  private startBehavioralAnalysis(): void {
    // Clean up old behavioral data every 6 hours
    setInterval(() => {
      const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days
      for (const [ip, profile] of this.behavioralProfiles.entries()) {
        if (profile.currentMetrics.lastUpdated < cutoff) {
          this.behavioralProfiles.delete(ip);
        }
      }
    }, 6 * 60 * 60 * 1000);
  }

  private async updateThreatFeeds(): Promise<any> {
    for (const feed of this.threatFeeds.values()) {
      if (!feed.enabled) continue;

      try {
        // In production, would fetch from actual threat intelligence sources
        const newIndicators = this.generateMockThreatIndicators();
        feed.entries.push(...newIndicators);
        feed.lastUpdated = new Date();

        this.emit('threatFeedUpdated', {
          feedId: feed.id,
          name: feed.name,
          newIndicators: newIndicators.length,
          timestamp: new Date()
        });
      } catch (error: any) {
        this.emit('threatFeedError', {
          feedId: feed.id,
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date()
        });
      }
    }
  }

  private generateMockThreatIndicators(): ThreatIndicator[] {
    const indicators: ThreatIndicator[] = [];
    const count = Math.floor(Math.random() * 10);

    for (let i = 0; i < count; i++) {
      indicators.push({
        indicator: `${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`,
        type: 'ip',
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        confidence: Math.floor(Math.random() * 40) + 60,
        category: ['malware', 'botnet', 'scanner', 'spam'],
        firstSeen: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
        lastSeen: new Date(),
        sources: ['threat-feed-1'],
        context: 'Automated threat intelligence'
      });
    }

    return indicators;
  }

  private initializeDefaultRules(): void {
    const defaultRules = [
      {
        name: 'SQL Injection Attempt',
        description: 'Detects potential SQL injection attacks',
        category: 'exploitation' as const,
        severity: 'high' as const,
        pattern: '.*(union|select|insert|delete|drop|exec).*',
        patternType: 'regex' as const,
        protocol: 'http' as const,
        direction: 'inbound' as const,
        action: 'block' as const,
        threshold: 1,
        timeWindow: 60,
        enabled: true
      },
      {
        name: 'Port Scan Detection',
        description: 'Detects port scanning activity',
        category: 'reconnaissance' as const,
        severity: 'medium' as const,
        pattern: 'port_scan',
        patternType: 'behavioral' as const,
        protocol: 'tcp' as const,
        direction: 'inbound' as const,
        action: 'alert' as const,
        threshold: 50,
        timeWindow: 300,
        enabled: true
      },
      {
        name: 'Brute Force Login',
        description: 'Detects brute force login attempts',
        category: 'exploitation' as const,
        severity: 'high' as const,
        pattern: 'failed_login',
        patternType: 'statistical' as const,
        protocol: 'https' as const,
        direction: 'inbound' as const,
        action: 'block' as const,
        threshold: 10,
        timeWindow: 600,
        enabled: true
      }
    ];

    for (const rule of defaultRules) {
      this.createRule(rule);
    }
  }

  private initializeThreatFeeds(): void {
    const defaultFeeds = [
      {
        name: 'Malware IP Feed',
        source: 'internal',
        type: 'ip_reputation' as const,
        updateFrequency: 60,
        enabled: true,
        reliability: 90,
        entries: []
      },
      {
        name: 'Botnet Command & Control',
        source: 'threat-intelligence-provider',
        type: 'ip_reputation' as const,
        updateFrequency: 30,
        enabled: true,
        reliability: 95,
        entries: []
      }
    ];

    for (const feed of defaultFeeds) {
      const feedId = randomUUID();
      this.threatFeeds.set(feedId, {
        ...feed,
        id: feedId,
        lastUpdated: new Date()
      });
    }
  }

  private initializeMitigationActions(): void {
    const defaultActions = [
      {
        name: 'Block IP Address',
        type: 'ip_block' as const,
        description: 'Temporarily block suspicious IP address',
        automated: true,
        parameters: { duration: 60 },
        duration: 60,
        conditions: ['severity >= high'],
        enabled: true
      },
      {
        name: 'Rate Limit Source',
        type: 'rate_limit' as const,
        description: 'Apply rate limiting to suspicious source',
        automated: true,
        parameters: { requests_per_minute: 10 },
        duration: 30,
        conditions: ['category = reconnaissance'],
        enabled: true
      }
    ];

    for (const action of defaultActions) {
      const actionId = randomUUID();
      this.mitigationActions.set(actionId, {
        ...action,
        id: actionId
      });
    }
  }
}

export default IntrusionDetectionSystem;

