import { Request, Response } from 'express';
import { db } from '../utils/database';
import { CreateCategoryInput, UpdateCategoryInput } from '../types/database';
/**
 * 创建分类
 */
export async function createCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以创建分类
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以创建分类',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { name, slug, description, color }: CreateCategoryInput = req.body;

    // 验证必填字段
    if (!name || !slug) {
      res.status(400).json({
        success: false,
        error: '分类名称和slug为必填项',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 验证名称长度
    if (name.length < 2 || name.length > 50) {
      res.status(400).json({
        success: false,
        error: '分类名称长度必须在2-50个字符之间',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const client = db.getClient();

    // 检查名称是否已存在
    const existingName = await client.category.findUnique({
      where: { name },
    });

    if (existingName) {
      res.status(409).json({
        success: false,
        error: '该分类名称已存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查slug是否已存在
    const existingSlug = await client.category.findUnique({
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

    // 创建分类
    const category = await client.category.create({
      data: {
        name,
        slug,
        description: description || '',
        color: color || '#3B82F6',
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
      data: category,
      message: '分类创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('创建分类失败:', error);
    res.status(500).json({
      success: false,
      error: '创建分类失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取分类列表
 */
export async function listCategories(req: Request, res: Response): Promise<void> {
  try {
    const client = db.getClient();

    const categories = await client.category.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类列表失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 获取分类详情
 */
export async function getCategory(req: Request, res: Response): Promise<void> {
  try {
    const { id } = req.params;

    const client = db.getClient();

    const category = await client.category.findUnique({
      where: { id },
      include: {
        articles: {
          where: {
            status: 'PUBLISHED',
          },
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

    if (!category) {
      res.status(404).json({
        success: false,
        error: '分类不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.json({
      success: true,
      data: category,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取分类详情失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类详情失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 更新分类
 */
export async function updateCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以更新分类
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以更新分类',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;
    const { name, slug, description, color }: UpdateCategoryInput = req.body;

    const client = db.getClient();

    // 检查分类是否存在
    const category = await client.category.findUnique({
      where: { id },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: '分类不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 如果更新名称，检查是否已被使用
    if (name && name !== category.name) {
      const existingName = await client.category.findUnique({
        where: { name },
      });

      if (existingName) {
        res.status(409).json({
          success: false,
          error: '该分类名称已存在',
          timestamp: new Date().toISOString(),
        });
        return;
      }
    }

    // 如果更新slug，检查是否已被使用
    if (slug && slug !== category.slug) {
      const existingSlug = await client.category.findUnique({
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

    // 更新分类
    const updatedCategory = await client.category.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(slug && { slug }),
        ...(description !== undefined && { description }),
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
      data: updatedCategory,
      message: '分类更新成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('更新分类失败:', error);
    res.status(500).json({
      success: false,
      error: '更新分类失败',
      timestamp: new Date().toISOString(),
    });
  }
}

/**
 * 删除分类
 */
export async function deleteCategory(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '需要登录',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 只有管理员可以删除分类
    if (req.user.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: '只有管理员可以删除分类',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    const client = db.getClient();

    // 检查分类是否存在
    const category = await client.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
    });

    if (!category) {
      res.status(404).json({
        success: false,
        error: '分类不存在',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 检查分类下是否有文章
    if (category._count.articles > 0) {
      res.status(400).json({
        success: false,
        error: '该分类下还有文章，无法删除',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // 删除分类
    await client.category.delete({
      where: { id },
    });

    res.json({
      success: true,
      message: '分类删除成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('删除分类失败:', error);
    res.status(500).json({
      success: false,
      error: '删除分类失败',
      timestamp: new Date().toISOString(),
    });
  }
}
