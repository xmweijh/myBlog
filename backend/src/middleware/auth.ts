import { Request, Response, NextFunction } from 'express';
import { verifyToken, extractTokenFromHeader } from '../utils/jwt';
import { JwtPayload, Role } from '../types/database';
import { db } from '../utils/database';
// 扩展 Express Request 类型以包含用户信息
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

/**
 * 认证中间件 - 验证JWT令牌
 */
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证令牌
    const payload = verifyToken(token);

    // 验证用户是否存在且处于活跃状态
    const client = db.getClient();
    const user = await client.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: '账号已被禁用',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 将用户信息附加到请求对象
    req.user = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : '认证失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 可选认证中间件 - 如果有令牌则验证，没有则继续
 */
export async function optionalAuthenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractTokenFromHeader(req.headers.authorization);

    if (token) {
      const payload = verifyToken(token);
      const client = db.getClient();
      const user = await client.user.findUnique({
        where: { id: payload.userId },
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          isActive: true,
        },
      });

      if (user && user.isActive) {
        req.user = {
          userId: user.id,
          email: user.email,
          username: user.username,
          role: user.role as Role,
        };
      }
    }

    next();
  } catch (error) {
    // 可选认证失败时继续执行
    next();
  }
}

/**
 * 权限验证中间件工厂函数
 */
export function requireRole(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (!roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: '权限不足',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    next();
  };
}

/**
 * 管理员权限中间件
 */
export const requireAdmin = requireRole(Role.ADMIN);

/**
 * 版主或管理员权限中间件
 */
export const requireModerator = requireRole(Role.ADMIN, Role.MODERATOR);
