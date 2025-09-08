"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prisma = global.__prisma || new client_1.PrismaClient({
    log: process.env.LOG_QUERIES === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
});
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}
// Setup event listeners only if logging is enabled
if (process.env.LOG_QUERIES === 'true') {
    try {
        prisma.$on('query', (e) => {
            logger_1.logger.debug('Database Query', {
                query: e.query,
                params: e.params,
                duration: `${e.duration}ms`,
            });
        });
    }
    catch (error) {
        // Ignore if event listener setup fails
        logger_1.logger.warn('Could not setup query logging:', error);
    }
}
exports.default = prisma;
//# sourceMappingURL=database.js.map