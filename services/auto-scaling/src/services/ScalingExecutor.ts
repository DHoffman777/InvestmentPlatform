import { EventEmitter } from 'events';
import * as k8s from '@kubernetes/client-node';
import Docker from 'dockerode';
import axios from 'axios';
import {
  AutoScalingDecision,
  ScalingResult,
  ScalingEvent,
  CloudProviderAdapter,
  ServiceMetrics,
  AutoScalingServiceConfig,
} from '../types';

export class ScalingExecutor extends EventEmitter {
  private k8sApi?: k8s.AppsV1Api;
  private docker?: Docker;
  private providerAdapters: Map<string, CloudProviderAdapter> = new Map();
  private executionHistory: Map<string, ScalingEvent[]> = new Map();
  private activeScalings: Set<string> = new Set();

  constructor(private config: AutoScalingServiceConfig) {
    super();
    this.initializeProviders();
  }

  private initializeProviders(): void {
    try {
      // Initialize Kubernetes client
      if (this.config.scaling.provider === 'kubernetes') {
        const kc = new k8s.KubeConfig();
        kc.loadFromDefault();
        this.k8sApi = kc.makeApiClient(k8s.AppsV1Api);
        console.log('Kubernetes client initialized');
      }

      // Initialize Docker client
      if (this.config.scaling.provider === 'docker') {
        this.docker = new Docker();
        console.log('Docker client initialized');
      }

      // Initialize cloud provider adapters
      if (this.config.scaling.provider === 'cloud') {
        // In a real implementation, you'd initialize AWS, Azure, GCP adapters here
        console.log('Cloud provider adapters would be initialized here');
      }
    } catch (error) {
      console.error('Failed to initialize scaling providers:', error);
      this.emit('error', { type: 'provider_init_failed', error });
    }
  }

  public async executeScalingDecision(decision: AutoScalingDecision): Promise<ScalingEvent> {
    const eventId = this.generateEventId();
    const startTime = Date.now();

    // Check if scaling is already in progress for this service
    if (this.activeScalings.has(decision.serviceName)) {
      throw new Error(`Scaling already in progress for service: ${decision.serviceName}`);
    }

    // Mark service as actively scaling
    this.activeScalings.add(decision.serviceName);

    try {
      console.log(`Executing scaling decision for ${decision.serviceName}: ${decision.currentInstances} -> ${decision.recommendedInstances}`);

      // Create initial scaling event
      const scalingEvent: ScalingEvent = {
        id: eventId,
        timestamp: new Date(),
        rule: decision.triggeredRules.join(', '),
        action: {
          type: decision.action,
          targetInstances: decision.recommendedInstances,
          targetServices: [decision.serviceName],
          gracefulShutdown: true,
        },
        reason: decision.reasoning.join('; '),
        metricsSnapshot: decision.metricsUsed,
        previousInstances: decision.currentInstances,
        newInstances: decision.recommendedInstances,
        success: false,
        duration: 0,
      };

      this.emit('scalingStarted', scalingEvent);

      // Execute pre-scaling hooks
      await this.executeHooks('pre', decision.serviceName);

      // Perform the actual scaling operation
      const scalingResult = await this.performScaling(decision);

      // Execute post-scaling hooks
      await this.executeHooks('post', decision.serviceName);

      // Update scaling event with results
      scalingEvent.success = scalingResult.success;
      scalingEvent.newInstances = scalingResult.newInstances;
      scalingEvent.duration = Date.now() - startTime;
      
      if (!scalingResult.success) {
        scalingEvent.error = scalingResult.error;
      }

      // Store event in history
      this.addEventToHistory(decision.serviceName, scalingEvent);

      this.emit('scalingCompleted', scalingEvent);
      console.log(`Scaling completed for ${decision.serviceName} in ${scalingEvent.duration}ms`);

      return scalingEvent;

    } catch (error) {
      const scalingEvent: ScalingEvent = {
        id: eventId,
        timestamp: new Date(),
        rule: decision.triggeredRules.join(', '),
        action: {
          type: decision.action,
          targetInstances: decision.recommendedInstances,
          targetServices: [decision.serviceName],
          gracefulShutdown: true,
        },
        reason: decision.reasoning.join('; '),
        metricsSnapshot: decision.metricsUsed,
        previousInstances: decision.currentInstances,
        newInstances: decision.currentInstances, // Failed, so instances unchanged
        success: false,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      };

      this.addEventToHistory(decision.serviceName, scalingEvent);
      this.emit('scalingFailed', scalingEvent);
      throw error;

    } finally {
      // Remove from active scalings
      this.activeScalings.delete(decision.serviceName);
    }
  }

