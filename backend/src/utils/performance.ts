/**
 * 性能监测和优化工具
 * 
 * 提供：
 * 1. 性能指标收集
 * 2. 慢查询检测
 * 3. 内存监测
 * 4. 性能报告生成
 */

/**
 * 性能指标接口
 */
export interface PerformanceMetric {
  method: string;
  path: string;
  statusCode: number;
  responseTime: number;  // 毫秒
  timestamp: Date;
  userId?: string;
  errorCode?: string;
}

/**
 * 性能统计信息
 */
export interface PerformanceStats {
  totalRequests: number;
  averageResponseTime: number;
  minResponseTime: number;
  maxResponseTime: number;
  slowRequests: number; // 响应时间 > 500ms
  errorRequests: number;
  successRate: number;  // 百分比
  period: string;
}

/**
 * 性能监测类
 */
export class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 1000; // 最多保存1000条指标

  /**
   * 记录性能指标
   * 
   * @param metric 性能指标
   */
  recordMetric(metric: PerformanceMetric): void {
    this.metrics.push(metric);

    // 如果超过最大数量，删除最旧的
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
  }

  /**
   * 获取性能统计信息
   * 
   * @returns 统计信息
   */
  getStats(): PerformanceStats {
    if (this.metrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        slowRequests: 0,
        errorRequests: 0,
        successRate: 0,
        period: 'No data',
      };
    }

    const responseTimes = this.metrics.map(m => m.responseTime);
    const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / this.metrics.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const slowCount = this.metrics.filter(m => m.responseTime > 500).length;
    const errorCount = this.metrics.filter(m => m.statusCode >= 400).length;
    const successCount = this.metrics.length - errorCount;
    const successRate = (successCount / this.metrics.length) * 100;

    const oldestTime = this.metrics[0].timestamp;
    const newestTime = this.metrics[this.metrics.length - 1].timestamp;
    const period = `${oldestTime.toISOString()} - ${newestTime.toISOString()}`;

    return {
      totalRequests: this.metrics.length,
      averageResponseTime: Math.round(avgTime),
      minResponseTime: minTime,
      maxResponseTime: maxTime,
      slowRequests: slowCount,
      errorRequests: errorCount,
      successRate: Math.round(successRate * 100) / 100,
      period,
    };
  }

  /**
   * 获取API的性能统计
   * 
   * @param path 接口路径
   * @returns 统计信息
   */
  getApiStats(path: string): PerformanceStats {
    const apiMetrics = this.metrics.filter(m => m.path === path);

    if (apiMetrics.length === 0) {
      return {
        totalRequests: 0,
        averageResponseTime: 0,
        minResponseTime: 0,
        maxResponseTime: 0,
        slowRequests: 0,
        errorRequests: 0,
        successRate: 0,
        period: 'No data for this API',
      };
    }

    const responseTimes = apiMetrics.map(m => m.responseTime);
    const totalTime = responseTimes.reduce((sum, time) => sum + time, 0);
    const avgTime = totalTime / apiMetrics.length;
    const minTime = Math.min(...responseTimes);
    const maxTime = Math.max(...responseTimes);
    const slowCount = apiMetrics.filter(m => m.responseTime > 500).length;
    const errorCount = apiMetrics.filter(m => m.statusCode >= 400).length;
    const successCount = apiMetrics.length - errorCount;
    const successRate = (successCount / apiMetrics.length) * 100;

    const oldestTime = apiMetrics[0].timestamp;
    const newestTime = apiMetrics[apiMetrics.length - 1].timestamp;
    const period = `${oldestTime.toISOString()} - ${newestTime.toISOString()}`;

    return {
      totalRequests: apiMetrics.length,
      averageResponseTime: Math.round(avgTime),
      minResponseTime: minTime,
      maxResponseTime: maxTime,
      slowRequests: slowCount,
      errorRequests: errorCount,
      successRate: Math.round(successRate * 100) / 100,
      period,
    };
  }

  /**
   * 获取最慢的接口
   * 
   * @param limit 返回数量
   * @returns 最慢的接口列表
   */
  getSlowestApis(limit: number = 10): any[] {
    const apiGroups = new Map<string, PerformanceMetric[]>();

    // 按接口分组
    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!apiGroups.has(key)) {
        apiGroups.set(key, []);
      }
      apiGroups.get(key)!.push(metric);
    }

    // 计算平均响应时间
    const apis = Array.from(apiGroups.entries()).map(([key, metrics]) => {
      const times = metrics.map(m => m.responseTime);
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      const [method, path] = key.split(' ');

      return {
        method,
        path,
        averageTime: Math.round(avgTime),
        callCount: metrics.length,
        maxTime: Math.max(...times),
        minTime: Math.min(...times),
      };
    });

    // 按平均响应时间排序
    return apis.sort((a, b) => b.averageTime - a.averageTime).slice(0, limit);
  }

  /**
   * 获取错误最多的接口
   * 
   * @param limit 返回数量
   * @returns 错误最多的接口列表
   */
  getMostErrorProneApis(limit: number = 10): any[] {
    const apiGroups = new Map<string, PerformanceMetric[]>();

    for (const metric of this.metrics) {
      const key = `${metric.method} ${metric.path}`;
      if (!apiGroups.has(key)) {
        apiGroups.set(key, []);
      }
      apiGroups.get(key)!.push(metric);
    }

    const apis = Array.from(apiGroups.entries()).map(([key, metrics]) => {
      const errorCount = metrics.filter(m => m.statusCode >= 400).length;
      const errorRate = (errorCount / metrics.length) * 100;
      const [method, path] = key.split(' ');

      return {
        method,
        path,
        totalCalls: metrics.length,
        errorCount,
        errorRate: Math.round(errorRate * 100) / 100,
      };
    });

    return apis
      .filter(api => api.errorCount > 0)
      .sort((a, b) => b.errorRate - a.errorRate)
      .slice(0, limit);
  }

  /**
   * 清空所有指标
   */
  clearMetrics(): void {
    this.metrics = [];
  }

  /**
   * 获取原始指标
   * 
   * @returns 所有指标
   */
  getAllMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * 生成性能报告
   * 
   * @returns 性能报告文本
   */
  generateReport(): string {
    const stats = this.getStats();
    const slowestApis = this.getSlowestApis(5);
    const errorProneApis = this.getMostErrorProneApis(5);

    let report = '=== 性能监测报告 ===\n\n';

    report += '【总体统计】\n';
    report += `- 总请求数: ${stats.totalRequests}\n`;
    report += `- 平均响应时间: ${stats.averageResponseTime}ms\n`;
    report += `- 最快响应时间: ${stats.minResponseTime}ms\n`;
    report += `- 最慢响应时间: ${stats.maxResponseTime}ms\n`;
    report += `- 慢查询(>500ms): ${stats.slowRequests}\n`;
    report += `- 错误请求: ${stats.errorRequests}\n`;
    report += `- 成功率: ${stats.successRate}%\n`;
    report += `- 统计周期: ${stats.period}\n\n`;

    report += '【最慢的接口 Top 5】\n';
    for (const api of slowestApis) {
      report += `- ${api.method} ${api.path}: ${api.averageTime}ms (调用${api.callCount}次)\n`;
    }
    report += '\n';

    report += '【错误最多的接口 Top 5】\n';
    for (const api of errorProneApis) {
      report += `- ${api.method} ${api.path}: 错误率${api.errorRate}% (${api.errorCount}/${api.totalCalls})\n`;
    }
    report += '\n';

    return report;
  }
}

