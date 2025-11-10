import apiClient from './api'
export interface Author {
  id: string
  username: string
  avatar: string
  bio?: string
}

export interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Tag {
  id: string
  name: string
  slug: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface Article {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  coverImage: string | null
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isTop: boolean
  viewCount: number
  likeCount: number
  publishedAt: string | null
  createdAt: string
  updatedAt: string
  authorId: string
  categoryId: string
  author: Author
  category: Category
  tags: Array<{ tag: Tag }>
  _count: {
    comments: number
    likes: number
  }
}

export interface ArticleListResponse {
  success: boolean
  data: Article[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
  timestamp: string
}

export interface ArticleDetailResponse {
  success: boolean
  data: Article & {
    comments: any[]
  }
  timestamp: string
}

export interface CreateArticleInput {
  title: string
  slug: string
  excerpt?: string
  content: string
  coverImage?: string
  categoryId: string
  tagIds?: string[]
  status?: 'DRAFT' | 'PUBLISHED'
  isTop?: boolean
}

export interface UpdateArticleInput {
  title?: string
  slug?: string
  excerpt?: string
  content?: string
  coverImage?: string
  categoryId?: string
  tagIds?: string[]
  status?: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED'
  isTop?: boolean
}

/**
 * 获取文章列表
 */
export async function getArticles(params?: {
  page?: number
  limit?: number
  categoryId?: string
  tagId?: string
  authorId?: string
  search?: string
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}): Promise<ArticleListResponse> {
  const response = await apiClient.get('/articles', { params })
  return response.data
}

/**
 * 获取文章详情
 */
export async function getArticle(id: string): Promise<ArticleDetailResponse> {
  const response = await apiClient.get(`/articles/${id}`)
  return response.data
}

/**
 * 创建文章
 */
export async function createArticle(data: CreateArticleInput): Promise<{ success: boolean; data: Article }> {
  const response = await apiClient.post('/articles', data)
  return response.data
}

/**
 * 更新文章
 */
export async function updateArticle(id: string, data: UpdateArticleInput): Promise<{ success: boolean; data: Article }> {
  const response = await apiClient.put(`/articles/${id}`, data)
  return response.data
}

/**
 * 删除文章
 */
export async function deleteArticle(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/articles/${id}`)
  return response.data
}

/**
 * 获取用户的文章列表
 */
export async function getUserArticles(userId: string, params?: { page?: number; limit?: number }): Promise<ArticleListResponse> {
  const response = await apiClient.get(`/articles/user/${userId}`, { params })
  return response.data
}
