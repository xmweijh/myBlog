import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '@/stores/authStore'
interface Stats {
  totalArticles: number
  totalCategories: number
  totalTags: number
  totalUsers: number
  totalComments: number
  totalLikes: number
}

export default function AdminPage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [stats, setStats] = useState<Stats>({
    totalArticles: 0,
    totalCategories: 0,
    totalTags: 0,
    totalUsers: 0,
    totalComments: 0,
    totalLikes: 0,
  })
  const [isLoading, setIsLoading] = useState(true)

  // 检查权限
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
      return
    }

    if (user.role !== 'ADMIN') {
      navigate('/')
      return
    }

    // 模拟加载统计数据
    setTimeout(() => {
      setStats({
        totalArticles: 4,
        totalCategories: 5,
        totalTags: 12,
        totalUsers: 3,
        totalComments: 4,
        totalLikes: 5,
      })
      setIsLoading(false)
    }, 500)
  }, [isAuthenticated, user, navigate])

  if (!isAuthenticated || !user || user.role !== 'ADMIN') {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-2">⚙️ 管理后台</h1>
          <p className="text-blue-100">欢迎回来，{user.username}！</p>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 统计卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* 文章统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">文章总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalArticles}</p>
              </div>
              <div className="text-4xl">📝</div>
            </div>
            <Link
              to="/admin/articles"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              管理文章 →
            </Link>
          </div>

          {/* 分类统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">分类总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalCategories}</p>
              </div>
              <div className="text-4xl">📂</div>
            </div>
            <Link
              to="/admin/categories"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              管理分类 →
            </Link>
          </div>

          {/* 标签统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">标签总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalTags}</p>
              </div>
              <div className="text-4xl">🏷️</div>
            </div>
            <Link
              to="/admin/tags"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              管理标签 →
            </Link>
          </div>

          {/* 用户统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">用户总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalUsers}</p>
              </div>
              <div className="text-4xl">👥</div>
            </div>
            <Link
              to="/admin/users"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              管理用户 →
            </Link>
          </div>

          {/* 评论统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">评论总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalComments}</p>
              </div>
              <div className="text-4xl">💬</div>
            </div>
            <Link
              to="/admin/comments"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              管理评论 →
            </Link>
          </div>

          {/* 点赞统计 */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium">点赞总数</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalLikes}</p>
              </div>
              <div className="text-4xl">❤️</div>
            </div>
            <Link
              to="/admin/likes"
              className="mt-4 inline-block text-blue-600 hover:text-blue-700 font-medium text-sm"
            >
              查看点赞 →
            </Link>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">快速操作</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 创建文章 */}
            <Link
              to="/admin/articles/create"
              className="p-4 border-2 border-blue-200 rounded-lg hover:bg-blue-50 transition-colors"
            >
              <div className="text-2xl mb-2">✍️</div>
              <h3 className="font-bold text-gray-900">创建文章</h3>
              <p className="text-sm text-gray-600 mt-1">发布新的博客文章</p>
            </Link>

            {/* 创建分类 */}
            <Link
              to="/admin/categories/create"
              className="p-4 border-2 border-green-200 rounded-lg hover:bg-green-50 transition-colors"
            >
              <div className="text-2xl mb-2">📁</div>
              <h3 className="font-bold text-gray-900">创建分类</h3>
              <p className="text-sm text-gray-600 mt-1">添加新的文章分类</p>
            </Link>

            {/* 创建标签 */}
            <Link
              to="/admin/tags/create"
              className="p-4 border-2 border-purple-200 rounded-lg hover:bg-purple-50 transition-colors"
            >
              <div className="text-2xl mb-2">🏷️</div>
              <h3 className="font-bold text-gray-900">创建标签</h3>
              <p className="text-sm text-gray-600 mt-1">添加新的文章标签</p>
            </Link>

            {/* 查看文章 */}
            <Link
              to="/articles"
              className="p-4 border-2 border-yellow-200 rounded-lg hover:bg-yellow-50 transition-colors"
            >
              <div className="text-2xl mb-2">👁️</div>
              <h3 className="font-bold text-gray-900">查看文章</h3>
              <p className="text-sm text-gray-600 mt-1">浏览所有已发布文章</p>
            </Link>

            {/* 用户管理 */}
            <Link
              to="/admin/users"
              className="p-4 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors"
            >
              <div className="text-2xl mb-2">👥</div>
              <h3 className="font-bold text-gray-900">用户管理</h3>
              <p className="text-sm text-gray-600 mt-1">管理系统用户</p>
            </Link>

            {/* 返回首页 */}
            <Link
              to="/"
              className="p-4 border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="text-2xl mb-2">🏠</div>
              <h3 className="font-bold text-gray-900">返回首页</h3>
              <p className="text-sm text-gray-600 mt-1">返回到应用首页</p>
            </Link>
          </div>
        </div>

        {/* 系统信息 */}
        <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-bold text-gray-900 mb-4">系统信息</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div>
              <span className="font-medium">当前用户:</span> {user.username}
            </div>
            <div>
              <span className="font-medium">用户角色:</span> {user.role}
            </div>
            <div>
              <span className="font-medium">邮箱:</span> {user.email}
            </div>
            <div>
              <span className="font-medium">账户状态:</span> {user.isActive ? '活跃' : '禁用'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
