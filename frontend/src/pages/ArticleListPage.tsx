import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ArticleCard from '@/components/ArticleCard'
import Pagination from '@/components/Pagination'
import { getArticles, getArticle } from '@/services/articleService'
import { getCategories } from '@/services/categoryTagService'
import { Article, Category } from '@/services/articleService'
export default function ArticleListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const [articles, setArticles] = useState<Article[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 查询参数
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '12')
  const search = searchParams.get('search') || ''
  const categoryId = searchParams.get('categoryId') || ''
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = (searchParams.get('sortOrder') || 'desc') as 'asc' | 'desc'

  // 分页信息
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 1,
    hasNext: false,
    hasPrev: false,
  })

  // 加载分类
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await getCategories()
        setCategories(response.data)
      } catch (err) {
        console.error('加载分类失败:', err)
      }
    }

    loadCategories()
  }, [])

  // 加载文章
  useEffect(() => {
    const loadArticles = async () => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await getArticles({
          page,
          limit,
          search: search || undefined,
          categoryId: categoryId || undefined,
          sortBy,
          sortOrder,
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
  }, [page, limit, search, categoryId, sortBy, sortOrder])

  // 处理页码变化
  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      prev.set('page', String(newPage))
      return prev
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  // 处理搜索
  const handleSearch = (value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set('search', value)
      } else {
        prev.delete('search')
      }
      prev.set('page', '1')
      return prev
    })
  }

  // 处理分类筛选
  const handleCategoryChange = (value: string) => {
    setSearchParams((prev) => {
      if (value) {
        prev.set('categoryId', value)
      } else {
        prev.delete('categoryId')
      }
      prev.set('page', '1')
      return prev
    })
  }

  // 处理排序
  const handleSortChange = (value: string) => {
    setSearchParams((prev) => {
      prev.set('sortBy', value)
      prev.set('page', '1')
      return prev
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold mb-4">📚 文章列表</h1>
          <p className="text-blue-100">发现有趣的技术文章和分享</p>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 搜索和筛选 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* 搜索框 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">搜索</label>
              <input
                type="text"
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder="搜索文章..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              />
            </div>

            {/* 分类筛选 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">分类</label>
              <select
                value={categoryId}
                onChange={(e) => handleCategoryChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="">全部分类</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            {/* 排序 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">排序</label>
              <select
                value={sortBy}
                onChange={(e) => handleSortChange(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
              >
                <option value="createdAt">最新发布</option>
                <option value="viewCount">最多浏览</option>
                <option value="likeCount">最多点赞</option>
              </select>
            </div>

            {/* 统计信息 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">统计</label>
              <div className="px-4 py-2 bg-blue-50 rounded-lg text-blue-700 font-medium">
                共 {pagination.total} 篇文章
              </div>
            </div>
          </div>
        </div>

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
          <div className="text-center py-12">
            <p className="text-gray-500 text-lg">暂无文章</p>
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
              onPageChange={handlePageChange}
              isLoading={isLoading}
            />
          </>
        )}
      </div>
    </div>
  )
}
