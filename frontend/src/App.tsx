import { Routes, Route, Link, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import LoginPage from '@/pages/LoginPage'
import RegisterPage from '@/pages/RegisterPage'
import ArticleListPage from '@/pages/ArticleListPage'
import ArticleDetailPage from '@/pages/ArticleDetailPage'
import UserProfilePage from '@/pages/UserProfilePage'
import AdminPage from '@/pages/AdminPage'
import AdminArticlesPage from '@/pages/admin/AdminArticlesPage'
import AdminArticleForm from '@/pages/admin/AdminArticleForm'
import AdminCategoriesPage from '@/pages/admin/AdminCategoriesPage'
import AdminCategoryForm from '@/pages/admin/AdminCategoryForm'
import AdminTagsPage from '@/pages/admin/AdminTagsPage'
import AdminTagForm from '@/pages/admin/AdminTagForm'
import AdminUsersPage from '@/pages/admin/AdminUsersPage'
import NotFoundPage from '@/pages/NotFoundPage'
import { useAuthStore } from '@/stores/authStore'
import { logout } from '@/services/authService'

function App() {
  const navigate = useNavigate()
  const { user, isAuthenticated, restoreAuth, clearAuth } = useAuthStore()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 恢复认证信息
    restoreAuth()
    // 模拟应用初始化
    const timer = setTimeout(() => {
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [restoreAuth])

  const handleLogout = () => {
    logout()
    clearAuth()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">MyBlog 正在加载...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link to="/" className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">📝 MyBlog</h1>
            </Link>

            <div className="flex items-center space-x-8">
              <Link to="/" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                首页
              </Link>
              <Link to="/articles" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                文章
              </Link>
              <Link to="/about" className="text-gray-600 hover:text-gray-900 transition-colors font-medium">
                关于
              </Link>

              {isAuthenticated && user ? (
                <div className="flex items-center space-x-4">
                  <Link
                    to="/profile"
                    className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
                  >
                    <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full" />
                    <span className="text-gray-700 font-medium">{user.username}</span>
                  </Link>
                  {user.role === 'ADMIN' && (
                    <Link
                      to="/admin"
                      className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors font-medium"
                    >
                      管理后台
                    </Link>
                  )}
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors font-medium"
                  >
                    登出
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
                >
                  登录
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/articles" element={<ArticleListPage />} />
          <Route path="/articles/:id" element={<ArticleDetailPage />} />
          <Route path="/profile" element={<UserProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="/admin/articles" element={<AdminArticlesPage />} />
          <Route path="/admin/articles/create" element={<AdminArticleForm />} />
          <Route path="/admin/articles/:id/edit" element={<AdminArticleForm />} />
          <Route path="/admin/categories/create" element={<AdminCategoryForm />} />
          <Route path="/admin/categories/:id/edit" element={<AdminCategoryForm />} />
          <Route path="/admin/tags/create" element={<AdminTagForm />} />
          <Route path="/admin/tags/:id/edit" element={<AdminTagForm />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t mt-auto">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-gray-500 text-sm">
            © 2024 MyBlog. 基于 React + Node.js 构建的全栈博客系统
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App