// 全局性能监测实例
export const performanceMonitor = new PerformanceMonitor();

/**
 * 内存使用监测
 */
export interface MemoryInfo {
  heapUsed: number;      // 堆内存已用（MB）
  heapTotal: number;     // 堆内存总量（MB）
  rss: number;           // 驻留集大小（MB）
  external: number;      // 外部内存（MB）
  timestamp: Date;
}

/**
 * 获取内存信息
 * 
 * @returns 内存信息
 */
export function getMemoryInfo(): MemoryInfo {
  const memoryUsage = process.memoryUsage();

  return {
    heapUsed: Math.round(memoryUsage.heapUsed / 1024 / 1024),
    heapTotal: Math.round(memoryUsage.heapTotal / 1024 / 1024),
    rss: Math.round(memoryUsage.rss / 1024 / 1024),
    external: Math.round(memoryUsage.external / 1024 / 1024),
    timestamp: new Date(),
  };
}

/**
 * 数据库查询优化建议
 */
export class QueryOptimizer {
  /**
   * 分析查询性能
   * 
   * @param query 查询描述
   * @param duration 查询耗时（ms）
   * @returns 优化建议
   */
  static analyzeQueryPerformance(query: string, duration: number): string[] {
    const suggestions: string[] = [];

    // 慢查询检测（> 100ms）
    if (duration > 100) {
      suggestions.push('⚠️ 这是一个慢查询，考虑添加索引或优化查询');
    }

    // 提示N+1问题
    if (query.includes('findMany') && query.includes('include')) {
      suggestions.push('💡 检查是否存在N+1查询问题，考虑使用select优化');
    }

    // 提示未使用索引
    if (query.includes('findMany') && !query.includes('where')) {
      suggestions.push('💡 考虑添加查询条件以减少数据库扫描');
    }

    return suggestions;
  }

  /**
   * 常见优化建议
   */
  static getOptimizationTips(): string[] {
    return [
      '1. 使用SELECT语句只查询需要的字段，不要SELECT *',
      '2. 为频繁查询的字段添加数据库索引',
      '3. 使用include和select精确控制关联数据',
      '4. 避免在循环中进行数据库查询（N+1问题）',
      '5. 对大量数据进行分页查询',
      '6. 使用缓存减少重复查询',
      '7. 对复杂查询进行分析和优化',
      '8. 使用连接池管理数据库连接',
    ];
  }
}

/**
 * 缓存管理
 */
export class CacheManager {
  private cache: Map<string, { value: any; expiresAt: number }> = new Map();

  /**
   * 设置缓存
   * 
   * @param key 缓存键
   * @param value 缓存值
   * @param ttl 生存时间（秒）
   */
  set(key: string, value: any, ttl: number = 3600): void {
    const expiresAt = Date.now() + ttl * 1000;
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * 获取缓存
   * 
   * @param key 缓存键
   * @returns 缓存值或null
   */
  get(key: string): any | null {
    const item = this.cache.get(key);

    if (!item) return null;

    // 检查是否过期
    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.value;
  }

  /**
   * 删除缓存
   * 
   * @param key 缓存键
   */
  delete(key: string): void {
    this.cache.delete(key);
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * 获取缓存大小
   * 
   * @returns 缓存项数量
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now > item.expiresAt) {
        this.cache.delete(key);
      }
    }
  }
}

// 全局缓存实例
export const cacheManager = new CacheManager();