  private async performScaling(decision: AutoScalingDecision): Promise<ScalingResult> {
    const startTime = Date.now();
    const serviceName = decision.serviceName;
    const targetInstances = decision.recommendedInstances;

    try {
      let result: ScalingResult;

      switch (this.config.scaling.provider) {
        case 'kubernetes':
          result = await this.scaleKubernetesService(serviceName, targetInstances);
          break;
        case 'docker':
          result = await this.scaleDockerService(serviceName, targetInstances);
          break;
        case 'cloud':
          result = await this.scaleCloudService(serviceName, targetInstances);
          break;
        default:
          throw new Error(`Unsupported scaling provider: ${this.config.scaling.provider}`);
      }

      return result;

    } catch (error) {
      return {
        success: false,
        previousInstances: decision.currentInstances,
        newInstances: decision.currentInstances,
        duration: Date.now() - startTime,
        error: (error as Error).message,
        warnings: [],
      };
    }
  }

  private async scaleKubernetesService(serviceName: string, targetInstances: number): Promise<ScalingResult> {
    if (!this.k8sApi) {
      throw new Error('Kubernetes API not initialized');
    }

    const startTime = Date.now();
    const namespace = process.env.K8S_NAMESPACE || 'default';

    try {
      // Get current deployment
      const deploymentResponse = await this.k8sApi.readNamespacedDeployment(serviceName, namespace);
      const deployment = deploymentResponse.body;
      const previousInstances = deployment.spec?.replicas || 0;

      // Update replica count
      deployment.spec!.replicas = targetInstances;

      // Apply the changes
      await this.k8sApi.replaceNamespacedDeployment(serviceName, namespace, deployment);

      // Wait for rollout to complete (simplified - in production, you'd wait for ready replicas)
      const maxWaitTime = 300000; // 5 minutes
      const startWait = Date.now();
      
      while (Date.now() - startWait < maxWaitTime) {
        const updatedResponse = await this.k8sApi.readNamespacedDeployment(serviceName, namespace);
        const updatedDeployment = updatedResponse.body;
        
        if (updatedDeployment.status?.readyReplicas === targetInstances) {
          break;
        }
        
        await new Promise(resolve => setTimeout(resolve, 5000)); // Wait 5 seconds
      }

      return {
        success: true,
        previousInstances,
        newInstances: targetInstances,
        duration: Date.now() - startTime,
        warnings: [],
      };

    } catch (error) {
      throw new Error(`Kubernetes scaling failed: ${(error as Error).message}`);
    }
  }

  private async scaleDockerService(serviceName: string, targetInstances: number): Promise<ScalingResult> {
    if (!this.docker) {
      throw new Error('Docker client not initialized');
    }

    const startTime = Date.now();

    try {
      // In Docker Swarm mode, you'd use service scaling
      // This is a simplified implementation
      const service = this.docker.getService(serviceName);
      const serviceInfo = await service.inspect();
      const previousInstances = serviceInfo.Spec?.Mode?.Replicated?.Replicas || 0;

      // Update service with new replica count
      const updateOptions = {
        ...serviceInfo.Spec,
        Mode: {
          Replicated: {
            Replicas: targetInstances,
          },
        },
      };

      await service.update(updateOptions, serviceInfo.Version);

      return {
        success: true,
        previousInstances,
        newInstances: targetInstances,
        duration: Date.now() - startTime,
        warnings: [],
      };

    } catch (error) {
      throw new Error(`Docker scaling failed: ${(error as Error).message}`);
    }
  }

