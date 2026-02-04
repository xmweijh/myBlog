/**
 * 点赞业务逻辑层
 * 
 * 职责：
 * 1. 处理所有与点赞相关的业务逻辑
 * 2. 点赞/取消点赞
 * 3. 点赞状态检查
 * 4. 用户点赞列表
 */

import { db } from '../utils/database';

/**
 * 点赞服务类
 */
export class LikeService {
  /**
   * 点赞文章
   * 
   * 业务流程：
   * 1. 验证文章是否存在
   * 2. 检查是否已点赞
   * 3. 如果未点赞，则创建点赞
   * 4. 如果已点赞，则删除点赞
   * 
   * @param articleId 文章ID
   * @param userId 用户ID
   * @returns 点赞后的状态
   * @throws 如果文章不存在
   */
  async toggleLike(articleId: string, userId: string) {
    const client = db.getClient();

    // 验证文章是否存在
    const article = await client.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 查询点赞记录
    const existingLike = await client.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingLike) {
      // 如果已点赞，则删除（取消点赞）
      await client.like.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      });

      return {
        liked: false,
        message: '已取消点赞',
      };
    } else {
      // 如果未点赞，则创建（点赞）
      await client.like.create({
        data: {
          userId,
          articleId,
        },
      });

      return {
        liked: true,
        message: '已点赞',
      };
    }
  }

  /**
   * 检查用户是否已点赞某文章
   * 
   * @param articleId 文章ID
   * @param userId 用户ID
   * @returns 是否已点赞
   */
  async isLiked(articleId: string, userId: string): Promise<boolean> {
    const client = db.getClient();

    const like = await client.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    return !!like;
  }

  /**
   * 获取文章的点赞数
   * 
   * @param articleId 文章ID
   * @returns 点赞数
   */
  async getLikeCount(articleId: string): Promise<number> {
    const client = db.getClient();

    const count = await client.like.count({
      where: { articleId },
    });

    return count;
  }

  /**
   * 获取文章的点赞者列表
   * 
   * 业务流程：
   * 1. 验证文章是否存在
   * 2. 获取点赞者列表
   * 
   * @param articleId 文章ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   * @throws 如果文章不存在
   */
  async getArticleLikes(
    articleId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const client = db.getClient();

    // 验证文章是否存在
    const article = await client.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 分页参数
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // 获取总数和列表
    const [total, likes] = await Promise.all([
      client.like.count({
        where: { articleId },
      }),
      client.like.findMany({
        where: { articleId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatar: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: likes.map(like => like.user),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  /**
   * 获取用户点赞过的文章列表
   * 
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserLikes(
    userId: string,
    page: number = 1,
    limit: number = 10
  ) {
    const client = db.getClient();

    // 分页参数
    const pageNum = Math.max(1, page);
    const limitNum = Math.min(100, Math.max(1, limit));
    const skip = (pageNum - 1) * limitNum;

    // 获取总数和列表
    const [total, likes] = await Promise.all([
      client.like.count({
        where: { userId },
      }),
      client.like.findMany({
        where: { userId },
        include: {
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
              excerpt: true,
              coverImage: true,
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
              category: true,
              _count: {
                select: {
                  comments: true,
                  likes: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
        skip,
        take: limitNum,
      }),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    return {
      data: likes.map(like => like.article),
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
    };
  }

  /**
   * 批量检查用户是否点赞过这些文章
   * 
   * 用于文章列表展示时，检查当前用户是否点赞过每个文章
   * 
   * @param articleIds 文章ID列表
   * @param userId 用户ID
   * @returns 点赞状态映射 { articleId: isLiked }
   */
  async checkLikeStatus(articleIds: string[], userId: string): Promise<{ [key: string]: boolean }> {
    const client = db.getClient();

    const likes = await client.like.findMany({
      where: {
        userId,
        articleId: {
          in: articleIds,
        },
      },
      select: {
        articleId: true,
      },
    });

    // 构建映射
    const likedMap: { [key: string]: boolean } = {};
    articleIds.forEach(id => {
      likedMap[id] = false;
    });

    likes.forEach(like => {
      likedMap[like.articleId] = true;
    });

    return likedMap;
  }
}

// 导出单例
export const likeService = new LikeService();
