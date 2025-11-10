import { Request, Response } from 'express';
import { db } from '../utils/database';
import { hashPassword, verifyPassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { CreateUserInput, LoginInput, Role, SafeUser } from '../types/database';
/**
 * 用户注册
 */
export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { email, username, password, avatar, bio }: CreateUserInput = req.body;

    // 验证必填字段
    if (!email || !username || !password) {
      res.status(400).json({
        success: false,
        error: '邮箱、用户名和密码为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      res.status(400).json({
        success: false,
        error: '邮箱格式不正确',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证用户名长度
    if (username.length < 3 || username.length > 20) {
      res.status(400).json({
        success: false,
        error: '用户名长度必须在3-20个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证密码长度
    if (password.length < 6) {
      res.status(400).json({
        success: false,
        error: '密码长度至少为6个字符',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 检查邮箱是否已存在
    const existingEmail = await client.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      res.status(409).json({
        success: false,
        error: '该邮箱已被注册',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查用户名是否已存在
    const existingUsername = await client.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      res.status(409).json({
        success: false,
        error: '该用户名已被使用',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 加密密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await client.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(username)}&background=random`,
        bio: bio || '',
        role: Role.USER,
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
    });

    res.status(201).json({
      success: true,
      data: {
        user,
        token,
      },
      message: '注册成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      success: false,
      error: '注册失败，请稍后重试',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 用户登录
 */
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginInput = req.body;

    // 验证必填字段
    if (!email || !password) {
      res.status(400).json({
        success: false,
        error: '邮箱和密码为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 查找用户
    const user = await client.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '邮箱或密码错误',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查账号是否被禁用
    if (!user.isActive) {
      res.status(403).json({
        success: false,
        error: '账号已被禁用，请联系管理员',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: {
        user: safeUser,
        token,
      },
      message: '登录成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      success: false,
      error: '登录失败，请稍后重试',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户信息失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 更新用户资料
 */
export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { username, avatar, bio } = req.body;

    // 验证用户名长度
    if (username && (username.length < 3 || username.length > 20)) {
      res.status(400).json({
        success: false,
        error: '用户名长度必须在3-20个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 如果更新用户名，检查是否已被使用
    if (username) {
      const existingUser = await client.user.findFirst({
        where: {
          username,
          NOT: {
            id: req.user.userId,
          },
        },
      });

      if (existingUser) {
        res.status(409).json({
          success: false,
          error: '该用户名已被使用',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 更新用户资料
    const updatedUser = await client.user.update({
      where: { id: req.user.userId },
      data: {
        ...(username && { username }),
        ...(avatar && { avatar }),
        ...(bio !== undefined && { bio }),
      },
      select: {
        id: true,
        email: true,
        username: true,
        avatar: true,
        bio: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      success: true,
      data: updatedUser,
      message: '资料更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新资料失败:', error);
    res.status(500).json({
      success: false,
      error: '更新资料失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 修改密码
 */
export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    // 验证必填字段
    if (!currentPassword || !newPassword) {
      res.status(400).json({
        success: false,
        error: '当前密码和新密码为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证新密码长度
    if (newPassword.length < 6) {
      res.status(400).json({
        success: false,
        error: '新密码长度至少为6个字符',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 获取用户当前密码
    const user = await client.user.findUnique({
      where: { id: req.user.userId },
      select: { password: true },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证当前密码
    const isPasswordValid = await verifyPassword(currentPassword, user.password);

    if (!isPasswordValid) {
      res.status(401).json({
        success: false,
        error: '当前密码错误',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 加密新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await client.user.update({
      where: { id: req.user.userId },
      data: { password: hashedPassword },
    });

    res.json({
      success: true,
      message: '密码修改成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('修改密码失败:', error);
    res.status(500).json({
      success: false,
      error: '修改密码失败',
      timestamp: new Date().toISOString(),
    });
  }
}
