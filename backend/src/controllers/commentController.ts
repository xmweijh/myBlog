import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CreateCommentInput, UpdateCommentInput } from '../types/database';
/**
 * 创建评论
 */
export async function createComment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { content, articleId, parentId }: CreateCommentInput = req.body;

    // 验证必填字段
    if (!content || !articleId) {
      res.status(400).json({
        success: false,
        error: '评论内容和文章ID为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证内容长度
    if (content.length < 1 || content.length > 5000) {
      res.status(400).json({
        success: false,
        error: '评论内容长度必须在1-5000个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

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

    // 如果是回复评论，检查父评论是否存在
    if (parentId) {
      const parentComment = await client.comment.findUnique({
        where: { id: parentId },
      });

      if (!parentComment) {
        res.status(404).json({
          success: false,
          error: '父评论不存在',
          timestamp: new Date().toISOString(),
        });
        return;
      }

      // 确保父评论属于同一篇文章
      if (parentComment.articleId !== articleId) {
        res.status(400).json({
          success: false,
          error: '父评论不属于该文章',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 创建评论
    const comment = await client.comment.create({
      data: {
        content,
        articleId,
        authorId: req.user.userId,
        parentId: parentId || null,
      },
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
    });

    res.status(201).json({
      success: true,
      data: comment,
      message: '评论创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建评论失败:', error);
    res.status(500).json({
      success: false,
      error: '创建评论失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取文章的评论列表
 */
export async function getArticleComments(req: Request, res: Response): Promise<void> {
  try {
    const { articleId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

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

    // 获取顶级评论总数
    const total = await client.comment.count({
      where: {
        articleId,
        parentId: null,
      },
    });

    // 获取顶级评论及其回复
    const comments = await client.comment.findMany({
      where: {
        articleId,
        parentId: null,
      },
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: comments,
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
    console.error('获取评论列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取评论列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取评论详情
 */
export async function getComment(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const client = db.getClient();

    const comment = await client.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            slug: true,
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
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: '评论不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: comment,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取评论详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取评论详情失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 更新评论
 */
export async function updateComment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;
    const { content }: UpdateCommentInput = req.body;

    // 验证内容
    if (!content || content.length < 1 || content.length > 5000) {
      res.status(400).json({
        success: false,
        error: '评论内容长度必须在1-5000个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 获取评论
    const comment = await client.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: '评论不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查权限：只有作者或管理员可以更新
    if (comment.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '无权更新此评论',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 更新评论
    const updatedComment = await client.comment.update({
      where: { id },
      data: { content },
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
    });

    res.json({
      success: true,
      data: updatedComment,
      message: '评论更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新评论失败:', error);
    res.status(500).json({
      success: false,
      error: '更新评论失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 删除评论
 */
export async function deleteComment(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    const client = db.getClient();

    // 获取评论
    const comment = await client.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      res.status(404).json({
        success: false,
        error: '评论不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查权限：只有作者或管理员可以删除
    if (comment.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '无权删除此评论',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 删除评论及其回复
    await client.comment.deleteMany({
      where: {
        OR: [
          { id },
          { parentId: id },
        ],
      },
    });

    res.json({
      success: true,
      message: '评论删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除评论失败:', error);
    res.status(500).json({
      success: false,
      error: '删除评论失败',
      timestamp: new Date().toISOString(),
    });
  }
}
