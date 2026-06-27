import { PrismaClient } from '@prisma/client';

export class BaseService {
  protected prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  protected async withTransaction<T>(fn: (tx: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>) => Promise<T>): Promise<T> {
    return this.prisma.$transaction(fn);
  }

  protected getCurrentYear(): number {
    return new Date().getFullYear();
  }

  protected getCurrentMonth(): number {
    return new Date().getMonth() + 1;
  }
}
