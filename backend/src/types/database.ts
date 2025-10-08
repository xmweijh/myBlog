import { User, Article, Category, Tag, Comment, Like } from '@prisma/client';

// 基础模型类型
export type {
  User,
  Article,
  Category,
  Tag,
  Comment,
  Like,
} from '@prisma/client';

// 自定义枚举类型
export enum Role {
  USER = 'USER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
}

export enum ArticleStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  ARCHIVED = 'ARCHIVED',
}

// 扩展类型定义

// 用户相关类型
export interface CreateUserInput {
  email: string;
  username: string;
  password: string;
  avatar?: string;
  bio?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface UpdateUserInput {
  username?: string;
  avatar?: string;
  bio?: string;
}

// 不包含密码的用户信息
export type SafeUser = Omit<User, 'password'>;

// 文章相关类型
export interface CreateArticleInput {
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId: string;
  tagIds?: string[];
  status?: ArticleStatus;
  isTop?: boolean;
}

export interface UpdateArticleInput {
  title?: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  categoryId?: string;
  tagIds?: string[];
  status?: ArticleStatus;
  isTop?: boolean;
}

// 文章列表查询参数
export interface ArticleQuery {
  page?: number;
  limit?: number;
  categoryId?: string;
  tagId?: string;
  status?: ArticleStatus;
  authorId?: string;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'viewCount' | 'likeCount';
  sortOrder?: 'asc' | 'desc';
}

// 包含关联数据的文章类型
export interface ArticleWithRelations extends Article {
  author: SafeUser;
  category: Category;
  tags: (Tag & { ArticleTag: { createdAt: Date }[] })[];
  comments: Comment[];
  likes: Like[];
  _count: {
    comments: number;
    likes: number;
  };
}

// 分类相关类型
export interface CreateCategoryInput {
  name: string;
  slug: string;
  description?: string;
  color?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  slug?: string;
  description?: string;
  color?: string;
}

// 标签相关类型
export interface CreateTagInput {
  name: string;
  slug: string;
  color?: string;
}

export interface UpdateTagInput {
  name?: string;
  slug?: string;
  color?: string;
}

// 评论相关类型
export interface CreateCommentInput {
  content: string;
  articleId: string;
  parentId?: string;
}

export interface UpdateCommentInput {
  content: string;
}

// 包含关联数据的评论类型
export interface CommentWithRelations extends Comment {
  author: SafeUser;
  replies: CommentWithRelations[];
}

// API 响应类型
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
}

// 分页响应类型
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: PaginationMeta;
}

// JWT 载荷类型
export interface JwtPayload {
  userId: string;
  email: string;
  username: string;
  role: Role;
  iat?: number;
  exp?: number;
}

// 数据库查询选项
export interface QueryOptions {
  include?: Record<string, boolean | object>;
  select?: Record<string, boolean>;
  orderBy?: Record<string, 'asc' | 'desc'>;
  where?: Record<string, any>;
  skip?: number;
  take?: number;
}
