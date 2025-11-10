import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CreateTagInput, UpdateTagInput } from '../types/database';
/**
 * 创建标签
 */
export async function createTag(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以创建标签
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以创建标签',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { name, slug, color }: CreateTagInput = req.body;

    // 验证必填字段
    if (!name || !slug) {
      res.status(400).json({
        success: false,
        error: '标签名称和slug为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证名称长度
    if (name.length < 2 || name.length > 30) {
      res.status(400).json({
        success: false,
        error: '标签名称长度必须在2-30个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 检查名称是否已存在
    const existingName = await client.tag.findUnique({
      where: { name },
    });

    if (existingName) {
      res.status(409).json({
        success: false,
        error: '该标签名称已存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查slug是否已存在
    const existingSlug = await client.tag.findUnique({
      where: { slug },
    });

    if (existingSlug) {
      res.status(409).json({
        success: false,
        error: '该slug已被使用',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 创建标签
    const tag = await client.tag.create({
      data: {
        name,
        slug,
        color: color || '#6366F1',
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    res.status(201).json({
      success: true,
      data: tag,
      message: '标签创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建标签失败:', error);
    res.status(500).json({
      success: false,
      error: '创建标签失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取标签列表
 */
export async function listTags(req: Request, res: Response): Promise<void> {
  try {
    const client = db.getClient();

    const tags = await client.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取标签列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取标签详情
 */
export async function getTag(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const client = db.getClient();

    const tag = await client.tag.findUnique({
      where: { id },
      include: {
        articles: {
          where: {
            article: {
              status: 'PUBLISHED',
            },
          },
          select: {
            article: {
              select: {
                id: true,
                title: true,
                slug: true,
                excerpt: true,
                status: true,
                viewCount: true,
                likeCount: true,
                createdAt: true,
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
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      res.status(404).json({
        success: false,
        error: '标签不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 转换数据格式
    const formattedTag = {
      ...tag,
      articles: tag.articles.map(at => at.article),
    };

    res.json({
      success: true,
      data: formattedTag,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取标签详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取标签详情失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 更新标签
 */
export async function updateTag(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以更新标签
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以更新标签',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;
    const { name, slug, color }: UpdateTagInput = req.body;

    const client = db.getClient();

    // 检查标签是否存在
    const tag = await client.tag.findUnique({
      where: { id },
    });

    if (!tag) {
      res.status(404).json({
        success: false,
        error: '标签不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 如果更新名称，检查是否已被使用
    if (name && name !== tag.name) {
      const existingName = await client.tag.findUnique({
        where: { name },
      });

      if (existingName) {
        res.status(409).json({
          success: false,
          error: '该标签名称已存在',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 如果更新slug，检查是否已被使用
    if (slug && slug !== tag.slug) {
      const existingSlug = await client.tag.findUnique({
        where: { slug },
      });

      if (existingSlug) {
        res.status(409).json({
          success: false,
          error: '该slug已被使用',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 更新标签
    const updatedTag = await client.tag.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(color && { color }),
      },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    res.json({
      success: true,
      data: updatedTag,
      message: '标签更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新标签失败:', error);
    res.status(500).json({
      success: false,
      error: '更新标签失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 删除标签
 */
export async function deleteTag(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以删除标签
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以删除标签',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    const client = db.getClient();

    // 检查标签是否存在
    const tag = await client.tag.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!tag) {
      res.status(404).json({
        success: false,
        error: '标签不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查标签下是否有文章
    if (tag._count.articles > 0) {
      res.status(400).json({
        success: false,
        error: '该标签下还有文章，无法删除',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 删除标签
    await client.tag.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '标签删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除标签失败:', error);
    res.status(500).json({
      success: false,
      error: '删除标签失败',
      timestamp: new Date().toISOString(),
    });
  }
}
