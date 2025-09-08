export = InfrastructureMonitor;
/**
 * Investment Platform Infrastructure Monitor
 * Comprehensive infrastructure monitoring and alerting system
 */
declare class InfrastructureMonitor {
    services: Map<any, any>;
    metrics: {
        kubernetes: {
            nodes: any[];
            pods: any[];
            services: any[];
            deployments: any[];
            resources: any[];
        };
        docker: {
            containers: any[];
            images: any[];
            volumes: any[];
            networks: any[];
        };
        database: {
            connections: any[];
            replication: any[];
            performance: any[];
            backups: any[];
        };
        redis: {
            memory: any[];
            connections: any[];
            commands: any[];
            replication: any[];
        };
        messageQueue: {
            queues: any[];
            messages: any[];
            consumers: any[];
            errors: any[];
        };
        loadBalancer: {
            backends: any[];
            health: any[];
            traffic: any[];
        };
        storage: {
            volumes: any[];
            usage: any[];
            performance: any[];
        };
        network: {
            connectivity: any[];
            latency: any[];
            bandwidth: any[];
        };
    };
    config: {
        monitoring: {
            interval: number;
            healthCheckInterval: number;
            retention: number;
        };
        thresholds: {
            nodeMemory: number;
            nodeCpu: number;
            podRestarts: number;
            diskUsage: number;
            dbConnections: number;
            redisMemory: number;
            queueDepth: number;
        };
        kubernetes: {
            enabled: boolean;
            namespace: string;
            configPath: string;
        };
        docker: {
            enabled: boolean;
            socket: string;
        };
        alerting: {
            webhooks: string[];
            email: {
                enabled: boolean;
                recipients: string[];
            };
            pagerduty: {
                enabled: boolean;
                integrationKey: string;
            };
        };
    };
    alerts: any[];
    healthChecks: Map<any, any>;
    monitoringTimer: NodeJS.Timeout;
    healthCheckTimer: NodeJS.Timeout;
    initializeMonitoring(): void;
    registerCoreServices(): void;
    startMonitoring(): void;
    collectInfrastructureMetrics(): Promise<void>;
    collectKubernetesMetrics(): Promise<void>;
    collectDockerMetrics(): Promise<void>;
    collectDatabaseMetrics(): Promise<void>;
    collectRedisMetrics(): Promise<void>;
    collectMessageQueueMetrics(): Promise<void>;
    collectStorageMetrics(): Promise<void>;
    collectNetworkMetrics(): Promise<void>;
    performHealthChecks(): Promise<void>;
    checkServiceHealth(serviceName: any, service: any): Promise<void>;
    checkHttpHealth(url: any): Promise<boolean>;
    checkDatabaseHealth(host: any, port: any): Promise<any>;
    checkRedisHealth(host: any, port: any): Promise<any>;
    checkKafkaHealth(host: any, port: any): Promise<any>;
    checkInfrastructureThresholds(): void;
    createAlert(alert: any): void;
    sendImmediateAlert(alert: any): Promise<void>;
    getInfrastructureStatus(): {
        timestamp: number;
        overall: {
            status: string;
            healthyServices: number;
            totalServices: number;
            healthPercentage: string;
        };
        services: {
            name: any;
            status: any;
            responseTime: any;
            consecutiveFailures: any;
            uptime: any;
        }[];
        kubernetes: {
            nodes: number;
            pods: number;
            services: number;
        };
        docker: {
            containers: number;
            runningContainers: number;
        };
        alerts: {
            total: number;
            unresolved: number;
            critical: number;
        };
    };
    getNodeStatus(node: any): "Ready" | "NotReady";
    cleanupOldMetrics(): void;
    generateReport(): Promise<string>;
    initializeHealthChecks(): void;
    shutdown(): void;
}
