import apiClient from './api'
export interface Category {
  id: string
  name: string
  slug: string
  description: string
  color: string
  createdAt: string
  updatedAt: string
  _count?: {
    articles: number
  }
}

export interface Tag {
  id: string
  name: string
  slug: string
  color: string
  createdAt: string
  updatedAt: string
  _count?: {
    articles: number
  }
}

/**
 * 获取分类列表
 */
export async function getCategories(): Promise<{ success: boolean; data: Category[] }> {
  const response = await apiClient.get('/categories')
  return response.data
}

/**
 * 获取分类详情
 */
export async function getCategory(id: string): Promise<{ success: boolean; data: Category & { articles: any[] } }> {
  const response = await apiClient.get(`/categories/${id}`)
  return response.data
}

/**
 * 创建分类（仅管理员）
 */
export async function createCategory(data: {
  name: string
  slug: string
  description?: string
  color?: string
}): Promise<{ success: boolean; data: Category }> {
  const response = await apiClient.post('/categories', data)
  return response.data
}

/**
 * 更新分类（仅管理员）
 */
export async function updateCategory(id: string, data: Partial<Category>): Promise<{ success: boolean; data: Category }> {
  const response = await apiClient.put(`/categories/${id}`, data)
  return response.data
}

/**
 * 删除分类（仅管理员）
 */
export async function deleteCategory(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/categories/${id}`)
  return response.data
}

/**
 * 获取标签列表
 */
export async function getTags(): Promise<{ success: boolean; data: Tag[] }> {
  const response = await apiClient.get('/tags')
  return response.data
}

/**
 * 获取标签详情
 */
export async function getTag(id: string): Promise<{ success: boolean; data: Tag & { articles: any[] } }> {
  const response = await apiClient.get(`/tags/${id}`)
  return response.data
}

/**
 * 创建标签（仅管理员）
 */
export async function createTag(data: {
  name: string
  slug: string
  color?: string
}): Promise<{ success: boolean; data: Tag }> {
  const response = await apiClient.post('/tags', data)
  return response.data
}

/**
 * 更新标签（仅管理员）
 */
export async function updateTag(id: string, data: Partial<Tag>): Promise<{ success: boolean; data: Tag }> {
  const response = await apiClient.put(`/tags/${id}`, data)
  return response.data
}

/**
 * 删除标签（仅管理员）
 */
export async function deleteTag(id: string): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.delete(`/tags/${id}`)
  return response.data
}
