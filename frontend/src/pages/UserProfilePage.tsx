import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import ProfileEditForm from '@/components/ProfileEditForm'
import ArticleCard from '@/components/ArticleCard'
import Pagination from '@/components/Pagination'
import { useAuthStore } from '@/stores/authStore'
import { getUserArticles } from '@/services/articleService'
import { Article } from '@/services/articleService'
import { formatFullDate } from '@/utils/date'
export default function UserProfilePage() {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()
  const [isEditing, setIsEditing] = useState(false)
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })

  // 检查认证状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login')
    }
  }, [isAuthenticated, user, navigate])

  // 加载用户文章
  useEffect(() => {
    const loadArticles = async () => {
      if (!user) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await getUserArticles(user.id, {
          page,
          limit: 12,
        })

        setArticles(response.data)
        setPagination(response.pagination)
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载文章失败'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadArticles()
  }, [user, page])

  if (!isAuthenticated || !user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 用户头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center space-x-6">
            {/* 用户头像 */}
            <img
              src={user.avatar}
              alt={user.username}
              className="w-24 h-24 rounded-full border-4 border-white"
            />

            {/* 用户信息 */}
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{user.username}</h1>
              <p className="text-blue-100 mb-4">{user.bio || '这个用户还没有添加个人简介'}</p>

              {/* 用户统计 */}
              <div className="flex items-center space-x-6 text-sm">
                <div>
                  <span className="font-bold text-lg">{pagination.total}</span>
                  <span className="text-blue-100 ml-2">篇文章</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{user.role}</span>
                  <span className="text-blue-100 ml-2">角色</span>
                </div>
                <div>
                  <span className="font-bold text-lg">{formatFullDate(user.createdAt).split(' ')[0]}</span>
                  <span className="text-blue-100 ml-2">加入</span>
                </div>
              </div>
            </div>

            {/* 编辑按钮 */}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-6 py-2 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors font-medium"
            >
              {isEditing ? '取消编辑' : '编辑资料'}
            </button>
          </div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 编辑表单 */}
        {isEditing && (
          <div className="mb-12">
            <ProfileEditForm
              user={user}
              onSave={() => setIsEditing(false)}
              onCancel={() => setIsEditing(false)}
            />
          </div>
        )}

        {/* 用户文章 */}
        <div>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">📝 我的文章</h2>

          {/* 错误提示 */}
          {error && (
            <div className="mb-8 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {/* 加载状态 */}
          {isLoading ? (
            <div className="flex justify-center items-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">加载中...</p>
              </div>
            </div>
          ) : articles.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-lg shadow-md">
              <p className="text-gray-500 text-lg mb-4">还没有发表任何文章</p>
              <Link
                to="/articles"
                className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
              >
                浏览文章
              </Link>
            </div>
          ) : (
            <>
              {/* 文章网格 */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {articles.map((article) => (
                  <ArticleCard key={article.id} article={article} />
                ))}
              </div>

              {/* 分页 */}
              <Pagination
                page={pagination.page}
                totalPages={pagination.totalPages}
                onPageChange={setPage}
                isLoading={isLoading}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}
