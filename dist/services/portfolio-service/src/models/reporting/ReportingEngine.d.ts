export declare enum ReportType {
    PERFORMANCE = "PERFORMANCE",
    ATTRIBUTION = "ATTRIBUTION",
    HOLDINGS = "HOLDINGS",
    ALLOCATION = "ALLOCATION",
    TRANSACTION = "TRANSACTION",
    FEE = "FEE",
    COMPLIANCE = "COMPLIANCE",
    REGULATORY = "REGULATORY",
    TAX = "TAX",
    RISK = "RISK",
    CASH_FLOW = "CASH_FLOW",
    CUSTOM = "CUSTOM"
}
export declare enum ReportFormat {
    PDF = "PDF",
    EXCEL = "EXCEL",
    CSV = "CSV",
    HTML = "HTML",
    JSON = "JSON",
    XML = "XML"
}
export declare enum ReportFrequency {
    ON_DEMAND = "ON_DEMAND",
    DAILY = "DAILY",
    WEEKLY = "WEEKLY",
    MONTHLY = "MONTHLY",
    QUARTERLY = "QUARTERLY",
    SEMI_ANNUAL = "SEMI_ANNUAL",
    ANNUAL = "ANNUAL"
}
export declare enum ReportStatus {
    DRAFT = "DRAFT",
    PENDING = "PENDING",
    GENERATING = "GENERATING",
    COMPLETED = "COMPLETED",
    FAILED = "FAILED",
    CANCELLED = "CANCELLED",
    SCHEDULED = "SCHEDULED"
}
export declare enum AggregationLevel {
    ACCOUNT = "ACCOUNT",
    PORTFOLIO = "PORTFOLIO",
    CLIENT = "CLIENT",
    HOUSEHOLD = "HOUSEHOLD",
    ENTITY = "ENTITY",
    SECTOR = "SECTOR",
    ASSET_CLASS = "ASSET_CLASS",
    SECURITY = "SECURITY"
}
export interface ReportColumn {
    id: string;
    name: string;
    displayName: string;
    dataType: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'CURRENCY' | 'PERCENTAGE';
    source: string;
    formula?: string;
    format?: string;
    width?: number;
    alignment?: 'LEFT' | 'RIGHT' | 'CENTER';
    sortable: boolean;
    filterable: boolean;
    aggregatable: boolean;
    aggregationFunction?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX' | 'MEDIAN';
    conditionalFormatting?: ConditionalFormatting[];
}
export interface ConditionalFormatting {
    id: string;
    condition: string;
    style: {
        backgroundColor?: string;
        textColor?: string;
        fontWeight?: 'NORMAL' | 'BOLD';
        fontSize?: number;
        icon?: string;
    };
}
export interface ReportFilter {
    id: string;
    columnId: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'GREATER_EQUAL' | 'LESS_EQUAL' | 'CONTAINS' | 'STARTS_WITH' | 'ENDS_WITH' | 'IN' | 'NOT_IN' | 'BETWEEN' | 'IS_NULL' | 'IS_NOT_NULL';
    value: any;
    values?: any[];
    minValue?: any;
    maxValue?: any;
}
export interface ReportSort {
    columnId: string;
    direction: 'ASC' | 'DESC';
    priority: number;
}
export interface ReportGrouping {
    columnId: string;
    level: number;
    showSubtotals: boolean;
    showGrandTotal: boolean;
    aggregationFunction?: 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';
}
export interface ChartConfiguration {
    type: 'LINE' | 'BAR' | 'PIE' | 'DONUT' | 'AREA' | 'SCATTER' | 'BUBBLE';
    title: string;
    xAxis: {
        columnId: string;
        title?: string;
        showGridLines?: boolean;
    };
    yAxis: {
        columnId: string;
        title?: string;
        showGridLines?: boolean;
        startFromZero?: boolean;
    };
    series?: {
        columnId: string;
        name: string;
        color?: string;
    }[];
    showLegend: boolean;
    showDataLabels: boolean;
    width?: number;
    height?: number;
}
export interface ReportSection {
    id: string;
    name: string;
    type: 'TABLE' | 'CHART' | 'TEXT' | 'IMAGE' | 'PAGE_BREAK';
    order: number;
    columns?: string[];
    filters?: ReportFilter[];
    sorting?: ReportSort[];
    grouping?: ReportGrouping[];
    chart?: ChartConfiguration;
    text?: {
        content: string;
        fontSize?: number;
        fontWeight?: 'NORMAL' | 'BOLD';
        alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
        marginTop?: number;
        marginBottom?: number;
    };
    image?: {
        url: string;
        width?: number;
        height?: number;
        alignment?: 'LEFT' | 'CENTER' | 'RIGHT';
    };
    showCondition?: string;
}
export interface ReportTemplate {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    reportType: ReportType;
    category: string;
    tags: string[];
    dataSource: {
        baseEntity: string;
        joins?: string[];
        dateRange?: {
            type: 'FIXED' | 'RELATIVE' | 'PROMPT';
            startDate?: Date;
            endDate?: Date;
            relativePeriod?: string;
        };
    };
    columns: ReportColumn[];
    sections: ReportSection[];
    defaultFilters?: ReportFilter[];
    defaultSorting?: ReportSort[];
    defaultGrouping?: ReportGrouping[];
    layout: {
        orientation: 'PORTRAIT' | 'LANDSCAPE';
        pageSize: 'A4' | 'LETTER' | 'LEGAL' | 'A3';
        margins: {
            top: number;
            bottom: number;
            left: number;
            right: number;
        };
        header?: {
            content: string;
            height: number;
            showPageNumbers: boolean;
        };
        footer?: {
            content: string;
            height: number;
            showTimestamp: boolean;
        };
    };
    isPublic: boolean;
    allowedRoles: string[];
    sharedWith: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
    version: string;
    isActive: boolean;
    usageCount: number;
    lastUsed?: Date;
}
export interface ReportRequest {
    templateId: string;
    name?: string;
    parameters?: Record<string, any>;
    filters?: ReportFilter[];
    dateRange?: {
        startDate: Date;
        endDate: Date;
    };
    format: ReportFormat;
    deliveryMethod: 'DOWNLOAD' | 'EMAIL' | 'SAVE' | 'PRINT';
    emailRecipients?: string[];
    aggregationLevel?: AggregationLevel;
    includeCharts?: boolean;
    includeRawData?: boolean;
    clientIds?: string[];
    portfolioIds?: string[];
    accountIds?: string[];
    requestedBy: string;
    requestedAt: Date;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}