  private async scaleCloudService(serviceName: string, targetInstances: number): Promise<ScalingResult> {
    const adapter = this.providerAdapters.get('default');
    if (!adapter) {
      throw new Error('Cloud provider adapter not configured');
    }

    return await adapter.scaleService(serviceName, targetInstances);
  }

  private async executeHooks(phase: 'pre' | 'post', serviceName: string): Promise<void> {
    const hooks = phase === 'pre' ? [] : []; // Would be configured from scaling rules
    
    for (const hookUrl of hooks) {
      try {
        await axios.post(hookUrl, {
          phase,
          serviceName,
          timestamp: new Date().toISOString(),
        }, {
          timeout: 30000, // 30 second timeout
        });
        
        console.log(`${phase}-scaling hook executed successfully: ${hookUrl}`);
      } catch (error) {
        console.error(`${phase}-scaling hook failed: ${hookUrl}`, error);
        // Don't fail the entire scaling operation for hook failures
        this.emit('hookFailed', { phase, hookUrl, serviceName, error });
      }
    }
  }

  private generateEventId(): string {
    return `scaling_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
  }

  private addEventToHistory(serviceName: string, event: ScalingEvent): void {
    if (!this.executionHistory.has(serviceName)) {
      this.executionHistory.set(serviceName, []);
    }

    const history = this.executionHistory.get(serviceName)!;
    history.push(event);

    // Keep only last 50 events per service
    if (history.length > 50) {
      history.splice(0, history.length - 50);
    }
  }

  public async validateScalingCapability(serviceName: string): Promise<{
    canScale: boolean;
    issues: string[];
    currentInstances: number;
    limits: { min: number; max: number };
  }> {
    const issues: string[] = [];
    let currentInstances = 0;
    
    try {
      switch (this.config.scaling.provider) {
        case 'kubernetes':
          if (!this.k8sApi) {
            issues.push('Kubernetes API not available');
            break;
          }
          
          try {
            const namespace = process.env.K8S_NAMESPACE || 'default';
            const response = await this.k8sApi.readNamespacedDeployment(serviceName, namespace);
            currentInstances = response.body.spec?.replicas || 0;
          } catch (error) {
            issues.push(`Service ${serviceName} not found in Kubernetes`);
          }
          break;

        case 'docker':
          if (!this.docker) {
            issues.push('Docker client not available');
            break;
          }
          
          try {
            const service = this.docker.getService(serviceName);
            const serviceInfo = await service.inspect();
            currentInstances = serviceInfo.Spec?.Mode?.Replicated?.Replicas || 0;
          } catch (error) {
            issues.push(`Docker service ${serviceName} not found`);
          }
          break;

        case 'cloud':
          const adapter = this.providerAdapters.get('default');
          if (!adapter) {
            issues.push('Cloud provider adapter not configured');
          } else {
            try {
              currentInstances = await adapter.getCurrentInstances(serviceName);
            } catch (error) {
              issues.push(`Failed to get cloud service info: ${(error as Error).message}`);
            }
          }
          break;

        default:
          issues.push(`Unsupported provider: ${this.config.scaling.provider}`);
      }

      // Check if service is currently being scaled
      if (this.activeScalings.has(serviceName)) {
        issues.push('Service is currently being scaled');
      }

    } catch (error) {
      issues.push(`Validation failed: ${(error as Error).message}`);
    }

    return {
      canScale: issues.length === 0,
      issues,
      currentInstances,
      limits: {
        min: this.config.scaling.limits.minInstances,
        max: this.config.scaling.limits.maxInstances,
      },
    };
  }

  public async testScalingOperation(serviceName: string, targetInstances: number): Promise<{
    feasible: boolean;
    estimatedDuration: number; // seconds
    resourceRequirements: {
      cpu: number;
      memory: number;
      network: number;
    };
    risks: string[];
  }> {
    const validation = await this.validateScalingCapability(serviceName);
    
    if (!validation.canScale) {
      return {
        feasible: false,
        estimatedDuration: 0,
        resourceRequirements: { cpu: 0, memory: 0, network: 0 },
        risks: validation.issues,
      };
    }

    const instanceDelta = Math.abs(targetInstances - validation.currentInstances);
    const isScaleUp = targetInstances > validation.currentInstances;
    
    // Estimate duration based on instance count and operation type
    let estimatedDuration = 30; // Base 30 seconds
    estimatedDuration += instanceDelta * (isScaleUp ? 15 : 10); // 15s per scale-up, 10s per scale-down
    
    // Estimate resource requirements per instance
    const resourceRequirements = {
      cpu: instanceDelta * 0.5, // 0.5 CPU cores per instance
      memory: instanceDelta * 1024 * 1024 * 1024, // 1GB per instance
      network: instanceDelta * 100 * 1024 * 1024, // 100MB/s per instance
    };

    const risks: string[] = [];
    
    // Identify potential risks
    if (instanceDelta > 5) {
      risks.push('Large scaling operation may impact system stability');
    }
    
    if (targetInstances === validation.limits.min) {
      risks.push('Scaling to minimum instances reduces redundancy');
    }
    
    if (targetInstances === validation.limits.max) {
      risks.push('Scaling to maximum instances - no room for further growth');
    }
    
    if (isScaleUp && instanceDelta > validation.currentInstances) {
      risks.push('Scaling up by more than 100% may overwhelm dependencies');
    }

    return {
      feasible: true,
      estimatedDuration,
      resourceRequirements,
      risks,
    };
  }

  public getScalingHistory(serviceName: string, limit?: number): ScalingEvent[] {
    const history = this.executionHistory.get(serviceName) || [];
    return limit ? history.slice(-limit) : [...history];
  }

  public getAllScalingHistory(limit?: number): ScalingEvent[] {
    const allEvents: ScalingEvent[] = [];
    
    for (const events of this.executionHistory.values()) {
      allEvents.push(...events);
    }
    
    // Sort by timestamp descending
    allEvents.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    
    return limit ? allEvents.slice(0, limit) : allEvents;
  }

  public getActiveScalings(): string[] {
    return Array.from(this.activeScalings);
  }

  public async emergencyScaleDown(serviceName: string, emergencyInstances: number): Promise<ScalingEvent> {
    console.log(`Emergency scale-down initiated for ${serviceName} to ${emergencyInstances} instances`);
    
    const emergencyDecision: AutoScalingDecision = {
      timestamp: new Date(),
      serviceName,
      currentInstances: 0, // Will be determined during scaling
      recommendedInstances: emergencyInstances,
      confidence: 1.0,
      reasoning: ['Emergency scale-down initiated'],
      triggeredRules: ['emergency'],
      metricsUsed: {},
      action: 'scale_down',
      urgency: 'critical',
    };

    return await this.executeScalingDecision(emergencyDecision);
  }

  public async rollbackLastScaling(serviceName: string): Promise<ScalingEvent | null> {
    const history = this.getScalingHistory(serviceName, 1);
    if (history.length === 0) {
      console.log(`No scaling history found for ${serviceName}`);
      return null;
    }

    const lastEvent = history[0];
    if (!lastEvent.success) {
      console.log(`Last scaling for ${serviceName} was not successful, cannot rollback`);
      return null;
    }

    console.log(`Rolling back ${serviceName} from ${lastEvent.newInstances} to ${lastEvent.previousInstances} instances`);

    const rollbackDecision: AutoScalingDecision = {
      timestamp: new Date(),
      serviceName,
      currentInstances: lastEvent.newInstances,
      recommendedInstances: lastEvent.previousInstances,
      confidence: 1.0,
      reasoning: [`Rollback of scaling event ${lastEvent.id}`],
      triggeredRules: ['rollback'],
      metricsUsed: {},
      action: lastEvent.previousInstances > lastEvent.newInstances ? 'scale_up' : 'scale_down',
      urgency: 'high',
    };

    return await this.executeScalingDecision(rollbackDecision);
  }
}