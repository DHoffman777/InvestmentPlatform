"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
const prisma = global.__prisma || new client_1.PrismaClient({
    log: [
        {
            emit: 'event',
            level: 'query',
        },
        {
            emit: 'event',
            level: 'error',
        },
        {
            emit: 'event',
            level: 'info',
        },
        {
            emit: 'event',
            level: 'warn',
        },
    ],
});
exports.prisma = prisma;
if (process.env.NODE_ENV !== 'production') {
    global.__prisma = prisma;
}
prisma.$on('query', (e) => {
    if (process.env.LOG_QUERIES === 'true') {
        logger_1.logger.debug('Database Query', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
        });
    }
});
prisma.$on('error', (e) => {
    logger_1.logger.error('Database Error', e);
});
prisma.$on('info', (e) => {
    logger_1.logger.info('Database Info', e);
});
prisma.$on('warn', (e) => {
    logger_1.logger.warn('Database Warning', e);
});
exports.default = prisma;
//# sourceMappingURL=database.js.map