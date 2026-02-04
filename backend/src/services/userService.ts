/**
 * 用户业务逻辑层
 * 
 * 职责：
 * 1. 处理所有与用户相关的业务逻辑
 * 2. 用户认证、注册、登录
 * 3. 用户信息管理
 * 4. 密码处理
 * 5. 权限检查
 */

import { db } from '../utils/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { User } from '@prisma/client';

/**
 * 用户注册和登录输入类型
 */
export interface RegisterInput {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  bio?: string;
  avatar?: string;
}

/**
 * 用户服务类
 */
export class UserService {
  /**
   * 注册用户
   * 
   * 业务流程：
   * 1. 验证邮箱格式
   * 2. 验证邮箱是否已被使用
   * 3. 验证用户名是否已被使用
   * 4. 验证密码强度
   * 5. 验证密码确认
   * 6. 哈希密码
   * 7. 创建用户
   * 8. 生成JWT令牌
   * 
   * @param data 注册信息
   * @returns 用户对象和JWT令牌
   * @throws 如果邮箱/用户名已存在或密码验证失败
   */
  async register(data: RegisterInput) {
    const { email, username, password, confirmPassword } = data;

    // 验证1：邮箱格式
    if (!this.isValidEmail(email)) {
      throw new Error('INVALID_EMAIL');
    }

    // 验证2：邮箱是否已被使用
    const client = db.getClient();
    const existingEmailUser = await client.user.findUnique({
      where: { email },
    });

    if (existingEmailUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // 验证3：用户名是否已被使用
    const existingUsernameUser = await client.user.findFirst({
      where: { username },
    });

    if (existingUsernameUser) {
      throw new Error('USERNAME_EXISTS');
    }

    // 验证4：用户名长度
    if (username.length < 2 || username.length > 50) {
      throw new Error('INVALID_USERNAME');
    }

    // 验证5：密码强度
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.valid) {
      throw new Error(`WEAK_PASSWORD:${passwordValidation.errors.join(',')}`);
    }

    // 验证6：密码确认
    if (password !== confirmPassword) {
      throw new Error('PASSWORD_MISMATCH');
    }

    // 哈希密码
    const hashedPassword = await hashPassword(password);

    // 创建用户
    const user = await client.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'USER', // 默认角色为USER
        isActive: true,
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
      role: user.role as any,
    });

    return { user, token };
  }

  /**
   * 用户登录
   * 
   * 业务流程：
   * 1. 验证邮箱和密码是否提供
   * 2. 查找用户
   * 3. 验证密码
   * 4. 检查账号是否被禁用
   * 5. 生成JWT令牌
   * 
   * @param data 登录信息
   * @returns 用户对象和JWT令牌
   * @throws 如果用户不存在、密码错误或账号被禁用
   */
  async login(data: LoginInput) {
    const { email, password } = data;

    // 验证必填字段
    if (!email || !password) {
      throw new Error('MISSING_CREDENTIALS');
    }

    const client = db.getClient();

    // 查找用户
    const user = await client.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // 检查账号是否被禁用
    if (!user.isActive) {
      throw new Error('ACCOUNT_DISABLED');
    }

    // 生成JWT令牌
    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as any,
    });

    // 返回用户信息（不包含密码）
    const { password: _, ...safeUser } = user;

    return { user: safeUser, token };
  }

  /**
   * 获取当前用户信息
   * 
   * @param userId 用户ID
   * @returns 用户对象
   * @throws 如果用户不存在
   */
  async getCurrentUser(userId: string) {
    const client = db.getClient();

    const user = await client.user.findUnique({
      where: { id: userId },
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
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * 获取用户公开信息
   * 
   * 返回用户的公开资料（用于展示用户信息时）
   * 
   * @param userId 用户ID
   * @returns 用户公开信息
   * @throws 如果用户不存在
   */
  async getUserPublicProfile(userId: string) {
    const client = db.getClient();

    const user = await client.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatar: true,
        bio: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return user;
  }

  /**
   * 更新用户信息
   * 
   * 业务流程：
   * 1. 验证用户是否存在
   * 2. 验证更新数据
   * 3. 执行更新
   * 
   * @param userId 用户ID
   * @param data 更新数据
   * @returns 更新后的用户对象
   * @throws 如果用户不存在或数据验证失败
   */
  async updateUser(userId: string, data: UpdateUserInput) {
    const client = db.getClient();

    // 验证用户是否存在
    const user = await client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 验证用户名长度
    if (data.username && (data.username.length < 2 || data.username.length > 50)) {
      throw new Error('INVALID_USERNAME');
    }

    // 验证用户名唯一性
    if (data.username && data.username !== user.username) {
      const existingUser = await client.user.findFirst({
        where: { username: data.username },
      });

      if (existingUser) {
        throw new Error('USERNAME_EXISTS');
      }
    }

    // 验证bio长度
    if (data.bio && data.bio.length > 500) {
      throw new Error('BIO_TOO_LONG');
    }

    // 执行更新
    const updatedUser = await client.user.update({
      where: { id: userId },
      data: {
        ...(data.username && { username: data.username }),
        ...(data.bio !== undefined && { bio: data.bio }),
        ...(data.avatar !== undefined && { avatar: data.avatar }),
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

    return updatedUser;
  }

  /**
   * 修改密码
   * 
   * 业务流程：
   * 1. 验证旧密码
   * 2. 验证新密码强度
   * 3. 哈希新密码
   * 4. 更新密码
   * 
   * @param userId 用户ID
   * @param oldPassword 旧密码
   * @param newPassword 新密码
   * @throws 如果旧密码错误或新密码验证失败
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string): Promise<void> {
    const client = db.getClient();

    // 查找用户
    const user = await client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, user.password);

    if (!isOldPasswordValid) {
      throw new Error('INVALID_OLD_PASSWORD');
    }

    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.valid) {
      throw new Error(`WEAK_PASSWORD:${passwordValidation.errors.join(',')}`);
    }

    // 哈希新密码
    const hashedPassword = await hashPassword(newPassword);

    // 更新密码
    await client.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });
  }

  /**
   * 验证邮箱格式
   * 
   * @param email 邮箱
   * @returns 是否有效
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}

// 导出单例
export const userService = new UserService();