export interface ReportJob {
    id: string;
    tenantId: string;
    templateId: string;
    request: ReportRequest;
    status: ReportStatus;
    progress: number;
    startTime?: Date;
    endTime?: Date;
    executionTime?: number;
    result?: {
        outputFileUrl?: string;
        outputSize?: number;
        recordCount?: number;
        errorMessage?: string;
        warnings?: string[];
    };
    retryCount: number;
    maxRetries: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReportSchedule {
    id: string;
    tenantId: string;
    templateId: string;
    name: string;
    description?: string;
    frequency: ReportFrequency;
    schedule: {
        dayOfWeek?: number;
        dayOfMonth?: number;
        hour: number;
        minute: number;
        timezone: string;
    };
    nextExecution: Date;
    lastExecution?: Date;
    parameters: Record<string, any>;
    recipients: string[];
    format: ReportFormat;
    isActive: boolean;
    failureCount: number;
    maxFailures: number;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
    updatedBy: string;
}
export interface ReportData {
    headers: string[];
    rows: any[][];
    metadata: {
        totalRows: number;
        generatedAt: Date;
        executionTime: number;
        filters: ReportFilter[];
        dateRange?: {
            startDate: Date;
            endDate: Date;
        };
    };
}
export interface PerformanceReportData {
    portfolioId: string;
    portfolioName: string;
    clientName: string;
    asOfDate: Date;
    performance: {
        totalReturn: number;
        totalReturnPercent: number;
        timeWeightedReturn: number;
        moneyWeightedReturn: number;
        benchmarkReturn?: number;
        excessReturn?: number;
        sharpeRatio?: number;
        volatility?: number;
        maxDrawdown?: number;
    };
    periods: {
        period: string;
        portfolioReturn: number;
        benchmarkReturn?: number;
        excessReturn?: number;
    }[];
    attribution?: {
        assetClass: string;
        allocation: number;
        selection: number;
        interaction: number;
        total: number;
    }[];
}
export interface HoldingsReportData {
    portfolioId: string;
    portfolioName: string;
    asOfDate: Date;
    holdings: {
        symbol: string;
        description: string;
        assetClass: string;
        sector?: string;
        quantity: number;
        marketValue: number;
        costBasis: number;
        unrealizedGainLoss: number;
        unrealizedGainLossPercent: number;
        weight: number;
        pricePerShare: number;
        lastTradeDate: Date;
    }[];
    summary: {
        totalMarketValue: number;
        totalCostBasis: number;
        totalUnrealizedGainLoss: number;
        totalUnrealizedGainLossPercent: number;
    };
    allocation: {
        assetClass: string;
        marketValue: number;
        weight: number;
    }[];
}
export interface TransactionReportData {
    portfolioId: string;
    portfolioName: string;
    dateRange: {
        startDate: Date;
        endDate: Date;
    };
    transactions: {
        tradeDate: Date;
        settlementDate: Date;
        symbol: string;
        description: string;
        transactionType: string;
        quantity: number;
        price: number;
        grossAmount: number;
        fees: number;
        netAmount: number;
        source: string;
    }[];
    summary: {
        totalBuys: number;
        totalSells: number;
        totalDividends: number;
        totalFees: number;
        netCashFlow: number;
        transactionCount: number;
    };
}
export interface ComplianceReportData {
    portfolioId: string;
    portfolioName: string;
    asOfDate: Date;
    violations: {
        ruleId: string;
        ruleName: string;
        severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
        description: string;
        currentValue: number;
        limitValue: number;
        violationPercent: number;
        status: 'ACTIVE' | 'RESOLVED' | 'ACKNOWLEDGED';
        detectedDate: Date;
    }[];
    limits: {
        limitType: string;
        description: string;
        currentValue: number;
        limitValue: number;
        utilizationPercent: number;
        status: 'COMPLIANT' | 'WARNING' | 'VIOLATION';
    }[];
    summary: {
        totalViolations: number;
        criticalViolations: number;
        warningCount: number;
        complianceScore: number;
    };
}
export interface ReportDelivery {
    id: string;
    reportJobId: string;
    method: 'EMAIL' | 'SAVE' | 'DOWNLOAD' | 'API';
    recipients?: string[];
    subject?: string;
    message?: string;
    deliveryStatus: 'PENDING' | 'SENT' | 'DELIVERED' | 'FAILED';
    deliveryTime?: Date;
    errorMessage?: string;
    createdAt: Date;
    updatedAt: Date;
}
export interface ReportLibrary {
    id: string;
    tenantId: string;
    name: string;
    description: string;
    templates: string[];
    tags: string[];
    category: string;
    isPublic: boolean;
    allowedRoles: string[];
    createdAt: Date;
    updatedAt: Date;
    createdBy: string;
}
export interface ReportUsageStats {
    templateId: string;
    templateName: string;
    stats: {
        totalRuns: number;
        successfulRuns: number;
        failedRuns: number;
        averageExecutionTime: number;
        lastRun?: Date;
        popularityScore: number;
    };
    userStats: {
        userId: string;
        runCount: number;
        lastRun: Date;
    }[];
    generatedAt: Date;
}
export interface CustomReportBuilder {
    dataSource: string;
    selectedColumns: string[];
    filters: ReportFilter[];
    sorting: ReportSort[];
    grouping: ReportGrouping[];
    aggregations: string[];
    preview: {
        sampleData: any[][];
        estimatedRowCount: number;
        estimatedSize: string;
    };
}
