/**
 * 异常处理工具库
 * 
 * 提供统一的错误处理机制：
 * 1. 自定义异常类
 * 2. 错误代码到HTTP状态码映射
 * 3. 错误代码到用户消息映射
 * 4. 错误日志记录
 */

import { Response } from 'express';
import { getUserFriendlyMessage } from './validators';

/**
 * 应用自定义异常类
 * 
 * 所有应用层异常都应该继承此类
 */
export class AppError extends Error {
  /**
   * @param message 错误消息（通常是错误代码）
   * @param statusCode HTTP状态码（默认500）
   * @param details 详细信息（用于日志）
   */
  constructor(
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * 验证异常
 */
export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, details);
    this.name = 'ValidationError';
  }
}

/**
 * 认证异常
 */
export class AuthenticationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 401, details);
    this.name = 'AuthenticationError';
  }
}

/**
 * 授权异常
 */
export class AuthorizationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 403, details);
    this.name = 'AuthorizationError';
  }
}

/**
 * 资源不存在异常
 */
export class NotFoundError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 404, details);
    this.name = 'NotFoundError';
  }
}

/**
 * 资源冲突异常
 */
export class ConflictError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 409, details);
    this.name = 'ConflictError';
  }
}

/**
 * 内部服务器错误
 */
export class InternalServerError extends AppError {
  constructor(message: string = 'INTERNAL_SERVER_ERROR', details?: any) {
    super(message, 500, details);
    this.name = 'InternalServerError';
  }
}

/**
 * 错误代码到HTTP状态码的映射
 * 
 * 定义了所有已知错误代码对应的HTTP状态码
 */
export const errorStatusMap: { [key: string]: number } = {
  // 认证相关（401）
  'INVALID_CREDENTIALS': 401,
  'MISSING_CREDENTIALS': 400,
  'ACCOUNT_DISABLED': 403,
  'INVALID_TOKEN': 401,
  'TOKEN_EXPIRED': 401,

  // 用户相关（400/409/404）
  'EMAIL_REQUIRED': 400,
  'INVALID_EMAIL': 400,
  'EMAIL_TOO_LONG': 400,
  'EMAIL_EXISTS': 409,
  'USERNAME_REQUIRED': 400,
  'USERNAME_TOO_SHORT': 400,
  'USERNAME_TOO_LONG': 400,
  'INVALID_USERNAME_FORMAT': 400,
  'USERNAME_EXISTS': 409,
  'USER_NOT_FOUND': 404,
  'INVALID_OLD_PASSWORD': 401,
  'PASSWORD_MISMATCH': 400,
  'WEAK_PASSWORD': 400,

  // 文章相关（400/404/409）
  'TITLE_REQUIRED': 400,
  'TITLE_TOO_SHORT': 400,
  'TITLE_TOO_LONG': 400,
  'SLUG_REQUIRED': 400,
  'SLUG_TOO_SHORT': 400,
  'SLUG_TOO_LONG': 400,
  'INVALID_SLUG_FORMAT': 400,
  'SLUG_EXISTS': 409,
  'CONTENT_REQUIRED': 400,
  'CONTENT_TOO_SHORT': 400,
  'CONTENT_TOO_LONG': 400,
  'EXCERPT_TOO_LONG': 400,
  'INVALID_URL_FORMAT': 400,
  'ARTICLE_NOT_FOUND': 404,
  'ARTICLE_FORBIDDEN': 403,

  // 分类相关（404）
  'CATEGORY_NOT_FOUND': 404,
  'CATEGORY_NAME_REQUIRED': 400,
  'CATEGORY_NAME_TOO_SHORT': 400,
  'CATEGORY_NAME_TOO_LONG': 400,

  // 标签相关（404）
  'TAG_NOT_FOUND': 404,
  'TAG_NAME_REQUIRED': 400,
  'TAG_NAME_TOO_SHORT': 400,
  'TAG_NAME_TOO_LONG': 400,

  // 评论相关（404/403）
  'COMMENT_NOT_FOUND': 404,
  'COMMENT_FORBIDDEN': 403,
  'COMMENT_CONTENT_REQUIRED': 400,
  'COMMENT_CONTENT_TOO_SHORT': 400,
  'COMMENT_CONTENT_TOO_LONG': 400,
  'PARENT_COMMENT_NOT_FOUND': 404,
  'INVALID_PARENT_COMMENT': 400,

  // 生物简介相关
  'BIO_TOO_LONG': 400,

  // 通用
  'NO_FIELDS_PROVIDED': 400,
  'INVALID_PAGINATION': 400,
  'INVALID_DATE_FORMAT': 400,
};

/**
 * 错误代码到用户消息的映射
 */
