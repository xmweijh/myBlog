import { useState } from 'react'
import { User } from '@/services/authService'
import { updateProfile } from '@/services/authService'
import { useAuthStore } from '@/stores/authStore'
interface ProfileEditFormProps {
  user: User
  onSave?: (user: User) => void
  onCancel?: () => void
}

export default function ProfileEditForm({ user, onSave, onCancel }: ProfileEditFormProps) {
  const { updateUser } = useAuthStore()
  const [formData, setFormData] = useState({
    username: user.username,
    avatar: user.avatar,
    bio: user.bio || '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // 验证
    if (!formData.username.trim()) {
      setError('用户名不能为空')
      return
    }

    if (formData.username.length < 2 || formData.username.length > 50) {
      setError('用户名长度必须在2-50个字符之间')
      return
    }

    if (formData.bio.length > 500) {
      setError('个人简介不能超过500个字符')
      return
    }

    setIsLoading(true)
    setError(null)
    setSuccess(false)

    try {
      const response = await updateProfile({
        username: formData.username,
        avatar: formData.avatar,
        bio: formData.bio,
      })

      updateUser(response.data)
      setSuccess(true)
      onSave?.(response.data)

      // 3秒后隐藏成功提示
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      const message = err instanceof Error ? err.message : '更新资料失败'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-8">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">编辑资料</h2>

      {/* 错误提示 */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 成功提示 */}
      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
          <p className="text-green-700">资料更新成功！</p>
        </div>
      )}

      {/* 用户名 */}
      <div className="mb-6">
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
          用户名
        </label>
        <input
          type="text"
          id="username"
          name="username"
          value={formData.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="请输入用户名"
        />
        <p className="mt-1 text-xs text-gray-500">2-50个字符</p>
      </div>

      {/* 头像URL */}
      <div className="mb-6">
        <label htmlFor="avatar" className="block text-sm font-medium text-gray-700 mb-2">
          头像URL
        </label>
        <input
          type="url"
          id="avatar"
          name="avatar"
          value={formData.avatar}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
          placeholder="请输入头像URL"
        />
        {formData.avatar && (
          <div className="mt-3">
            <p className="text-xs text-gray-500 mb-2">头像预览：</p>
            <img
              src={formData.avatar}
              alt="头像预览"
              className="w-16 h-16 rounded-full object-cover"
              onError={(e) => {
                e.currentTarget.src = 'https://ui-avatars.com/api/?name=User'
              }}
            />
          </div>
        )}
      </div>

      {/* 个人简介 */}
      <div className="mb-6">
        <label htmlFor="bio" className="block text-sm font-medium text-gray-700 mb-2">
          个人简介
        </label>
        <textarea
          id="bio"
          name="bio"
          value={formData.bio}
          onChange={handleChange}
          rows={4}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
          placeholder="请输入个人简介"
        />
        <div className="mt-1 flex justify-between items-center">
          <p className="text-xs text-gray-500">最多500个字符</p>
          <p className="text-xs text-gray-500">{formData.bio.length} / 500</p>
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex items-center justify-end space-x-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-6 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? '保存中...' : '保存'}
        </button>
      </div>
    </form>
  )
}
