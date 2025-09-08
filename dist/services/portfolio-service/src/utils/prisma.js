"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrismaClient = getPrismaClient;
exports.disconnectPrisma = disconnectPrisma;
exports.testDatabaseConnection = testDatabaseConnection;
const client_1 = require("@prisma/client");
const logger_1 = require("./logger");
// Global Prisma client instance to prevent multiple connections
let prisma;
/**
 * Gets or creates a shared Prisma client instance
 * This ensures we don't create multiple database connections
 */
function getPrismaClient() {
    if (!prisma) {
        prisma = new client_1.PrismaClient({
            log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
        // Add connection and disconnection event handlers
        try {
            prisma.$on('beforeExit', async () => {
                logger_1.logger.info('Prisma client disconnecting...');
            });
        }
        catch (error) {
            // Event listener setup failed, continue without it
        }
        // Handle process exit to ensure clean disconnection
        process.on('beforeExit', async () => {
            await prisma.$disconnect();
        });
    }
    return prisma;
}
/**
 * Manually disconnect the shared Prisma client
 * Use this for graceful shutdown
 */
async function disconnectPrisma() {
    if (prisma) {
        await prisma.$disconnect();
        logger_1.logger.info('Prisma client disconnected');
    }
}
/**
 * Test database connection
 */
async function testDatabaseConnection() {
    try {
        const client = getPrismaClient();
        await client.$queryRaw `SELECT 1`;
        return true;
    }
    catch (error) {
        logger_1.logger.error('Database connection test failed:', error);
        return false;
    }
}
exports.default = getPrismaClient;
