import apiClient from './api'
export interface User {
  id: string
  email: string
  username: string
  avatar: string
  bio: string
  role: 'USER' | 'MODERATOR' | 'ADMIN'
  isActive: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthResponse {
  success: boolean
  data: {
    user: User
    token: string
  }
  message: string
  timestamp: string
}

export interface LoginInput {
  email: string
  password: string
}

export interface RegisterInput {
  email: string
  username: string
  password: string
  avatar?: string
  bio?: string
}

export interface UpdateProfileInput {
  username?: string
  avatar?: string
  bio?: string
}

export interface ChangePasswordInput {
  currentPassword: string
  newPassword: string
}

/**
 * 用户注册
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/register', data)
  return response.data
}

/**
 * 用户登录
 */
export async function login(data: LoginInput): Promise<AuthResponse> {
  const response = await apiClient.post('/auth/login', data)
  return response.data
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(): Promise<{ success: boolean; data: User }> {
  const response = await apiClient.get('/auth/me')
  return response.data
}

/**
 * 更新用户资料
 */
export async function updateProfile(data: UpdateProfileInput): Promise<{ success: boolean; data: User }> {
  const response = await apiClient.put('/auth/profile', data)
  return response.data
}

/**
 * 修改密码
 */
export async function changePassword(data: ChangePasswordInput): Promise<{ success: boolean; message: string }> {
  const response = await apiClient.put('/auth/password', data)
  return response.data
}

/**
 * 用户登出
 */
export function logout(): void {
  localStorage.removeItem('token')
  localStorage.removeItem('user')
}
