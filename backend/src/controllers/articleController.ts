import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CreateArticleInput, UpdateArticleInput, ArticleQuery } from '../types/database';
/**
 * 创建文章
 */
export async function createArticle(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { title, slug, excerpt, content, coverImage, categoryId, tagIds, status, isTop }: CreateArticleInput = req.body;

    // 验证必填字段
    if (!title || !slug || !content || !categoryId) {
      res.status(400).json({
        success: false,
        error: '标题、slug、内容和分类为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证标题长度
    if (title.length < 3 || title.length > 200) {
      res.status(400).json({
        success: false,
        error: '标题长度必须在3-200个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证内容长度
    if (content.length < 10) {
      res.status(400).json({
        success: false,
        error: '内容长度至少为10个字符',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 检查slug是否已存在
    const existingArticle = await client.article.findUnique({
      where: { slug },
    });

    if (existingArticle) {
      res.status(409).json({
        success: false,
        error: '该slug已被使用',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查分类是否存在
    const category = await client.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: '分类不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 如果提供了标签，检查标签是否存在
    if (tagIds && tagIds.length > 0) {
      const tags = await client.tag.findMany({
        where: { id: { in: tagIds } },
      });

      if (tags.length !== tagIds.length) {
        res.status(404).json({
          success: false,
          error: '部分标签不存在',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 创建文章
    const article = await client.article.create({
      data: {
        title,
        slug,
        excerpt: excerpt || '',
        content,
        coverImage: coverImage || null,
        status: status || 'DRAFT',
        isTop: isTop || false,
        authorId: req.user.userId,
        categoryId,
        publishedAt: status === 'PUBLISHED' ? new Date() : null,
        tags: {
          create: (tagIds || []).map(tagId => ({
            tagId,
          })),
        },
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: article,
      message: '文章创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({
      success: false,
      error: '创建文章失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取文章详情
 */
export async function getArticle(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const client = db.getClient();
    const article = await client.article.findUnique({
      where: { id },
      include: {
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
            parentId: null, // 只获取顶级评论
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    if (!article) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查权限：只有已发布的文章或作者本人可以查看
    if (article.status === 'DRAFT' && article.authorId !== req.user?.userId) {
      res.status(403).json({
        success: false,
        error: '无权查看此文章',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 增加浏览量
    await client.article.update({
      where: { id },
      data: { viewCount: { increment: 1 } },
    });

    res.json({
      success: true,
      data: article,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取文章失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文章失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取文章列表
 */
export async function listArticles(req: Request, res: Response): Promise<void> {
  try {
    const {
      page = 1,
      limit = 10,
      categoryId,
      tagId,
      status,
      authorId,
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query as any;

    // 验证分页参数
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const client = db.getClient();

    // 构建查询条件
    const where: any = {};

    // 默认只显示已发布的文章，除非是查看自己的文章
    if (!status) {
      where.status = 'PUBLISHED';
    } else if (status === 'DRAFT' && !req.user) {
      // 未登录用户不能查看草稿
      where.status = 'PUBLISHED';
    } else if (status === 'DRAFT' && req.user) {
      // 已登录用户只能查看自己的草稿
      where.OR = [
        { status: 'PUBLISHED' },
        { status: 'DRAFT', authorId: req.user.userId },
      ];
    } else {
      where.status = status;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (authorId) {
      where.authorId = authorId;
    }

    if (tagId) {
      where.tags = {
        some: {
          tagId,
        },
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { excerpt: { contains: search } },
        { content: { contains: search } },
      ];
    }

    // 获取总数
    const total = await client.article.count({ where });

    // 获取文章列表
    const articles = await client.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
      skip,
      take: limitNum,
    });

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      success: true,
      data: articles,
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
    console.error('获取文章列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文章列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 更新文章
 */
export async function updateArticle(req: Request, res: Response): Promise<void> {
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
    const { title, slug, excerpt, content, coverImage, categoryId, tagIds, status, isTop }: UpdateArticleInput = req.body;

    const client = db.getClient();

    // 获取原文章
    const article = await client.article.findUnique({
      where: { id },
    });

    if (!article) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查权限：只有作者或管理员可以更新
    if (article.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '无权更新此文章',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 如果更新slug，检查是否已被使用
    if (slug && slug !== article.slug) {
      const existingArticle = await client.article.findUnique({
        where: { slug },
      });

      if (existingArticle) {
        res.status(409).json({
          success: false,
          error: '该slug已被使用',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 如果更新分类，检查分类是否存在
    if (categoryId) {
      const category = await client.category.findUnique({
        where: { id: categoryId },
      });

      if (!category) {
        res.status(404).json({
          success: false,
          error: '分类不存在',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 更新文章
    const updatedArticle = await client.article.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(slug && { slug }),
        ...(excerpt !== undefined && { excerpt }),
        ...(content && { content }),
        ...(coverImage !== undefined && { coverImage }),
        ...(categoryId && { categoryId }),
        ...(status && { status }),
        ...(isTop !== undefined && { isTop }),
        ...(status === 'PUBLISHED' && !article.publishedAt && { publishedAt: new Date() }),
        // 更新标签
        ...(tagIds && {
          tags: {
            deleteMany: {},
            create: tagIds.map(tagId => ({
              tagId,
            })),
          },
        }),
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedArticle,
      message: '文章更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新文章失败:', error);
    res.status(500).json({
      success: false,
      error: '更新文章失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 删除文章
 */
export async function deleteArticle(req: Request, res: Response): Promise<void> {
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

    // 获取文章
    const article = await client.article.findUnique({
      where: { id },
    });

    if (!article) {
      res.status(404).json({
        success: false,
        error: '文章不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查权限：只有作者或管理员可以删除
    if (article.authorId !== req.user.userId && req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '无权删除此文章',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 删除文章（级联删除评论和点赞）
    await client.article.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '文章删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除文章失败:', error);
    res.status(500).json({
      success: false,
      error: '删除文章失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取用户的文章列表
 */
export async function getUserArticles(req: Request, res: Response): Promise<void> {
  try {
    const { userId } = req.params;
    const { page = 1, limit = 10 } = req.query as any;

    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));
    const skip = (pageNum - 1) * limitNum;

    const client = db.getClient();

    // 检查用户是否存在
    const user = await client.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      res.status(404).json({
        success: false,
        error: '用户不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 构建查询条件
    const where: any = {
      authorId: userId,
      status: 'PUBLISHED', // 默认只显示已发布的文章
    };

    // 如果是查看自己的文章，可以看到草稿
    if (req.user?.userId === userId) {
      delete where.status;
    }

    const total = await client.article.count({ where });

    const articles = await client.article.findMany({
      where,
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
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
      data: articles,
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
    console.error('获取用户文章列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取用户文章列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}
