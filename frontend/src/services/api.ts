import axios, { AxiosInstance, AxiosError } from 'axios'
// API 基础配置
const fallbackApiUrl = typeof window !== 'undefined'
  ? `http://${window.location.hostname}:3000`
  : 'http://localhost:3000'
const API_BASE_URL = import.meta.env.VITE_API_URL || fallbackApiUrl

// 创建 axios 实例
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求拦截器 - 添加认证令牌
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误和令牌过期
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // 处理 401 未认证错误
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }

    // 处理其他错误
    const message = (error.response?.data as any)?.error || error.message || '请求失败'
    return Promise.reject(new Error(message))
  }
)

export default apiClient
