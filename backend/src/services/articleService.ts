/**
 * 文章业务逻辑层
 * 
 * 职责：
 * 1. 处理所有与文章相关的业务逻辑
 * 2. 调用数据库操作（Prisma）
 * 3. 数据验证和转换
 * 4. 错误处理
 * 
 * 设计模式：
 * - 方法对应不同的业务场景
 * - 每个方法处理一个完整的业务流程
 * - 参数包含所有必要的信息
 * - 返回结构化的结果或抛出异常
 */

import { db } from '../utils/database';
import { CreateArticleInput, UpdateArticleInput, ArticleQuery } from '../types/database';
import { Article, User } from '@prisma/client';

/**
 * 文章服务类
 * 
 * 包含所有与文章相关的业务逻辑
 */
export class ArticleService {
  /**
   * 创建文章
   * 
   * 业务流程：
   * 1. 验证slug是否已存在
   * 2. 验证分类是否存在
   * 3. 验证标签是否存在
   * 4. 创建文章及标签关联
   * 
   * @param data 文章数据
   * @param authorId 作者ID
   * @returns 创建的文章对象（包含关联数据）
   * @throws 如果分类/标签不存在或slug已被使用
   */
  async createArticle(data: CreateArticleInput, authorId: string) {
    const client = db.getClient();

    // 验证1：检查slug是否已存在
    const existingArticle = await client.article.findUnique({
      where: { slug: data.slug },
    });

    if (existingArticle) {
      throw new Error('SLUG_EXISTS');
    }

    // 验证2：检查分类是否存在
    const category = await client.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND');
    }

    // 验证3：如果提供了标签，检查标签是否存在
    if (data.tagIds && data.tagIds.length > 0) {
      const tags = await client.tag.findMany({
        where: { id: { in: data.tagIds } },
      });

      if (tags.length !== data.tagIds.length) {
        throw new Error('TAG_NOT_FOUND');
      }
    }

    // 创建文章
    const article = await client.article.create({
      data: {
        title: data.title,
        slug: data.slug,
        excerpt: data.excerpt || '',
        content: data.content,
        coverImage: data.coverImage || null,
        status: data.status || 'DRAFT',
        isTop: data.isTop || false,
        authorId,
        categoryId: data.categoryId,
        publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
        // 创建标签关联
        tags: {
          create: (data.tagIds || []).map(tagId => ({
            tagId,
          })),
        },
      },
      include: this.getArticleInclude(),
    });

