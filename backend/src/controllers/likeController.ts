import { Request, Response } from 'express';
import { db } from '../utils/database';

/**
 * 点赞文章
 */
export async function likeArticle(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id: articleId } = req.params;
    const userId = req.user.userId;

    const client = db.getClient();

    // 检查文章是否存在
    const article = await client.article.findUnique({
      where: { id: articleId },
    });

    if (!article) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查是否已经点赞
    const existingLike = await client.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (existingLike) {
      res.status(400).json({
        success: false,
        error: '已经点赞过了',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 创建点赞并更新文章点赞数
    const [like] = await client.$transaction([
      client.like.create({
        data: {
          userId,
          articleId,
        },
      }),
      client.article.update({
        where: { id: articleId },
        data: {
          likeCount: {
            increment: 1,
          },
        },
      }),
    ]);

    res.status(201).json({
      success: true,
      data: like,
      message: '点赞成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('点赞失败:', error);
    res.status(500).json({
      success: false,
      error: '点赞失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 取消点赞
 */
export async function unlikeArticle(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id: articleId } = req.params;
    const userId = req.user.userId;

    const client = db.getClient();

    // 检查是否已经点赞
    const existingLike = await client.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    if (!existingLike) {
      res.status(400).json({
        success: false,
        error: '尚未点赞',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 删除点赞并更新文章点赞数
    await client.$transaction([
      client.like.delete({
        where: {
          userId_articleId: {
            userId,
            articleId,
          },
        },
      }),
      client.article.update({
        where: { id: articleId },
        data: {
          likeCount: {
            decrement: 1,
          },
        },
      }),
    ]);

    res.json({
      success: true,
      message: '取消点赞成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('取消点赞失败:', error);
    res.status(500).json({
      success: false,
      error: '取消点赞失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 检查是否已点赞
 */
export async function checkLikeStatus(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.json({
        success: true,
        data: { liked: false },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id: articleId } = req.params;
    const userId = req.user.userId;

    const client = db.getClient();

    const like = await client.like.findUnique({
      where: {
        userId_articleId: {
          userId,
          articleId,
        },
      },
    });

    res.json({
      success: true,
      data: { liked: !!like },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('检查点赞状态失败:', error);
    res.status(500).json({
      success: false,
      error: '检查点赞状态失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取文章的点赞列表
 */
export async function getArticleLikes(req: Request, res: Response): Promise<void> {
  try {
    const { id: articleId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const client = db.getClient();

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

    res.json({
      success: true,
      data: likes,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages,
        hasNext: pageNum < totalPages,
        hasPrev: pageNum > 1,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取点赞列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取点赞列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}