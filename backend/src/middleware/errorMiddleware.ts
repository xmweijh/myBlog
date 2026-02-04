/**
 * 全局错误处理中间件
 * 
 * 应该在所有其他中间件之后使用，捕获所有未处理的错误
 */

import { Request, Response, NextFunction } from 'express';
import { handleServiceError, logError } from '../utils/errorHandler';

/**
 * 全局错误处理中间件
 * 
 * 捕获所有抛出的错误并统一处理
 * 应该是最后一个中间件
 * 
 * @example
 * app.use(globalErrorHandler);
 */
export function globalErrorHandler(
  error: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // 记录错误
  logError(error, {
    method: req.method,
    path: req.path,
    ip: req.ip,
    userId: (req as any).user?.userId,
  });

  // 如果响应已经发送，直接返回
  if (res.headersSent) {
    return next(error);
  }

  // 处理错误
  handleServiceError(error, res);
}

/**
 * 404处理中间件
 * 
 * 应该在所有路由之后使用
 * 
 * @example
 * app.use(notFoundHandler);
 */
export function notFoundHandler(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  res.status(404).json({
    success: false,
    error: '请求的资源不存在',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString(),
  });
}

/**
 * 请求日志中间件
 * 
 * 记录所有请求
 * 应该在最前面使用
 */
export function requestLogger(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const start = Date.now();

  // 监听响应完成
  res.on('finish', () => {
    const duration = Date.now() - start;
    const log = {
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration: `${duration}ms`,
      timestamp: new Date().toISOString(),
    };

    // 根据状态码决定日志级别
    if (res.statusCode >= 500) {
      console.error('[ERROR]', log);
    } else if (res.statusCode >= 400) {
      console.warn('[WARN]', log);
    } else {
      console.log('[INFO]', log);
    }
  });

  next();
}
