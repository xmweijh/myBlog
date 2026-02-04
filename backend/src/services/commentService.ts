/**
 * 评论业务逻辑层
 * 
 * 职责：
 * 1. 处理所有与评论相关的业务逻辑
 * 2. 评论的创建、更新、删除、查询
 * 3. 嵌套评论（回复）管理
 * 4. 权限控制
 */

import { db } from '../utils/database';

/**
 * 创建评论输入
 */
export interface CreateCommentInput {
  content: string;
  articleId: string;
  parentId?: string; // 回复的评论ID
}

/**
 * 更新评论输入
 */
export interface UpdateCommentInput {
  content: string;
}

/**
 * 评论服务类
 */
export class CommentService {
  /**
   * 创建评论
   * 
   * 业务流程：
   * 1. 验证文章是否存在
   * 2. 如果是回复，验证父评论是否存在
   * 3. 创建评论
   * 
   * @param data 评论数据
   * @param authorId 评论者ID
   * @returns 创建的评论对象
   * @throws 如果文章不存在或父评论不存在
   */
  async createComment(data: CreateCommentInput, authorId: string) {
    const client = db.getClient();

    // 验证文章是否存在
    const article = await client.article.findUnique({
      where: { id: data.articleId },
    });

    if (!article) {
      throw new Error('ARTICLE_NOT_FOUND');
    }

    // 如果是回复，验证父评论是否存在
    if (data.parentId) {
      const parentComment = await client.comment.findUnique({
        where: { id: data.parentId },
      });

      if (!parentComment) {
        throw new Error('PARENT_COMMENT_NOT_FOUND');
      }

      // 验证父评论是否属于同一文章
      if (parentComment.articleId !== data.articleId) {
        throw new Error('INVALID_PARENT_COMMENT');
      }
    }

    // 创建评论
    const comment = await client.comment.create({
      data: {
        content: data.content,
        articleId: data.articleId,
        authorId,
        parentId: data.parentId || null,
      },
      include: this.getCommentInclude(),
    });

    return comment;
  }

  /**
   * 获取评论详情
   * 
   * @param commentId 评论ID
   * @returns 评论对象
   * @throws 如果评论不存在
   */
  async getCommentById(commentId: string) {
    const client = db.getClient();

    const comment = await client.comment.findUnique({
      where: { id: commentId },
      include: this.getCommentInclude(),
    });

    if (!comment) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    return comment;
  }

  /**
   * 获取文章的评论列表
   * 
   * 业务流程：
   * 1. 验证文章是否存在
   * 2. 获取顶级评论
   * 3. 返回带分页的结果
   * 
   * @param articleId 文章ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   * @throws 如果文章不存在
   */
  async getArticleComments(
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

    // 获取总数和列表（只获取顶级评论）
    const [total, comments] = await Promise.all([
      client.comment.count({
        where: {
          articleId,
          parentId: null,
        },
      }),
      client.comment.findMany({
        where: {
          articleId,
          parentId: null,
        },
        include: {
          ...this.getCommentInclude(),
          // 获取所有回复
          replies: {
            include: this.getCommentInclude(),
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
      data: comments,
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
   * 获取用户的评论列表
   * 
   * @param userId 用户ID
   * @param page 页码
   * @param limit 每页数量
   * @returns 分页结果
   */
  async getUserComments(
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
    const [total, comments] = await Promise.all([
      client.comment.count({
        where: { authorId: userId },
      }),
      client.comment.findMany({
        where: { authorId: userId },
        include: {
          ...this.getCommentInclude(),
          article: {
            select: {
              id: true,
              title: true,
              slug: true,
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
      data: comments,
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
   * 更新评论
   * 
   * 业务流程：
   * 1. 验证评论是否存在
   * 2. 检查权限（只有评论作者或管理员可更新）
   * 3. 执行更新
   * 
   * @param commentId 评论ID
   * @param data 更新数据
   * @param userId 当前用户ID
   * @param userRole 用户角色
   * @returns 更新后的评论对象
   * @throws 如果评论不存在或无权更新
   */
  async updateComment(
    commentId: string,
    data: UpdateCommentInput,
    userId: string,
    userRole: string
  ) {
    const client = db.getClient();

    // 查询评论
    const comment = await client.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    // 权限检查
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error('COMMENT_FORBIDDEN');
    }

    // 执行更新
    const updatedComment = await client.comment.update({
      where: { id: commentId },
      data: {
        content: data.content,
      },
      include: this.getCommentInclude(),
    });

    return updatedComment;
  }

  /**
   * 删除评论
   * 
   * 业务流程：
   * 1. 验证评论是否存在
   * 2. 检查权限（只有评论作者或管理员可删除）
   * 3. 执行删除（级联删除回复）
   * 
   * @param commentId 评论ID
   * @param userId 当前用户ID
   * @param userRole 用户角色
   * @throws 如果评论不存在或无权删除
   */
  async deleteComment(
    commentId: string,
    userId: string,
    userRole: string
  ): Promise<void> {
    const client = db.getClient();

    // 查询评论
    const comment = await client.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('COMMENT_NOT_FOUND');
    }

    // 权限检查
    if (comment.authorId !== userId && userRole !== 'ADMIN') {
      throw new Error('COMMENT_FORBIDDEN');
    }

    // 删除评论（级联删除回复）
    await client.comment.delete({
      where: { id: commentId },
    });
  }

  /**
   * 获取评论包含的关联数据
   */
  private getCommentInclude() {
    return {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
        },
      },
    };
  }
}

// 导出单例
export const commentService = new CommentService();
