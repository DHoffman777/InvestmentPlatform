/**
 * Investment Platform Distributed Tracing System
 * Comprehensive distributed tracing for microservices architecture
 */
export class DistributedTracer {
    traces: Map<any, any>;
    spans: Map<any, any>;
    metrics: {
        totalTraces: number;
        totalSpans: number;
        errorSpans: number;
        slowSpans: number;
        serviceMap: Map<any, any>;
        operations: Map<any, any>;
    };
    config: {
        sampling: {
            rate: number;
            slowThreshold: number;
            errorSampling: number;
        };
        retention: {
            maxTraces: number;
            maxAge: number;
            cleanupInterval: number;
        };
        export: {
            jaeger: {
                enabled: boolean;
                endpoint: string;
            };
            zipkin: {
                enabled: boolean;
                endpoint: string;
            };
            otlp: {
                enabled: boolean;
                endpoint: string;
            };
        };
        services: {
            name: string;
            version: string;
            environment: string;
        };
    };
    cleanupTimer: NodeJS.Timeout;
    initializeTracing(): void;
    startTrace(operationName: any, options?: {}): {
        traceId: string;
        spanId: string;
        sampled: boolean;
        addTag: (key: any, value: any) => void;
        setBaggage: (key: any, value: any) => void;
        createSpan: (spanOperationName: any, spanOptions?: {}) => {
            spanId: any;
            traceId: any;
            addTag: () => void;
            addEvent: () => void;
            setStatus: () => void;
            recordException: () => void;
            finish: () => void;
        } | {
            spanId: string;
            traceId: any;
            addTag: (key: any, value: any) => void;
            addEvent: (name: any, attributes?: {}) => void;
            setStatus: (status: any, message: any) => void;
            recordException: (error: any) => void;
            finish: (options?: {}) => void;
        };
        finish: (options?: {}) => void;
    };
    createChildSpan(traceId: any, parentSpanId: any, operationName: any, options?: {}): {
        spanId: any;
        traceId: any;
        addTag: () => void;
        addEvent: () => void;
        setStatus: () => void;
        recordException: () => void;
        finish: () => void;
    } | {
        spanId: string;
        traceId: any;
        addTag: (key: any, value: any) => void;
        addEvent: (name: any, attributes?: {}) => void;
        setStatus: (status: any, message: any) => void;
        recordException: (error: any) => void;
        finish: (options?: {}) => void;
    };
    createSpan(options: any): {
        spanId: any;
        traceId: any;
        parentSpanId: any;
        operationName: any;
        startTime: any;
        endTime: any;
        duration: any;
        tags: any;
        events: any[];
        status: {
            code: string;
            message: string;
        };
        sampled: any;
        finished: boolean;
    };
    createNoOpSpan(spanId: any): {
        spanId: any;
        traceId: any;
        addTag: () => void;
        addEvent: () => void;
        setStatus: () => void;
        recordException: () => void;
        finish: () => void;
    };
    addTraceTag(traceId: any, key: any, value: any): void;
    setTraceBaggage(traceId: any, key: any, value: any): void;
    addSpanTag(spanId: any, key: any, value: any): void;
    addSpanEvent(spanId: any, name: any, attributes?: {}): void;
    setSpanStatus(spanId: any, code: any, message?: string): void;
    recordSpanException(spanId: any, error: any): void;
    finishSpan(spanId: any, options?: {}): void;
    finishTrace(traceId: any, options?: {}): void;
    getExpressMiddleware(): (req: any, res: any, next: any) => void;
    traceDatabaseQuery(query: any, params: any, options?: {}): any;
    traceHttpClient(url: any, options?: {}): any;
    traceMessageProducer(topic: any, message: any, options?: {}): any;
    shouldSample(options?: {}): boolean;
    updateServiceMap(operationName: any, parentSpanId: any): void;
    extractOperation(query: any): any;
    generateTraceId(): string;
    generateSpanId(): string;
    exportTrace(trace: any): Promise<void>;
    exportToJaeger(trace: any): Promise<void>;
    exportToZipkin(trace: any): Promise<void>;
    exportToOTLP(trace: any): Promise<void>;
    initializeExporters(): void;
    startCleanupTimer(): void;
    cleanupOldTraces(): void;
    getTracingStats(): {
        timestamp: number;
        traces: {
            total: number;
            active: number;
            finished: number;
            inMemory: number;
        };
        spans: {
            total: number;
            errors: number;
            slow: number;
            inMemory: number;
        };
        operations: any;
        serviceMap: any;
        sampling: {
            rate: number;
            slowThreshold: number;
        };
    };
    generateReport(): Promise<string>;
    shutdown(): void;
}
export function initializeTracing(config?: {}): any;
export function getTracer(): any;
