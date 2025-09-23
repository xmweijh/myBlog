import { useState, useEffect } from 'react'

interface ApiStatus {
  status: string
  message: string
  timestamp: string
}

export default function HomePage() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 检查后端API连接状态
    const checkApiStatus = async () => {
      try {
        const response = await fetch('/api')
        const data = await response.json()
        setApiStatus({
          status: 'connected',
          message: data.message || 'API 连接成功',
          timestamp: new Date().toLocaleString('zh-CN')
        })
      } catch (error) {
        setApiStatus({
          status: 'error',
          message: 'API 连接失败，请确保后端服务正在运行',
          timestamp: new Date().toLocaleString('zh-CN')
        })
      } finally {
        setLoading(false)
      }
    }

    checkApiStatus()
  }, [])

  return (
    <div className="animate-fade-in">
      {/* Hero 区域 */}
      <section className="bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              欢迎来到 <span className="text-gradient">MyBlog</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              基于 React + Node.js + TypeScript 构建的现代化全栈博客系统
            </p>
            <div className="flex justify-center space-x-4">
              <button className="btn-primary px-8 py-3 text-lg">
                开始探索
              </button>
              <button className="btn-secondary px-8 py-3 text-lg">
                查看源码
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              主要特性
            </h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              现代化的技术栈，完整的功能体验，适合学习和实践全栈开发
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="card animate-slide-up hover:shadow-lg transition-shadow">
                <div className="text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* API 状态检查 */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              系统状态
            </h2>
          </div>

          <div className="card">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  后端 API 连接状态
                </h3>
                {loading ? (
                  <div className="flex items-center text-gray-600">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                    检查中...
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className={`flex items-center ${
                      apiStatus?.status === 'connected' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      <div className={`w-3 h-3 rounded-full mr-2 ${
                        apiStatus?.status === 'connected' ? 'bg-green-500' : 'bg-red-500'
                      }`}></div>
                      {apiStatus?.message}
                    </div>
                    <p className="text-sm text-gray-500">
                      检查时间: {apiStatus?.timestamp}
                    </p>
                  </div>
                )}
              </div>
              <button
                onClick={() => window.location.reload()}
                className="btn-ghost"
                disabled={loading}
              >
                刷新状态
              </button>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

// 功能特性数据
const features = [
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z"></path></svg>,
    title: '响应式设计',
    description: '基于 Tailwind CSS 构建的现代化界面，完美适配各种设备尺寸'
  },
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>,
    title: '类型安全',
    description: '全栈 TypeScript 开发，提供完整的类型检查和智能提示'
  },
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd"></path></svg>,
    title: '现代工具链',
    description: '使用 Vite、Prisma、Docker 等现代开发工具，提升开发体验'
  },
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>,
    title: '完整功能',
    description: '包含用户管理、文章发布、评论系统等完整的博客功能'
  },
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path></svg>,
    title: '安全可靠',
    description: '集成 JWT 认证、输入验证、速率限制等安全机制'
  },
  {
    icon: <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd"></path></svg>,
    title: '高性能',
    description: '优化的构建配置、代码分割、缓存策略，确保最佳性能表现'
  }
]
