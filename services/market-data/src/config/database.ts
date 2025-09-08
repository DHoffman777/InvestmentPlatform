import { PrismaClient } from '@prisma/client';
import { logger } from './logger';

declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma = global.__prisma || new PrismaClient({
  log: process.env.LOG_QUERIES === 'true' ? ['query', 'info', 'warn', 'error'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') {
  global.__prisma = prisma;
}

// Setup event listeners only if logging is enabled
if (process.env.LOG_QUERIES === 'true') {
  try {
    (prisma as any).$on('query', (e: any) => {
      logger.debug('Database Query', {
        query: e.query,
        params: e.params,
        duration: `${e.duration}ms`,
      });
    });
  } catch (error: any) {
    // Ignore if event listener setup fails
    logger.warn('Could not setup query logging:', error);
  }
}

export { prisma };
export default prisma;
