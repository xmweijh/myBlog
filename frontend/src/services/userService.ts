import apiClient from './api'
import { User } from './authService'

/**
 * 获取用户列表（仅管理员）
 */
export async function getUsers(params?: { page?: number; limit?: number }): Promise<{ success: boolean; data: User[]; pagination: any }> {
  const response = await apiClient.get('/users', { params })
  return response.data
}

/**
 * 更新用户状态（仅管理员）
 */
export async function updateUserStatus(id: string, isActive: boolean): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.put(`/users/${id}/status`, { isActive })
  return response.data
}