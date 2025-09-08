export const __esModule: boolean;
export default getPrismaClient;
/**
 * Gets or creates a shared Prisma client instance
 * This ensures we don't create multiple database connections
 */
export function getPrismaClient(): any;
/**
 * Manually disconnect the shared Prisma client
 * Use this for graceful shutdown
 */
export function disconnectPrisma(): Promise<void>;
/**
 * Test database connection
 */
export function testDatabaseConnection(): Promise<boolean>;
