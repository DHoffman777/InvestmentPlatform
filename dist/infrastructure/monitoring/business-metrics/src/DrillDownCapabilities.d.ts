import { EventEmitter } from 'events';
import { TimeInterval } from './BusinessMetricsDataModel';
export interface DrillDownPath {
    id: string;
    name: string;
    levels: DrillDownLevel[];
    metricIds: string[];
    isDefault: boolean;
    createdAt: Date;
}
export interface DrillDownLevel {
    id: string;
    name: string;
    displayName: string;
    dimension: string;
    order: number;
    aggregationMethod: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
    filters?: DrillDownFilter[];
    sortBy?: string;
    sortOrder: 'asc' | 'desc';
    maxResults?: number;
}
export interface DrillDownFilter {
    field: string;
    operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'contains' | 'between';
    value: any;
    isRequired: boolean;
}
export interface DrillDownContext {
    pathId: string;
    currentLevel: number;
    selectedValues: Record<string, string>;
    timeRange: {
        start: Date;
        end: Date;
        interval: TimeInterval;
    };
    filters: Record<string, any>;
    userId: string;
    tenantId: string;
}
export interface DrillDownResult {
    context: DrillDownContext;
    level: DrillDownLevel;
    data: DrillDownDataPoint[];
    aggregations: DrillDownAggregation[];
    metadata: DrillDownMetadata;
    nextLevel?: DrillDownLevel;
    breadcrumbs: DrillDownBreadcrumb[];
    recommendations: DrillDownRecommendation[];
}
export interface DrillDownDataPoint {
    id: string;
    dimension: string;
    label: string;
    value: number;
    formattedValue: string;
    percentage: number;
    rank: number;
    trend: {
        direction: 'up' | 'down' | 'stable';
        percentage: number;
        period: string;
    };
    comparison: {
        previous: number;
        target?: number;
        benchmark?: number;
    };
    metadata: Record<string, any>;
    children?: number;
    isExpandable: boolean;
}
export interface DrillDownAggregation {
    type: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'median' | 'percentile';
    value: number;
    formattedValue: string;
    label: string;
    description?: string;
}
export interface DrillDownMetadata {
    totalRecords: number;
    filteredRecords: number;
    processingTime: number;
    dataFreshness: Date;
    confidence: number;
    warnings: string[];
    nextRefresh?: Date;
}
export interface DrillDownBreadcrumb {
    level: number;
    name: string;
    value: string;
    isClickable: boolean;
}
export interface DrillDownRecommendation {
    type: 'outlier' | 'trend' | 'opportunity' | 'risk';
    title: string;
    description: string;
    dataPoints: string[];
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
}
export interface DrillDownQuery {
    metricId: string;
    dimensions: string[];
    timeRange: {
        start: Date;
        end: Date;
        granularity: TimeInterval;
    };
    filters: Record<string, any>;
    aggregation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
    groupBy: string[];
    orderBy?: {
        field: string;
        direction: 'asc' | 'desc';
    };
    limit?: number;
    offset?: number;
}
export interface DrillDownCache {
    key: string;
    result: DrillDownResult;
    createdAt: Date;
    expiresAt: Date;
    hitCount: number;
    lastAccessed: Date;
}
export interface DrillDownSession {
    id: string;
    userId: string;
    tenantId: string;
    startedAt: Date;
    lastActivity: Date;
    currentContext: DrillDownContext;
    history: DrillDownContext[];
    bookmarks: DrillDownBookmark[];
    preferences: DrillDownPreferences;
}
export interface DrillDownBookmark {
    id: string;
    name: string;
    description?: string;
    context: DrillDownContext;
    createdAt: Date;
    isShared: boolean;
    tags: string[];
}
export interface DrillDownPreferences {
    defaultTimeRange: string;
    defaultAggregation: string;
    autoRefresh: boolean;
    refreshInterval: number;
    maxResultsPerLevel: number;
    showTrends: boolean;
    showComparisons: boolean;
    theme: 'light' | 'dark' | 'auto';
}
export declare class DrillDownCapabilities extends EventEmitter {
    private drillDownPaths;
    private sessions;
    private cache;
    private queryEngine;
    private aggregationEngine;
    private insightEngine;
    private cacheCleanupTimer?;
    constructor();
    createDrillDownPath(path: Partial<DrillDownPath>): Promise<DrillDownPath>;
    startDrillDownSession(userId: string, tenantId: string, pathId: string, initialContext?: Partial<DrillDownContext>): Promise<DrillDownSession>;
    performDrillDown(sessionId: string, context: Partial<DrillDownContext>): Promise<DrillDownResult>;
    private executeDrillDown;
    private buildDrillDownQuery;
    private processRawData;
    private buildBreadcrumbs;
    navigateToLevel(sessionId: string, targetLevel: number, selectedValue?: string): Promise<DrillDownResult>;
    navigateBack(sessionId: string): Promise<DrillDownResult>;
    createBookmark(sessionId: string, name: string, description?: string, isShared?: boolean, tags?: string[]): Promise<DrillDownBookmark>;
    loadBookmark(sessionId: string, bookmarkId: string): Promise<DrillDownResult>;
    exportDrillDownData(sessionId: string, format: 'csv' | 'excel' | 'json' | 'pdf', options?: {
        includeMetadata?: boolean;
        includeAggregations?: boolean;
        includeRecommendations?: boolean;
    }): Promise<ExportResult>;
    private formatExportData;
    private convertToCSV;
    private validateDrillDownPath;
    private calculateTrendDirection;
    private calculateTrendPercentage;
    private formatValue;
    private calculateConfidence;
    private generateCacheKey;
    private cacheResult;
    private initializeDefaultPaths;
    private getDefaultPreferences;
    private startCacheCleanup;
    private generateId;
    getDrillDownPath(pathId: string): DrillDownPath | null;
    getDrillDownPaths(): DrillDownPath[];
    getSession(sessionId: string): DrillDownSession | null;
    endSession(sessionId: string): Promise<any>;
    getCacheStats(): any;
    shutdown(): Promise<any>;
}
interface ExportResult {
    id: string;
    format: string;
    filename: string;
    data: string;
    size: number;
    createdAt: Date;
    expiresAt: Date;
}
export {};
