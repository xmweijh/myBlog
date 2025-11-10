import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { User } from '@/services/authService'
interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null

  // 设置用户和令牌
  setAuth: (user: User, token: string) => void

  // 清除认证信息
  clearAuth: () => void

  // 更新用户信息
  updateUser: (user: User) => void

  // 设置加载状态
  setLoading: (loading: boolean) => void

  // 设置错误信息
  setError: (error: string | null) => void

  // 从本地存储恢复认证信息
  restoreAuth: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      setAuth: (user, token) => {
        set({
          user,
          token,
          isAuthenticated: true,
          error: null,
        })
        localStorage.setItem('token', token)
        localStorage.setItem('user', JSON.stringify(user))
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false,
          error: null,
        })
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      },

      updateUser: (user) => {
        set({ user })
        localStorage.setItem('user', JSON.stringify(user))
      },

      setLoading: (loading) => {
        set({ isLoading: loading })
      },

      setError: (error) => {
        set({ error })
      },

      restoreAuth: () => {
        const token = localStorage.getItem('token')
        const userStr = localStorage.getItem('user')

        if (token && userStr) {
          try {
            const user = JSON.parse(userStr)
            set({
              user,
              token,
              isAuthenticated: true,
            })
          } catch (error) {
            localStorage.removeItem('token')
            localStorage.removeItem('user')
          }
        }
      },
    }),
    {
      name: 'auth-store',
    }
  )
)
