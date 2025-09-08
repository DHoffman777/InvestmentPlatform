import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

// Global Prisma client instance to prevent multiple connections
let prisma: PrismaClient;

/**
 * Gets or creates a shared Prisma client instance
 * This ensures we don't create multiple database connections
 */
export function getPrismaClient(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient({
      log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
    });

    // Add connection and disconnection event handlers
    try {
      (prisma as any).$on('beforeExit', async () => {
        logger.info('Prisma client disconnecting...');
      });
    } catch (error: any) {
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
export async function disconnectPrisma(): Promise<any> {
  if (prisma) {
    await prisma.$disconnect();
    logger.info('Prisma client disconnected');
  }
}

/**
 * Test database connection
 */
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    const client = getPrismaClient();
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error: any) {
    logger.error('Database connection test failed:', error);
    return false;
  }
}

export default getPrismaClient;

