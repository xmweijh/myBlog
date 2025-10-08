import { PrismaClient } from '@prisma/client';

// 创建全局 Prisma 客户端实例
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// 创建 Prisma 客户端
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

// 在开发环境中缓存 Prisma 客户端，避免热重载时重复创建
if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

// 数据库连接管理类
export class DatabaseManager {
  private static instance: DatabaseManager;
  private client: PrismaClient;

  private constructor() {
    this.client = prisma;
  }

  public static getInstance(): DatabaseManager {
    if (!DatabaseManager.instance) {
      DatabaseManager.instance = new DatabaseManager();
    }
    return DatabaseManager.instance;
  }

  public getClient(): PrismaClient {
    return this.client;
  }

  // 测试数据库连接
  public async testConnection(): Promise<boolean> {
    try {
      await this.client.$connect();
      await this.client.$queryRaw`SELECT 1`;
      console.log('✅ 数据库连接成功');
      return true;
    } catch (error) {
      console.error('❌ 数据库连接失败:', error);
      return false;
    }
  }

  // 断开数据库连接
  public async disconnect(): Promise<void> {
    try {
      await this.client.$disconnect();
      console.log('✅ 数据库连接已断开');
    } catch (error) {
      console.error('❌ 断开数据库连接时出错:', error);
    }
  }

  // 清理数据库（仅开发环境）
  public async cleanDatabase(): Promise<void> {
    if (process.env.NODE_ENV !== 'development') {
      throw new Error('清理数据库操作仅允许在开发环境中执行');
    }

    const tablenames = await this.client.$queryRaw<Array<{ tablename: string }>>`
      SELECT tablename FROM pg_tables WHERE schemaname='public'
    `;

    for (const { tablename } of tablenames) {
      if (tablename !== '_prisma_migrations') {
        try {
          await this.client.$executeRawUnsafe(`TRUNCATE TABLE "public"."${tablename}" CASCADE;`);
        } catch (error) {
          console.log(`无法清空表 ${tablename}:`, error);
        }
      }
    }

    console.log('✅ 数据库已清理');
  }
}

// 导出数据库管理器实例
export const db = DatabaseManager.getInstance();

// 优雅关闭处理
process.on('beforeExit', async () => {
  await db.disconnect();
});

process.on('SIGINT', async () => {
  await db.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await db.disconnect();
  process.exit(0);
});
