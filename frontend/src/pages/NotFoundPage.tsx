import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4">
      <div className="text-center animate-fade-in">
        <div className="mb-8">
          <h1 className="text-9xl font-bold text-gray-300 mb-4">404</h1>
          <div className="w-24 h-1 bg-blue-500 mx-auto mb-8"></div>
        </div>

        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          页面未找到
        </h2>

        <p className="text-xl text-gray-600 mb-8 max-w-md mx-auto">
          抱歉，您访问的页面不存在。可能是链接错误或页面已被移除。
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/"
            className="btn-primary px-6 py-3 text-lg inline-block"
          >
            返回首页
          </Link>

          <button
            onClick={() => window.history.back()}
            className="btn-secondary px-6 py-3 text-lg"
          >
            返回上页
          </button>
        </div>

        <div className="mt-12 text-gray-500">
          <p className="text-sm">
            如果您认为这是一个错误，请
            <a href="mailto:contact@myblog.com" className="text-blue-600 hover:underline ml-1">
              联系我们
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}
