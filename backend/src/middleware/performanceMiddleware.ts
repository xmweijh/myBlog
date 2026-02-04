/**
 * 性能监测中间件
 * 
 * 记录所有请求的性能指标
 */

import { Request, Response, NextFunction } from 'express';
import { performanceMonitor } from '../utils/performance';

/**
 * 性能监测中间件
 * 
 * 记录每个请求的：
 * - 方法
 * - 路径
 * - 响应时间
 * - 状态码
 * - 错误代码
 * 
 * @example
 * app.use(performanceMiddleware);
 */
export function performanceMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录开始时间
  const startTime = Date.now();

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const userId = (req as any).user?.userId;

    // 尝试从响应体中获取错误代码
    let errorCode: string | undefined;
    const resBody = (res as any).locals?.body;
    if (resBody && !resBody.success && resBody.errorCode) {
      errorCode = resBody.errorCode;
    }

    // 记录性能指标
    performanceMonitor.recordMetric({
      method: req.method,
      path: req.path,
      statusCode: res.statusCode,
      responseTime: duration,
      timestamp: new Date(),
      userId,
      errorCode,
    });

    // 如果响应时间过长，记录警告
    if (duration > 1000) {
      console.warn(
        `[SLOW QUERY] ${req.method} ${req.path} took ${duration}ms (status: ${res.statusCode})`
      );
    }
  });

  next();
}

/**
 * 性能统计中间件
 * 
 * 提供实时的性能统计信息
 * 可通过 GET /api/debug/performance 获取
 */
export function performanceStatsMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 将性能监测器挂载到req对象上
  (req as any).performanceMonitor = performanceMonitor;
  next();
}
