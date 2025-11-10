import apiClient from './api'
export interface CommentAuthor {
  id: string
  username: string
  avatar: string
}

export interface Comment {
  id: string
  content: string
  createdAt: string
  updatedAt: string
  authorId: string
  articleId: string
  parentId: string | null
  author: CommentAuthor
  replies?: Comment[]
}

export interface CommentListResponse {
  success: boolean
  data: Comment[]
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

/**
 * 获取文章的评论列表
 */
export async function getArticleComments(
  articleId: string,
  params?: { page?: number; limit?: number }
): Promise<CommentListResponse> {
  const response = await apiClient.get(`/comments/article/${articleId}`, { params })
  return response.data
}

/**
 * 获取评论详情
 */
export async function getComment(id: string): Promise<{ success: boolean; data: Comment }> {
  const response = await apiClient.get(`/comments/${id}`)
  return response.data
}

/**
 * 创建评论
 */
export async function createComment(data: {
  content: string
  articleId: string
  parentId?: string
}): Promise<{ success: boolean; data: Comment }> {
  const response = await apiClient.post('/comments', data)
  return response.data
}

/**
 * 更新评论
 */
export async function updateComment(id: string, data: { content: string }): Promise<{ success: boolean; data: Comment }> {
  const response = await apiClient.put(`/comments/${id}`, data)
  return response.data
}

/**
 * 删除评论
 */
export async function deleteComment(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/comments/${id}`)
  return response.data
}
