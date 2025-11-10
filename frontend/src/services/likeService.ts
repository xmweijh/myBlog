import apiClient from './api'
export interface Like {
  id: string
  userId: string
  articleId: string
  createdAt: string
}

export interface LikeResponse {
  success: boolean
  data: Like
  message: string
  timestamp: string
}

export interface UnlikeResponse {
  success: boolean
  message: string
  timestamp: string
}

/**
 * 点赞文章
 */
export async function likeArticle(articleId: string): Promise<LikeResponse> {
  const response = await apiClient.post(`/articles/${articleId}/like`)
  return response.data
}

/**
 * 取消点赞
 */
export async function unlikeArticle(articleId: string): Promise<UnlikeResponse> {
  const response = await apiClient.delete(`/articles/${articleId}/like`)
  return response.data
}

/**
 * 获取文章的点赞列表
 */
export async function getArticleLikes(
  articleId: string,
  params?: { page?: number; limit?: number }
): Promise<{ success: boolean; data: Like[]; pagination: any }> {
  const response = await apiClient.get(`/articles/${articleId}/likes`, { params })
  return response.data
}

/**
 * 检查用户是否点赞了文章
 */
export async function checkIfLiked(articleId: string): Promise<{ success: boolean; data: { liked: boolean } }> {
  const response = await apiClient.get(`/articles/${articleId}/like/check`)
  return response.data
}
