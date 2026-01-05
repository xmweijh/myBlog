import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { getArticles, deleteArticle, Article } from '@/services/articleService'
import { formatFullDate } from '@/utils/date'

export default function AdminArticlesPage() {
  const [articles, setArticles] = useState<Article[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const loadArticles = async () => {
    setIsLoading(true)
    try {
      // 管理员调用 getArticles 时，后端会返回所有状态的文章
      const response = await getArticles({ page, limit: 10 })
      setArticles(response.data)
      setTotalPages(response.pagination.totalPages)
    } catch (err) {
      console.error('加载文章失败:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadArticles()
  }, [page])

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这篇文章吗？此操作不可恢复。')) return

    try {
      await deleteArticle(id)
      loadArticles() // 重新加载列表
    } catch (err) {
      alert('删除失败')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">文章管理</h1>
          <div className="space-x-4">
            <Link
              to="/admin"
              className="text-gray-600 hover:text-gray-900"
            >
              返回仪表盘
            </Link>
            <Link
              to="/admin/articles/create"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              发布新文章
            </Link>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  标题
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  作者
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  分类
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  发布时间
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    加载中...
                  </td>
                </tr>
              ) : articles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                    暂无文章
                  </td>
                </tr>
              ) : (
                articles.map((article) => (
                  <tr key={article.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900 truncate max-w-xs">
                        <Link to={`/articles/${article.id}`} className="hover:text-blue-600">
                          {article.title}
                        </Link>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          className="h-8 w-8 rounded-full"
                          src={article.author.avatar}
                          alt=""
                        />
                        <div className="ml-3">
                          <div className="text-sm text-gray-900">{article.author.username}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full text-white"
                        style={{ backgroundColor: article.category.color }}
                      >
                        {article.category.name}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          article.status === 'PUBLISHED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.status === 'PUBLISHED' ? '已发布' : '草稿'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFullDate(article.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <Link
                        to={`/articles/${article.id}/edit`}
                        className="text-indigo-600 hover:text-indigo-900 mr-4"
                      >
                        编辑
                      </Link>
                      <button
                        onClick={() => handleDelete(article.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="mt-4 flex justify-center">
          <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              上一页
            </button>
            <span className="relative inline-flex items-center px-4 py-2 border border-gray-300 bg-white text-sm font-medium text-gray-700">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
            >
              下一页
            </button>
          </nav>
        </div>
      </div>
    </div>
  )
}