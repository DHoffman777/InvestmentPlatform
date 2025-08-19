import { PrismaClient } from '@prisma/client';
/**
 * Gets or creates a shared Prisma client instance
 * This ensures we don't create multiple database connections
 */
export declare function getPrismaClient(): PrismaClient;
/**
 * Manually disconnect the shared Prisma client
 * Use this for graceful shutdown
 */
export declare function disconnectPrisma(): Promise<void>;
/**
 * Test database connection
 */
export declare function testDatabaseConnection(): Promise<boolean>;
export default getPrismaClient;
