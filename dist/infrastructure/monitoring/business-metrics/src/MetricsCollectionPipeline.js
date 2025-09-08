"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MetricsCollectionPipeline = void 0;
const events_1 = require("events");
const BusinessMetricsDataModel_1 = require("./BusinessMetricsDataModel");
class MetricsCollectionPipeline extends events_1.EventEmitter {
    jobs = new Map();
    activeJobs = new Set();
    config;
    dataSources = new Map();
    metricDefinitions = new Map();
    calculations = new Map();
    collectionResults = new Map();
    deadLetterQueue = [];
    rateLimiters = new Map();
    constructor(config) {
        super();
        this.config = config;
        this.startScheduler();
    }
    async registerDataSource(dataSource) {
        try {
            await this.validateDataSourceConnection(dataSource);
            this.dataSources.set(dataSource.id, dataSource);
            if (dataSource.rateLimit) {
                this.rateLimiters.set(dataSource.id, new RateLimiter(dataSource.rateLimit));
            }
            this.emit('dataSourceRegistered', { dataSourceId: dataSource.id });
        }
        catch (error) {
            this.emit('dataSourceRegistrationFailed', {
                dataSourceId: dataSource.id,
                error: error instanceof Error ? error.message : 'Unknown error'
            });
            throw error;
        }
    }
    async registerMetricDefinition(metric) {
        this.metricDefinitions.set(metric.id, metric);
        this.emit('metricDefinitionRegistered', { metricId: metric.id });
    }
    async createCollectionJob(job) {
        const dataSource = this.dataSources.get(job.dataSource.id);
        if (!dataSource) {
            throw new Error(`Data source ${job.dataSource.id} not found`);
        }
        const metric = this.metricDefinitions.get(job.metricId);
        if (!metric) {
            throw new Error(`Metric definition ${job.metricId} not found`);
        }
        job.nextRun = this.calculateNextRun(job.schedule);
        this.jobs.set(job.id, job);
        this.emit('collectionJobCreated', { jobId: job.id, metricId: job.metricId });
    }
    async executeJob(jobId) {
        const job = this.jobs.get(jobId);
        if (!job) {
            throw new Error(`Job ${jobId} not found`);
        }
        if (this.activeJobs.has(jobId)) {
            throw new Error(`Job ${jobId} is already running`);
        }
        const result = {
            jobId,
            metricId: job.metricId,
            success: false,
            recordsProcessed: 0,
            recordsInserted: 0,
            recordsSkipped: 0,
            recordsErrored: 0,
            startTime: new Date(),
            endTime: new Date(),
            duration: 0,
            errors: [],
            warnings: [],
            dataQualityScore: 0
        };
        try {
            this.activeJobs.add(jobId);
            job.status = 'running';
            job.lastRun = new Date();
            this.emit('jobStarted', { jobId, metricId: job.metricId });
            const rawData = await this.collectData(job);
            const transformedData = await this.transformData(rawData, job.transformations);
            const validatedData = await this.validateData(transformedData, job.validations);
            const metricValues = await this.convertToMetricValues(validatedData, job.metricId);
            result.recordsProcessed = rawData.length;
            result.recordsInserted = await this.storeMetricValues(metricValues);
            result.recordsSkipped = transformedData.skipped || 0;
            result.recordsErrored = transformedData.errors || 0;
            result.dataQualityScore = this.calculateDataQualityScore(result);
            job.status = 'completed';
            job.errorCount = 0;
            job.nextRun = this.calculateNextRun(job.schedule);
            result.success = true;
            this.emit('jobCompleted', { jobId, result });
        }
        catch (error) {
            job.status = 'failed';
            job.errorCount++;
            job.lastError = error instanceof Error ? error.message : 'Unknown error';
            result.errors.push({
                type: 'execution',
                message: error instanceof Error ? error.message : 'Unknown error',
                timestamp: new Date(),
                isRetryable: this.isRetryableError(error)
            });
            if (job.errorCount >= this.config.maxRetries) {
                if (this.config.deadLetterQueueEnabled) {
                    this.deadLetterQueue.push(job);
                }
                job.isEnabled = false;
            }
            this.emit('jobFailed', { jobId, error: error instanceof Error ? error.message : 'Unknown error', result });
            throw error;
        }
        finally {
            result.endTime = new Date();
            result.duration = result.endTime.getTime() - result.startTime.getTime();
            this.activeJobs.delete(jobId);
            this.storeCollectionResult(result);
        }
        return result;
    }
    async collectData(job) {
        const dataSource = this.dataSources.get(job.dataSource.id);
        if (!dataSource) {
            throw new Error(`Data source ${job.dataSource.id} not found`);
        }
        const rateLimiter = this.rateLimiters.get(dataSource.id);
        if (rateLimiter && !await rateLimiter.canMakeRequest()) {
            throw new Error('Rate limit exceeded for data source');
        }
        switch (dataSource.type) {
            case 'database':
                return await this.collectFromDatabase(dataSource, job);
            case 'api':
                return await this.collectFromAPI(dataSource, job);
            case 'file':
                return await this.collectFromFile(dataSource, job);
            case 'stream':
                return await this.collectFromStream(dataSource, job);
            case 'webhook':
                return await this.collectFromWebhook(dataSource, job);
            default:
                throw new Error(`Unsupported data source type: ${dataSource.type}`);
        }
    }
    async collectFromDatabase(dataSource, job) {
        return [];
    }
    async collectFromAPI(dataSource, job) {
        const url = this.buildAPIUrl(dataSource, job);
        const headers = await this.buildAPIHeaders(dataSource);
        try {
            const response = await fetch(url, { headers });
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            return Array.isArray(data) ? data : [data];
        }
        catch (error) {
            throw new Error(`Failed to collect from API: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    async collectFromFile(dataSource, job) {
        return [];
    }
    async collectFromStream(dataSource, job) {
        return [];
    }
    async collectFromWebhook(dataSource, job) {
        return [];
    }
    async transformData(data, transformations) {
        let result = data;
        let skipped = 0;
        let errors = 0;
        for (const transformation of transformations.sort((a, b) => a.order - b.order)) {
            try {
                switch (transformation.type) {
                    case 'map':
                        result = this.mapTransformation(result, transformation.configuration);
                        break;
                    case 'filter':
                        const filtered = this.filterTransformation(result, transformation.configuration);
                        skipped += result.length - filtered.length;
                        result = filtered;
                        break;
                    case 'aggregate':
                        result = this.aggregateTransformation(result, transformation.configuration);
                        break;
                    case 'calculate':
                        result = this.calculateTransformation(result, transformation.configuration);
                        break;
                    default:
                        throw new Error(`Unsupported transformation type: ${transformation.type}`);
                }
            }
            catch (error) {
                errors++;
                this.emit('transformationError', {
                    transformation: transformation.type,
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
            }
        }
        return { data: result, skipped, errors };
    }
    mapTransformation(data, config) {
        const mapping = config.mapping || {};
        return data.map(item => {
            const mapped = {};
            Object.entries(mapping).forEach(([targetField, sourceField]) => {
                mapped[targetField] = this.getNestedValue(item, sourceField);
            });
            return mapped;
        });
    }
    filterTransformation(data, config) {
        const conditions = config.conditions || [];
        return data.filter((item) => {
            return conditions.every((condition) => {
                const value = this.getNestedValue(item, condition.field);
                return this.evaluateCondition(value, condition.operator, condition.value);
            });
        });
    }
    aggregateTransformation(data, config) {
        const groupBy = config.groupBy || [];
        const aggregations = config.aggregations || [];
        const groups = new Map();
        data.forEach(item => {
            const key = groupBy.map((field) => this.getNestedValue(item, field)).join('|');
            if (!groups.has(key)) {
                groups.set(key, []);
            }
            groups.get(key).push(item);
        });
        return Array.from(groups.entries()).map(([key, items]) => {
            const result = {};
            groupBy.forEach((field, index) => {
                result[field] = key.split('|')[index];
            });
            aggregations.forEach((agg) => {
                const values = items.map((item) => this.getNestedValue(item, agg.field));
                result[agg.alias || `${agg.method}_${agg.field}`] = this.calculateAggregation(values, agg.method);
            });
            return result;
        });
    }
    calculateTransformation(data, config) {
        const formula = config.formula;
        const resultField = config.resultField;
        return data.map(item => {
            try {
                const result = this.evaluateFormula(formula, item);
                return { ...item, [resultField]: result };
            }
            catch (error) {
                return item;
            }
        });
    }
    async validateData(data, validations) {
        if (!data.data || !Array.isArray(data.data)) {
            return [];
        }
        return data.data.filter((item) => {
            return validations.every(validation => {
                try {
                    return this.executeValidation(item, validation);
                }
                catch (error) {
                    this.emit('validationError', {
                        validation: validation.type,
                        error: error instanceof Error ? error.message : 'Unknown error',
                        item
                    });
                    return validation.errorAction !== 'fail';
                }
            });
        });
    }
    executeValidation(item, validation) {
        switch (validation.type) {
            case 'range':
                const value = this.getNestedValue(item, validation.configuration.field);
                const min = validation.configuration.min;
                const max = validation.configuration.max;
                return (min === undefined || value >= min) && (max === undefined || value <= max);
            case 'comparison':
                const leftValue = this.getNestedValue(item, validation.configuration.leftField);
                const rightValue = this.getNestedValue(item, validation.configuration.rightField);
                return this.evaluateCondition(leftValue, validation.configuration.operator, rightValue);
            case 'trend':
                return true;
            case 'custom':
                return this.evaluateFormula(validation.configuration.formula, item);
            default:
                return true;
        }
    }
    async convertToMetricValues(data, metricId) {
        const metric = this.metricDefinitions.get(metricId);
        if (!metric) {
            throw new Error(`Metric definition ${metricId} not found`);
        }
        return data.map((item, index) => ({
            id: `${metricId}_${Date.now()}_${index}`,
            metricId,
            tenantId: metric.tenantId,
            timestamp: this.extractTimestamp(item) || new Date(),
            value: this.extractValue(item, metric),
            dimensions: this.extractDimensions(item, metric.dimensions),
            tags: { ...metric.tags, source: 'pipeline' },
            aggregationPeriod: metric.defaultTimeInterval,
            dataQuality: this.calculateItemDataQuality(item),
            source: 'collection_pipeline',
            createdAt: new Date()
        }));
    }
    async storeMetricValues(values) {
        try {
            const batches = this.createBatches(values, this.config.batchSize);
            let totalInserted = 0;
            for (const batch of batches) {
                totalInserted += batch.length;
                this.emit('metricValuesBatch', { count: batch.length, values: batch });
            }
            return totalInserted;
        }
        catch (error) {
            this.emit('storageError', { error: error instanceof Error ? error.message : 'Unknown error', count: values.length });
            throw error;
        }
    }
    createBatches(items, batchSize) {
        const batches = [];
        for (let i = 0; i < items.length; i += batchSize) {
            batches.push(items.slice(i, i + batchSize));
        }
        return batches;
    }
    calculateDataQualityScore(result) {
        const totalRecords = result.recordsProcessed;
        if (totalRecords === 0)
            return 0;
        const successRate = (result.recordsInserted + result.recordsSkipped) / totalRecords;
        const errorRate = result.recordsErrored / totalRecords;
        return Math.max(0, Math.min(100, (successRate * 100) - (errorRate * 50)));
    }
    calculateItemDataQuality(item) {
        const fields = Object.keys(item);
        const nonNullFields = fields.filter(field => item[field] !== null && item[field] !== undefined);
        return Math.round((nonNullFields.length / fields.length) * 100);
    }
    extractTimestamp(item) {
        const timestampFields = ['timestamp', 'created_at', 'date', 'time'];
        for (const field of timestampFields) {
            if (item[field]) {
                const date = new Date(item[field]);
                if (!isNaN(date.getTime())) {
                    return date;
                }
            }
        }
        return null;
    }
    extractValue(item, metric) {
        const valueField = metric.sourceColumn || 'value';
        const value = this.getNestedValue(item, valueField);
        if (typeof value === 'number') {
            return value;
        }
        if (typeof value === 'string') {
            const parsed = parseFloat(value);
            if (!isNaN(parsed)) {
                return parsed;
            }
        }
        return 0;
    }
    extractDimensions(item, dimensionFields) {
        const dimensions = {};
        dimensionFields.forEach(field => {
            const value = this.getNestedValue(item, field);
            dimensions[field] = String(value || '');
        });
        return dimensions;
    }
    getNestedValue(obj, path) {
        return path.split('.').reduce((current, key) => current?.[key], obj);
    }
    evaluateCondition(leftValue, operator, rightValue) {
        switch (operator) {
            case 'eq': return leftValue === rightValue;
            case 'ne': return leftValue !== rightValue;
            case 'gt': return leftValue > rightValue;
            case 'gte': return leftValue >= rightValue;
            case 'lt': return leftValue < rightValue;
            case 'lte': return leftValue <= rightValue;
            case 'contains': return String(leftValue).includes(String(rightValue));
            case 'startsWith': return String(leftValue).startsWith(String(rightValue));
            case 'endsWith': return String(leftValue).endsWith(String(rightValue));
            default: return false;
        }
    }
    calculateAggregation(values, method) {
        if (values.length === 0)
            return 0;
        switch (method) {
            case BusinessMetricsDataModel_1.AggregationMethod.SUM:
                return values.reduce((sum, val) => sum + val, 0);
            case BusinessMetricsDataModel_1.AggregationMethod.AVERAGE:
                return values.reduce((sum, val) => sum + val, 0) / values.length;
            case BusinessMetricsDataModel_1.AggregationMethod.MIN:
                return Math.min(...values);
            case BusinessMetricsDataModel_1.AggregationMethod.MAX:
                return Math.max(...values);
            case BusinessMetricsDataModel_1.AggregationMethod.COUNT:
                return values.length;
            case BusinessMetricsDataModel_1.AggregationMethod.DISTINCT_COUNT:
                return new Set(values).size;
            default:
                return values[0] || 0;
        }
    }
    evaluateFormula(formula, context) {
        try {
            const func = new Function(...Object.keys(context), `return ${formula}`);
            return func(...Object.values(context));
        }
        catch (error) {
            throw new Error(`Formula evaluation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildAPIUrl(dataSource, job) {
        let url = dataSource.connectionConfig.baseUrl || '';
        if (job.query) {
            url += job.query;
        }
        if (job.parameters && Object.keys(job.parameters).length > 0) {
            const params = new URLSearchParams();
            Object.entries(job.parameters).forEach(([key, value]) => {
                params.append(key, String(value));
            });
            url += `?${params.toString()}`;
        }
        return url;
    }
    async buildAPIHeaders(dataSource) {
        const headers = {
            'Content-Type': 'application/json',
            'User-Agent': 'InvestmentPlatform/1.0'
        };
        if (dataSource.authentication) {
            switch (dataSource.authentication.type) {
                case 'bearer':
                    headers['Authorization'] = `Bearer ${dataSource.authentication.credentials.token}`;
                    break;
                case 'api_key':
                    headers[dataSource.authentication.credentials.headerName] = dataSource.authentication.credentials.apiKey;
                    break;
                case 'basic':
                    const credentials = btoa(`${dataSource.authentication.credentials.username}:${dataSource.authentication.credentials.password}`);
                    headers['Authorization'] = `Basic ${credentials}`;
                    break;
            }
        }
        return headers;
    }
    async validateDataSourceConnection(dataSource) {
        switch (dataSource.type) {
            case 'api':
                const testUrl = dataSource.connectionConfig.healthCheckUrl || dataSource.connectionConfig.baseUrl;
                if (testUrl) {
                    const response = await fetch(testUrl);
                    if (!response.ok) {
                        throw new Error(`API health check failed: ${response.status}`);
                    }
                }
                break;
            default:
                break;
        }
    }
    calculateNextRun(schedule) {
        const now = new Date();
        now.setMinutes(now.getMinutes() + 5);
        return now;
    }
    isRetryableError(error) {
        const retryableErrors = ['ECONNRESET', 'ETIMEDOUT', 'ENOTFOUND', 'EAI_AGAIN'];
        return retryableErrors.some(code => error.code === code || error instanceof Error ? error.message : 'Unknown error'.includes(code));
    }
    storeCollectionResult(result) {
        if (!this.collectionResults.has(result.jobId)) {
            this.collectionResults.set(result.jobId, []);
        }
        const results = this.collectionResults.get(result.jobId);
        results.push(result);
        if (results.length > 100) {
            results.shift();
        }
    }
    startScheduler() {
        setInterval(() => {
            this.processScheduledJobs();
        }, 60000);
    }
    async processScheduledJobs() {
        const now = new Date();
        for (const [jobId, job] of this.jobs) {
            if (job.isEnabled &&
                job.status !== 'running' &&
                job.nextRun &&
                job.nextRun <= now) {
                try {
                    await this.executeJob(jobId);
                }
                catch (error) {
                    this.emit('scheduledJobError', { jobId, error: error instanceof Error ? error.message : 'Unknown error' });
                }
            }
        }
    }
    getJobStatus(jobId) {
        return this.jobs.get(jobId) || null;
    }
    getJobResults(jobId, limit = 10) {
        const results = this.collectionResults.get(jobId) || [];
        return results.slice(-limit);
    }
    getActiveJobs() {
        return Array.from(this.activeJobs);
    }
    getDeadLetterQueue() {
        return [...this.deadLetterQueue];
    }
}
exports.MetricsCollectionPipeline = MetricsCollectionPipeline;
class RateLimiter {
    requests = [];
    config;
    constructor(config) {
        this.config = config;
    }
    async canMakeRequest() {
        const now = new Date();
        this.requests = this.requests.filter(timestamp => now.getTime() - timestamp.getTime() < 60000);
        if (this.requests.length >= this.config.requestsPerMinute) {
            return false;
        }
        const recentRequests = this.requests.filter(timestamp => now.getTime() - timestamp.getTime() < 1000);
        if (recentRequests.length >= this.config.requestsPerSecond) {
            return false;
        }
        this.requests.push(now);
        return true;
    }
}
