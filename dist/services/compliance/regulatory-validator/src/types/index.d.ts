export interface RegulatoryRule {
    id: string;
    name: string;
    description: string;
    jurisdiction: string;
    category: 'SEC' | 'FINRA' | 'CFTC' | 'GDPR' | 'CCPA' | 'MiFID II' | 'FATCA' | 'CRS' | 'CUSTOM';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    enabled: boolean;
    conditions: RegulatoryCondition[];
    remediation?: string;
    references: string[];
    effectiveDate: Date;
    lastUpdated: Date;
    version: string;
}
export interface RegulatoryCondition {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'not_contains' | 'in' | 'not_in' | 'regex' | 'between';
    value: any;
    logicalOperator?: 'AND' | 'OR';
}
export interface ComplianceValidationRequest {
    requestId: string;
    entity: {
        type: 'client' | 'portfolio' | 'transaction' | 'advisor' | 'firm';
        id: string;
        data: Record<string, any>;
    };
    validationType: 'real_time' | 'batch' | 'scheduled';
    rules?: string[];
    context?: {
        userId?: string;
        timestamp: Date;
        source: string;
        metadata?: Record<string, any>;
    };
}
export interface ComplianceValidationResult {
    requestId: string;
    entityId: string;
    entityType: string;
    timestamp: Date;
    overallStatus: 'COMPLIANT' | 'NON_COMPLIANT' | 'WARNING' | 'PARTIAL';
    validatedRules: RuleValidationResult[];
    summary: {
        totalRules: number;
        passedRules: number;
        failedRules: number;
        warningRules: number;
        criticalViolations: number;
    };
    recommendations: ComplianceRecommendation[];
    metadata: {
        processingTime: number;
        dataQualityScore: number;
        confidenceLevel: number;
    };
}
export interface RuleValidationResult {
    ruleId: string;
    ruleName: string;
    category: string;
    status: 'PASS' | 'FAIL' | 'WARNING' | 'SKIP';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    message: string;
    details?: {
        actualValue?: any;
        expectedValue?: any;
        threshold?: any;
        evidence?: string[];
    };
    timestamp: Date;
}
export interface ComplianceRecommendation {
    id: string;
    type: 'IMMEDIATE_ACTION' | 'PROCESS_IMPROVEMENT' | 'DOCUMENTATION' | 'TRAINING' | 'SYSTEM_UPDATE';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    description: string;
    action: string;
    estimatedEffort: string;
    deadline?: Date;
    relatedRules: string[];
    resources?: string[];
}
export interface RegulatoryFramework {
    id: string;
    name: string;
    jurisdiction: string;
    description: string;
    version: string;
    effectiveDate: Date;
    categories: FrameworkCategory[];
    updateFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
    lastSyncDate: Date;
}
export interface FrameworkCategory {
    id: string;
    name: string;
    description: string;
    requirements: FrameworkRequirement[];
}
export interface FrameworkRequirement {
    id: string;
    title: string;
    description: string;
    mandatory: boolean;
    applicableEntityTypes: string[];
    relatedRules: string[];
    documentationRequired: boolean;
    auditFrequency?: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL';
}
export interface ComplianceAuditTrail {
    id: string;
    timestamp: Date;
    entityType: string;
    entityId: string;
    eventType: 'VALIDATION' | 'RULE_UPDATE' | 'EXCEPTION' | 'REMEDIATION' | 'REVIEW';
    eventDetails: {
        action: string;
        oldValue?: any;
        newValue?: any;
        triggeredBy: string;
        reason?: string;
    };
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
    complianceStatus: string;
    retentionDate: Date;
}
export interface ComplianceException {
    id: string;
    entityType: string;
    entityId: string;
    ruleId: string;
    exceptionType: 'TEMPORARY' | 'PERMANENT' | 'CONDITIONAL';
    reason: string;
    justification: string;
    approvedBy: string;
    approvalDate: Date;
    effectiveDate: Date;
    expirationDate?: Date;
    conditions?: string[];
    reviewRequired: boolean;
    nextReviewDate?: Date;
    documentAttachments?: string[];
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'EXPIRED' | 'REVOKED';
}
export interface RegulatoryAlert {
    id: string;
    alertType: 'VIOLATION' | 'THRESHOLD' | 'DEADLINE' | 'FRAMEWORK_UPDATE' | 'EXCEPTION_EXPIRY';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    title: string;
    message: string;
    entityType?: string;
    entityId?: string;
    ruleId?: string;
    timestamp: Date;
    status: 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED';
    assignedTo?: string;
    dueDate?: Date;
    escalationLevel: number;
    notificationChannels: ('EMAIL' | 'SMS' | 'WEBHOOK' | 'DASHBOARD')[];
    metadata: Record<string, any>;
}
export interface ComplianceReport {
    id: string;
    reportType: 'DAILY' | 'WEEKLY' | 'MONTHLY' | 'QUARTERLY' | 'ANNUAL' | 'AD_HOC';
    title: string;
    description: string;
    generatedAt: Date;
    period: {
        startDate: Date;
        endDate: Date;
    };
    scope: {
        entityTypes: string[];
        entityIds?: string[];
        jurisdictions: string[];
        frameworks: string[];
    };
    summary: {
        totalEntitiesReviewed: number;
        compliantEntities: number;
        nonCompliantEntities: number;
        exceptionsGranted: number;
        criticalViolations: number;
        overallComplianceRate: number;
    };
    sections: ReportSection[];
    recommendations: ComplianceRecommendation[];
    nextReviewDate?: Date;
    distribution: {
        recipients: string[];
        format: 'PDF' | 'HTML' | 'JSON' | 'EXCEL';
        deliveryMethod: 'EMAIL' | 'DOWNLOAD' | 'API';
    };
}
export interface ReportSection {
    id: string;
    title: string;
    type: 'SUMMARY' | 'DETAILED_ANALYSIS' | 'TREND_ANALYSIS' | 'EXCEPTIONS' | 'RECOMMENDATIONS';
    content: {
        text?: string;
        data?: any[];
        charts?: ChartData[];
        tables?: TableData[];
    };
    insights: string[];
    actionItems?: string[];
}
export interface ChartData {
    type: 'bar' | 'line' | 'pie' | 'area' | 'scatter';
    title: string;
    data: {
        labels: string[];
        datasets: {
            label: string;
            data: number[];
            backgroundColor?: string[];
            borderColor?: string[];
        }[];
    };
}
export interface TableData {
    title: string;
    headers: string[];
    rows: any[][];
    summary?: {
        totalRows: number;
        aggregations?: Record<string, number | string>;
    };
}
export interface RegulatoryValidatorConfig {
    service: {
        port: number;
        host: string;
        environment: 'development' | 'staging' | 'production';
    };
    database: {
        redis: {
            host: string;
            port: number;
            password?: string;
            db: number;
        };
    };
    frameworks: {
        autoSync: boolean;
        syncInterval: string;
        sources: {
            sec: {
                enabled: boolean;
                apiKey?: string;
                baseUrl: string;
            };
            finra: {
                enabled: boolean;
                baseUrl: string;
            };
            cftc: {
                enabled: boolean;
                baseUrl: string;
            };
            gdpr: {
                enabled: boolean;
                version: string;
            };
        };
    };
    notifications: {
        email: {
            enabled: boolean;
            smtpHost?: string;
            smtpPort?: number;
            username?: string;
            password?: string;
        };
        webhook: {
            enabled: boolean;
            endpoints: string[];
        };
        slack: {
            enabled: boolean;
            webhookUrl?: string;
        };
    };
    audit: {
        enabled: boolean;
        retentionDays: number;
        compressionEnabled: boolean;
    };
    reporting: {
        enabled: boolean;
        schedule: string;
        formats: ('PDF' | 'HTML' | 'JSON' | 'EXCEL')[];
        distributionLists: {
            daily: string[];
            weekly: string[];
            monthly: string[];
            quarterly: string[];
        };
    };
    performance: {
        cacheEnabled: boolean;
        cacheTtl: number;
        batchSize: number;
        maxConcurrentValidations: number;
        requestTimeout: number;
    };
}
export interface ValidationMetrics {
    timestamp: Date;
    totalValidations: number;
    averageProcessingTime: number;
    successRate: number;
    errorRate: number;
    rulePerformance: {
        ruleId: string;
        executionCount: number;
        averageExecutionTime: number;
        successRate: number;
    }[];
    systemMetrics: {
        cpuUsage: number;
        memoryUsage: number;
        cacheHitRate: number;
        databaseConnections: number;
    };
}
