import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

let _prismaInstance: PrismaClient | null = null;

function getPrismaInstance(): PrismaClient {
  if (globalForPrisma.prisma) {
    return globalForPrisma.prisma;
  }

  _prismaInstance = new PrismaClient({
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = _prismaInstance;
  }

  return _prismaInstance;
}

export const prisma = new Proxy({} as PrismaClient, {
  get: function (_target, prop) {
    return (getPrismaInstance() as any)[prop as keyof PrismaClient];
  },
});

export default prisma;
