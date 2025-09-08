export = GeographicReplicationManager;
/**
 * Investment Platform Geographic Data Replication Manager
 * Multi-region data replication for disaster recovery and high availability
 * Designed for financial services compliance and zero data loss requirements
 */
declare class GeographicReplicationManager extends EventEmitter<[never]> {
    constructor();
    replicationSites: Map<any, any>;
    replicationStreams: Map<any, any>;
    failoverGroups: Map<any, any>;
    replicationMetrics: Map<any, any>;
    config: {
        primary: {
            region: string;
            zone: string;
            datacenter: string;
        };
        replication: {
            mode: string;
            maxLagMs: number;
            compressionEnabled: boolean;
            encryptionEnabled: boolean;
            checksumValidation: boolean;
            batchSize: number;
            retryAttempts: number;
            retryDelayMs: number;
        };
        monitoring: {
            healthCheckInterval: number;
            metricCollectionInterval: number;
            alertOnLagThreshold: number;
            alertOnFailureCount: number;
        };
        failover: {
            automaticFailover: boolean;
            failoverTimeoutMs: number;
            maxFailoverAttempts: number;
            dataConsistencyCheck: boolean;
            rollbackOnFailure: boolean;
        };
        compliance: {
            dataResidency: boolean;
            auditLogging: boolean;
            encryptionAtRest: boolean;
            encryptionInTransit: boolean;
            retentionDays: number;
        };
    };
    primarySite: any;
    currentLeader: any;
    failoverInProgress: boolean;
    healthCheckTimer: NodeJS.Timeout;
    metricsTimer: NodeJS.Timeout;
    initializeReplicationManager(): Promise<void>;
    registerReplicationSites(): Promise<void>;
    initializeDatabaseReplication(): Promise<void>;
    setupDatabaseReplication(primarySiteId: any, replicaSiteId: any): Promise<void>;
    createReplicationSlot(site: any, slotName: any): Promise<void>;
    createPublication(site: any, publicationName: any): Promise<void>;
    createSubscription(site: any, subscriptionName: any, primarySite: any, publicationName: any): Promise<void>;
    initializeFileReplication(): Promise<void>;
    setupFileReplication(primarySiteId: any, replicaSiteId: any): Promise<void>;
    startFileSync(replicationStream: any): void;
    performFileSync(replicationStream: any): Promise<void>;
    setupFailoverGroups(): void;
    startHealthMonitoring(): void;
    performHealthChecks(): Promise<void>;
    checkSiteHealth(siteId: any): Promise<void>;
    checkDatabaseHealth(site: any): Promise<boolean>;
    checkStorageHealth(site: any): Promise<boolean>;
    checkNetworkLatency(site: any): Promise<number>;
    checkReplicationLag(): Promise<void>;
    measureReplicationLag(stream: any): Promise<number>;
    evaluateFailoverConditions(): void;
    initiateFailover(failoverGroupId: any, reason: any): Promise<boolean>;
    getFailoverTarget(failoverGroupId: any): any;
    performPreFailoverChecks(targetSiteId: any): Promise<void>;
    verifyDataConsistency(siteId: any): Promise<void>;
    promoteReplicaToPrimary(targetSiteId: any): Promise<void>;
    reconfigureReplication(newPrimarySiteId: any): Promise<void>;
    stopReplicationStream(streamId: any): Promise<void>;
    updateApplicationConfiguration(newPrimarySiteId: any): Promise<void>;
    verifyFailoverSuccess(newPrimarySiteId: any): Promise<void>;
    rollbackFailover(failoverGroupId: any): Promise<void>;
    startMetricsCollection(): void;
    collectReplicationMetrics(): Promise<void>;
    getReplicationStatus(): {
        timestamp: number;
        primarySite: any;
        currentLeader: any;
        failoverInProgress: boolean;
        sites: {
            id: any;
            type: any;
            region: any;
            location: any;
            healthStatus: any;
            connectionStatus: any;
            replicationLag: any;
            lastHealthCheck: any;
            metrics: any;
        }[];
        streams: {
            id: any;
            primarySite: any;
            replicaSite: any;
            type: any;
            status: any;
            lagMs: any;
            bytesTransferred: any;
            errorCount: any;
        }[];
        failoverGroups: any[];
        summary: {
            totalSites: number;
            healthySites: number;
            activeStreams: number;
            averageLag: number;
        };
    };
    calculateAverageLag(): number;
    generateReport(): Promise<string>;
    shutdown(): void;
}
import { EventEmitter } from "events";