    return article;
  }

  /**
   * 获取文章详情
   * 
   * 业务流程：
   * 1. 查询文章
   * 2. 检查文章是否存在
   * 3. 检查权限（草稿文章只有作者可见）
   * 4. 增加浏览量
   * 
   * @param id 文章ID
   * @param userId 当前用户ID（可选，用于权限检查）
   * @returns 文章对象
   * @throws 如果文章不存在或无权查看
   */
  async getArticleById(id: string, userId?: string) {
    const client = db.getClient();

    const article = await client.article.findUnique({
      where: { id },
      include: this.getArticleInclude(),
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 权限检查：草稿文章只有作者可见
    if (article.status === 'DRAFT' && article.authorId !== userId) {
      throw new Error('ARTICLE_FORBIDDEN');
    }

    // 增加浏览量（异步操作，不等待）
    client.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    }).catch(err => console.error('更新浏览量失败:', err));

    return article;
  }

  /**
   * 获取文章列表
   * 
   * 业务流程：
   * 1. 构建查询条件
   * 2. 应用权限过滤（非admin用户只能看已发布文章）
   * 3. 应用搜索/分类/标签过滤
   * 4. 执行分页查询
   * 
   * @param query 查询参数
   * @param userId 当前用户ID（可选，用于权限检查）
   * @param userRole 用户角色（可选，用于权限检查）
   * @returns 分页结果
   */
  async listArticles(
    query: ArticleQuery,
    userId?: string,
    userRole?: string
  ) {
    const client = db.getClient();

    // 分页参数
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {};

    // 权限过滤逻辑
    if (!query.status) {
      // 如果没有指定状态，默认只显示已发布文章（除非是管理员）
      if (userRole !== 'ADMIN') {
        where.status = 'PUBLISHED';
      }
    } else if (query.status === 'DRAFT') {
      // 草稿文章需要特殊处理
      if (!userId) {
        // 未登录用户看不到草稿
        where.status = 'PUBLISHED';
      } else {
        // 已登录用户只能看自己的草稿或已发布的文章
        where.OR = [
          { status: 'PUBLISHED' },
          { status: 'DRAFT', authorId: userId },
        ];
      }
    } else {
      where.status = query.status;
    }

    // 应用其他过滤条件
    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.authorId) {
      where.authorId = query.authorId;
    }

    if (query.tagId) {
      where.tags = {
        some: {
          tagId: query.tagId,
        },
      };
    }

    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { excerpt: { contains: query.search } },
        { content: { contains: query.search } },
      ];
    }

    // 获取总数和列表
    const [total, articles] = await Promise.all([
      client.article.count({ where }),
      client.article.findMany({
        where,
        include: this.getArticleInclude(),
        orderBy: {
          [query.sortBy || 'createdAt']: query.sortOrder || 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 更新文章
   * 
   * 业务流程：
   * 1. 查询文章
   * 2. 检查文章是否存在
   * 3. 检查权限（只有作者或管理员可更新）
   * 4. 验证更新数据（slug唯一性、分类存在性等）
   * 5. 执行更新
   * 
   * @param id 文章ID
   * @param data 更新数据
   * @param userId 当前用户ID
   * @param userRole 用户角色
   * @returns 更新后的文章对象
   * @throws 如果文章不存在、无权更新或数据验证失败
   */
  async updateArticle(
    id: string,
    data: UpdateArticleInput,
    userId: string,
    userRole: string
  ) {
    const client = db.getClient();

    // 查询原文章
    const article = await client.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 权限检查：只有作者或管理员可以更新
    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error('ARTICLE_FORBIDDEN');
    }

    // 验证slug唯一性
    if (data.slug && data.slug !== article.slug) {
      const existingArticle = await client.article.findUnique({
        where: { slug: data.slug },
      });

      if (existingArticle) {
        throw new Error('SLUG_EXISTS');
      }
    }

    // 验证分类存在性
    if (data.categoryId) {
      const category = await client.category.findUnique({
        where: { id: data.categoryId },
      });

      if (!category) {
        throw new Error('CATEGORY_NOT_FOUND');
      }
    }

    // 验证标签存在性
    if (data.tagIds && data.tagIds.length > 0) {
      const tags = await client.tag.findMany({
        where: { id: { in: data.tagIds } },
      });

      if (tags.length !== data.tagIds.length) {
        throw new Error('TAG_NOT_FOUND');
      }
    }

    // 执行更新
    const updatedArticle = await client.article.update({
      where: { id },
      data: {
        ...(data.title && { title: data.title }),
        ...(data.slug && { slug: data.slug }),
        ...(data.excerpt !== undefined && { excerpt: data.excerpt }),
        ...(data.content && { content: data.content }),
        ...(data.coverImage !== undefined && { coverImage: data.coverImage }),
        ...(data.categoryId && { categoryId: data.categoryId }),
        ...(data.status && { status: data.status }),
        ...(data.isTop !== undefined && { isTop: data.isTop }),
        // 如果从草稿改为发布，设置发布时间
        ...(data.status === 'PUBLISHED' && !article.publishedAt && {
          publishedAt: new Date(),
        }),
        // 更新标签
        ...(data.tagIds && {
          tags: {
            deleteMany: {},
            create: data.tagIds.map(tagId => ({
              tagId,
            })),
          },
        }),
      },
      include: this.getArticleInclude(),
    });

    return updatedArticle;
  }

  /**
   * 删除文章
   * 
   * 业务流程：
   * 1. 查询文章
   * 2. 检查文章是否存在
   * 3. 检查权限（只有作者或管理员可删除）
   * 4. 执行删除（级联删除评论、点赞等）
   * 
   * @param id 文章ID
   * @param userId 当前用户ID
   * @param userRole 用户角色
   * @throws 如果文章不存在或无权删除
   */
  async deleteArticle(
    id: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const client = db.getClient();

    // 查询文章
    const article = await client.article.findUnique({
      where: { id },
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 权限检查：只有作者或管理员可以删除
    if (article.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error('ARTICLE_FORBIDDEN');
    }

    // 删除文章（级联删除相关数据）
    await client.article.delete({
      where: { id },
    });
  }

  /**
   * 获取用户的文章列表
   * 
   * 业务流程：
   * 1. 验证用户是否存在
   * 2. 构建查询条件（权限过滤）
   * 3. 执行分页查询
   * 
   * @param userId 用户ID
   * @param query 查询参数
   * @param currentUserId 当前用户ID（可选，用于权限检查）
   * @returns 分页结果
   * @throws 如果用户不存在
   */
  async getUserArticles(
    userId: string,
    query: ArticleQuery,
    currentUserId?: string
  ) {
    const client = db.getClient();

    // 验证用户是否存在
    const user = await client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    // 分页参数
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    // 构建查询条件
    const where: any = {
      authorId: userId,
      status: 'PUBLISHED', // 默认只显示已发布的文章
    };

    // 如果查看的是自己的文章，可以看到草稿
    if (currentUserId === userId) {
      delete where.status;
    }

    // 获取总数和列表
    const [total, articles] = await Promise.all([
      client.article.count({ where }),
      client.article.findMany({
        where,
        include: this.getArticleInclude(),
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limit,
      }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: articles,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 获取文章包含的关联数据
   * 
   * 这是一个辅助方法，定义了查询文章时要包含的关联数据
   * 避免重复代码
   */
  private getArticleInclude() {
    return {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true,
        },
      },
      category: true,
      tags: {
        include: {
          tag: true,
        },
      },
      comments: {
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
        where: {
          parentId: null,
        },
      },
      _count: {
        select: {
          comments: true,
          likes: true,
        },
      },
    };
  }
}

// 导出单例
export const articleService = new ArticleService();
