import { PrismaClient } from '@prisma/client';
import { withAccelerate } from '@prisma/extension-accelerate';

// Singleton pattern for Prisma Client
const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
  
  // Only apply Accelerate extension if using accelerate connection string
  if (process.env.PORTFOLIO_INTELLIGENCE_PRISMA_DATABASE_URL?.includes('prisma+postgres://')) {
    return client.$extends(withAccelerate());
  }
  
  return client;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// Check if database is configured
export const isDatabaseConfigured = () => {
  return !!process.env.DATABASE_URL && process.env.DATABASE_URL !== 'postgresql://user:password@localhost:5432/portfolio_intelligence?schema=public';
};

export default prisma;
