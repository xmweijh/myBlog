import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
import { register } from '@/services/authService'
interface FormData {
  email: string
  username: string
  password: string
  confirmPassword: string
}

interface FormErrors {
  email?: string
  username?: string
  password?: string
  confirmPassword?: string
  general?: string
}

export default function RegisterPage() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const [formData, setFormData] = useState<FormData>({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // 验证邮箱格式
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  // 验证用户名
  const validateUsername = (username: string): boolean => {
    return username.length >= 2 && username.length <= 50
  }

  // 验证密码强度
  const validatePassword = (password: string): boolean => {
    return password.length >= 6 && password.length <= 100
  }

  // 表单验证
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {}

    // 验证邮箱
    if (!formData.email.trim()) {
      newErrors.email = '邮箱不能为空'
    } else if (!validateEmail(formData.email)) {
      newErrors.email = '邮箱格式不正确'
    }

    // 验证用户名
    if (!formData.username.trim()) {
      newErrors.username = '用户名不能为空'
    } else if (!validateUsername(formData.username)) {
      newErrors.username = '用户名长度必须在2-50个字符之间'
    }

    // 验证密码
    if (!formData.password) {
      newErrors.password = '密码不能为空'
    } else if (!validatePassword(formData.password)) {
      newErrors.password = '密码长度必须在6-100个字符之间'
    }

    // 验证确认密码
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '请确认密码'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '两次输入的密码不一致'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
    // 清除该字段的错误
    if (errors[name as keyof FormErrors]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) {
      return
    }

    setIsLoading(true)
    setErrors({})

    try {
      const response = await register({
        email: formData.email,
        username: formData.username,
        password: formData.password,
      })

      setAuth(response.data.user, response.data.token)
      navigate('/')
    } catch (err) {
      const message = err instanceof Error ? err.message : '注册失败'
      setErrors({ general: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-md">
        <h1 className="text-3xl font-bold text-center text-gray-900 mb-2">注册 MyBlog</h1>
        <p className="text-center text-gray-600 mb-8">创建账号开始写作</p>

        {/* 通用错误提示 */}
        {errors.general && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{errors.general}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 邮箱 */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              邮箱
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.email ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入邮箱"
            />
            {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
          </div>

          {/* 用户名 */}
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
              用户名
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                errors.username ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="请输入用户名"
            />
            {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
            <p className="mt-1 text-xs text-gray-500">2-50个字符</p>
          </div>

          {/* 密码 */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
              密码
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.password ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请输入密码"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showPassword ? '隐藏' : '显示'}
              </button>
            </div>
            {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
            <p className="mt-1 text-xs text-gray-500">6-100个字符</p>
          </div>

          {/* 确认密码 */}
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <div className="relative">
              <input
                type={showConfirmPassword ? 'text' : 'password'}
                id="confirmPassword"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition ${
                  errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="请再次输入密码"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-2.5 text-gray-500 hover:text-gray-700"
              >
                {showConfirmPassword ? '隐藏' : '显示'}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="mt-1 text-xs text-red-600">{errors.confirmPassword}</p>
            )}
          </div>

          {/* 注册按钮 */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-medium py-2 rounded-lg transition duration-200 mt-6"
          >
            {isLoading ? '注册中...' : '注册'}
          </button>
        </form>

        {/* 登录链接 */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            已有账号？{' '}
            <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
              立即登录
            </Link>
          </p>
        </div>

        {/* 密码要求提示 */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-700 text-xs font-medium mb-2">密码要求：</p>
          <ul className="text-blue-600 text-xs space-y-1">
            <li>✓ 长度至少6个字符</li>
            <li>✓ 最多100个字符</li>
            <li>✓ 两次输入必须一致</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
