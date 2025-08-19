"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const dotenv_1 = __importDefault(require("dotenv"));
const logger_1 = require("./config/logger");
const redis_1 = require("./config/redis");
const database_1 = require("./config/database");
const errorHandler_1 = require("./middleware/errorHandler");
// Import routes
const quotes_1 = require("./routes/quotes");
const historical_1 = require("./routes/historical");
const securities_1 = require("./routes/securities");
const equities_1 = require("./routes/equities");
const funds_1 = require("./routes/funds");
const reits_1 = require("./routes/reits");
const cash_1 = require("./routes/cash");
const corporateActions_1 = require("./routes/corporateActions");
const health_1 = require("./routes/health");
// Load environment variables
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3002;
// Security middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
        },
    },
    hsts: {
        maxAge: 31536000,
        includeSubDomains: true,
        preload: true,
    },
}));
// CORS configuration
app.use((0, cors_1.default)({
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
// Request parsing middleware
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
// Logging middleware
app.use((0, morgan_1.default)('combined', {
    stream: {
        write: (message) => logger_1.logger.info(message.trim())
    }
}));
// Request ID middleware
app.use((req, res, next) => {
    const requestId = req.headers['x-request-id'] ||
        Math.random().toString(36).substring(2, 15);
    req.headers['x-request-id'] = requestId;
    res.setHeader('x-request-id', requestId);
    next();
});
// Request logging
app.use((req, res, next) => {
    logger_1.logger.info('Request received', {
        method: req.method,
        path: req.path,
        query: req.query,
        userAgent: req.get('User-Agent'),
        ip: req.ip,
        requestId: req.headers['x-request-id'],
    });
    next();
});
// Routes
app.use('/health', health_1.healthRouter);
app.use('/api/quotes', quotes_1.quotesRouter);
app.use('/api/historical', historical_1.historicalRouter);
app.use('/api/securities', securities_1.securitiesRouter);
app.use('/api/equities', equities_1.equitiesRouter);
app.use('/api/funds', funds_1.fundsRouter);
app.use('/api/reits', reits_1.reitsRouter);
app.use('/api/cash', cash_1.cashRouter);
app.use('/api/corporate-actions', corporateActions_1.corporateActionsRouter);
// Metrics endpoint
app.get('/metrics', async (req, res) => {
    try {
        const { register } = await Promise.resolve().then(() => __importStar(require('./middleware/metrics')));
        res.set('Content-Type', register.contentType);
        const metrics = await register.metrics();
        res.send(metrics);
    }
    catch (error) {
        logger_1.logger.error('Error generating metrics:', error);
        res.status(500).send('Error generating metrics');
    }
});
// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'market-data-service',
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        timestamp: new Date().toISOString(),
        endpoints: {
            health: '/health',
            quotes: '/api/quotes',
            historical: '/api/historical',
            securities: '/api/securities',
            equities: '/api/equities',
            funds: '/api/funds',
            reits: '/api/reits',
            cash: '/api/cash',
            corporateActions: '/api/corporate-actions',
            metrics: '/metrics',
        }
    });
});
// Error handling
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// Graceful shutdown handler
const gracefulShutdown = async (signal) => {
    logger_1.logger.info(`Received ${signal}, shutting down gracefully...`);
    // Close server
    server.close(() => {
        logger_1.logger.info('HTTP server closed');
    });
    // Close database connection
    try {
        await database_1.prisma.$disconnect();
        logger_1.logger.info('Database connection closed');
    }
    catch (error) {
        logger_1.logger.error('Error closing database connection:', error);
    }
    // Close Redis connection
    try {
        const { closeRedis } = await Promise.resolve().then(() => __importStar(require('./config/redis')));
        await closeRedis();
    }
    catch (error) {
        logger_1.logger.error('Error closing Redis connection:', error);
    }
    process.exit(0);
};
// Initialize server
const startServer = async () => {
    try {
        // Initialize Redis
        logger_1.logger.info('Initializing Redis connection...');
        await (0, redis_1.initializeRedis)();
        // Test database connection
        logger_1.logger.info('Testing database connection...');
        await database_1.prisma.$connect();
        logger_1.logger.info('Database connected successfully');
        // Start server
        const server = app.listen(PORT, () => {
            logger_1.logger.info(`Market Data Service started successfully`, {
                port: PORT,
                environment: process.env.NODE_ENV || 'development',
                nodeVersion: process.version,
                pid: process.pid,
            });
        });
        // Setup graceful shutdown
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        return server;
    }
    catch (error) {
        logger_1.logger.error('Failed to start server:', error);
        process.exit(1);
    }
};
// Start the server
const server = startServer();
exports.default = app;
