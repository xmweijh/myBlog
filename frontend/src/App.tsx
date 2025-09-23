import { Routes, Route } from 'react-router-dom'
import { useState, useEffect } from 'react'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import NotFoundPage from '@/pages/NotFoundPage'

function App() {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 模拟应用初始化
    const timer = setTimeout(() => {
      setLoading(false)
    }, 1000)

    return () => clearTimeout(timer)
  }, [])

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
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">MyBlog</h1>
            </div>
            <div className="flex items-center space-x-8">
              <a href="/" className="text-gray-600 hover:text-gray-900 transition-colors">
                首页
              </a>
              <a href="/about" className="text-gray-600 hover:text-gray-900 transition-colors">
                关于
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* 页脚 */}
      <footer className="bg-white border-t">
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
