import apiClient from './api'

export interface DashboardStats {
  users: number
  articles: number
  categories: number
  tags: number
  comments: number
  likes: number
}

export interface StatsResponse {
  success: boolean
  data: DashboardStats
  timestamp: string
}

/**
 * 获取仪表盘统计数据
 */
export async function getDashboardStats(): Promise<StatsResponse> {
  const response = await apiClient.get('/api/stats')
  return response.data
}