export const errorMessageMap: { [key: string]: string } = {
  'INVALID_CREDENTIALS': '邮箱或密码错误',
  'MISSING_CREDENTIALS': '邮箱和密码为必填项',
  'ACCOUNT_DISABLED': '账号已被禁用，请联系管理员',
  'INVALID_TOKEN': '令牌无效',
  'TOKEN_EXPIRED': '令牌已过期，请重新登录',

  'EMAIL_REQUIRED': '邮箱为必填项',
  'INVALID_EMAIL': '邮箱格式不正确',
  'EMAIL_TOO_LONG': '邮箱过长',
  'EMAIL_EXISTS': '该邮箱已被使用',
  'USERNAME_REQUIRED': '用户名为必填项',
  'USERNAME_TOO_SHORT': '用户名至少2个字符',
  'USERNAME_TOO_LONG': '用户名最多50个字符',
  'INVALID_USERNAME_FORMAT': '用户名只能包含字母、数字、下划线和中文',
  'USERNAME_EXISTS': '该用户名已被使用',
  'USER_NOT_FOUND': '用户不存在',
  'INVALID_OLD_PASSWORD': '旧密码错误',
  'PASSWORD_MISMATCH': '两次输入的密码不一致',
  'WEAK_PASSWORD': '密码强度不足',

  'TITLE_REQUIRED': '文章标题为必填项',
  'TITLE_TOO_SHORT': '文章标题至少3个字符',
  'TITLE_TOO_LONG': '文章标题最多200个字符',
  'SLUG_REQUIRED': '文章slug为必填项',
  'SLUG_TOO_SHORT': 'slug至少3个字符',
  'SLUG_TOO_LONG': 'slug最多100个字符',
  'INVALID_SLUG_FORMAT': 'slug只能包含小写字母、数字和连字符',
  'SLUG_EXISTS': '该slug已被使用',
  'CONTENT_REQUIRED': '文章内容为必填项',
  'CONTENT_TOO_SHORT': '文章内容至少10个字符',
  'CONTENT_TOO_LONG': '文章内容不能超过100000个字符',
  'EXCERPT_TOO_LONG': '文章摘要最多500个字符',
  'INVALID_URL_FORMAT': 'URL格式不正确',
  'ARTICLE_NOT_FOUND': '文章不存在',
  'ARTICLE_FORBIDDEN': '无权操作此文章',

  'CATEGORY_NOT_FOUND': '分类不存在',
  'CATEGORY_NAME_REQUIRED': '分类名称为必填项',
  'CATEGORY_NAME_TOO_SHORT': '分类名称至少1个字符',
  'CATEGORY_NAME_TOO_LONG': '分类名称最多50个字符',

  'TAG_NOT_FOUND': '标签不存在',
  'TAG_NAME_REQUIRED': '标签名称为必填项',
  'TAG_NAME_TOO_SHORT': '标签名称至少1个字符',
  'TAG_NAME_TOO_LONG': '标签名称最多30个字符',

  'COMMENT_NOT_FOUND': '评论不存在',
  'COMMENT_FORBIDDEN': '无权操作此评论',
  'COMMENT_CONTENT_REQUIRED': '评论内容为必填项',
  'COMMENT_CONTENT_TOO_SHORT': '评论内容至少1个字符',
  'COMMENT_CONTENT_TOO_LONG': '评论内容最多5000个字符',
  'PARENT_COMMENT_NOT_FOUND': '回复的评论不存在',
  'INVALID_PARENT_COMMENT': '该评论与文章不匹配',

  'BIO_TOO_LONG': '个人简介最多500个字符',

  'NO_FIELDS_PROVIDED': '没有提供需要更新的字段',
  'INVALID_PAGINATION': '分页参数不正确',
  'INVALID_DATE_FORMAT': '日期格式不正确',
};

/**
 * 获取HTTP状态码
 * 
 * @param errorCode 错误代码
 * @returns HTTP状态码
 */
export function getStatusCode(errorCode: string): number {
  return errorStatusMap[errorCode] || 500;
}

/**
 * 获取用户消息
 * 
 * @param errorCode 错误代码
 * @returns 用户友好的错误消息
 */
export function getUserMessage(errorCode: string): string {
  return errorMessageMap[errorCode] || '操作失败，请稍后重试';
}

/**
 * 处理服务层错误
 * 
 * 捕获服务层抛出的错误，转换为HTTP响应
 * 
 * @param error 错误对象
 * @param res Response对象
 */
export function handleServiceError(error: Error, res: Response): void {
  // 如果是已知的应用错误
  if (error instanceof AppError) {
    const statusCode = error.statusCode;
    const message = getUserMessage(error.message);

    console.error(`[${error.name}] ${error.message}:`, error.details);

    res.status(statusCode).json({
      success: false,
      error: message,
      errorCode: error.message,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 如果是普通的Error
  if (error instanceof Error) {
    const errorCode = error.message;
    const statusCode = getStatusCode(errorCode);
    const message = getUserMessage(errorCode);

    console.error(`[Error] ${errorCode}:`, error);

    res.status(statusCode).json({
      success: false,
      error: message,
      errorCode,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // 未知错误
  console.error('[Unknown Error]:', error);

  res.status(500).json({
    success: false,
    error: '服务器内部错误，请稍后重试',
    timestamp: new Date().toISOString(),
  });
}

/**
 * 异步错误处理装饰器
 * 
 * 用于包装异步路由处理器，自动捕获并处理错误
 * 
 * @param fn 异步函数
 * @returns 包装后的函数
 * 
 * @example
 * app.post('/api/articles', asyncHandler(async (req, res) => {
 *   const article = await articleService.createArticle(req.body);
 *   res.json(article);
 * }));
 */
export function asyncHandler(
  fn: (req: any, res: Response) => Promise<void>
) {
  return (req: any, res: Response, next: any) => {
    Promise.resolve(fn(req, res)).catch(error => {
      handleServiceError(error, res);
    });
  };
}

/**
 * 错误日志记录器
 * 
 * 记录详细的错误信息用于调试
 * 
 * @param error 错误对象
 * @param context 错误上下文信息
 */
export function logError(error: Error, context?: any): void {
  const timestamp = new Date().toISOString();
  const errorInfo = {
    timestamp,
    name: error.name,
    message: error.message,
    stack: error.stack,
    context,
  };

  console.error('[ERROR LOG]', JSON.stringify(errorInfo, null, 2));

  // 在生产环境可以将错误发送到外部日志服务
  // 例如：Sentry、LogRocket等
}
