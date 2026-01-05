import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createArticle, getArticle, updateArticle } from '@/services/articleService'
import { getCategories, getTags, Category, Tag } from '@/services/categoryTagService'

export default function AdminArticleForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    coverImage: '',
    categoryId: '',
    tagIds: [] as string[],
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
    isTop: false,
  })

  const [categories, setCategories] = useState<Category[]>([])
  const [tags, setTags] = useState<Tag[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 加载基础数据（分类和标签）
  useEffect(() => {
    const loadData = async () => {
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          getCategories(),
          getTags(),
        ])
        setCategories(categoriesRes.data)
        setTags(tagsRes.data)
      } catch (err) {
        console.error('加载基础数据失败:', err)
      }
    }
    loadData()
  }, [])

  // 加载文章数据（如果是编辑模式）
  useEffect(() => {
    if (isEditMode) {
      const loadArticle = async () => {
        try {
          const response = await getArticle(id)
          const article = response.data
          setFormData({
            title: article.title,
            slug: article.slug,
            excerpt: article.excerpt || '',
            content: article.content,
            coverImage: article.coverImage || '',
            categoryId: article.category.id,
            tagIds: article.tags.map((t: any) => t.tag.id),
            status: article.status as 'DRAFT' | 'PUBLISHED',
            isTop: article.isTop,
          })
        } catch (err) {
          setError('加载文章失败')
        }
      }
      loadArticle()
    }
  }, [id, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isEditMode) {
        await updateArticle(id, formData)
      } else {
        await createArticle(formData)
      }
      navigate('/admin/articles')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTagToggle = (tagId: string) => {
    setFormData(prev => {
      const newTagIds = prev.tagIds.includes(tagId)
        ? prev.tagIds.filter(id => id !== tagId)
        : [...prev.tagIds, tagId]
      return { ...prev, tagIds: newTagIds }
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/articles"
            className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← 返回文章列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? '编辑文章' : '发布新文章'}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* 基本信息 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文章标题
                </label>
                <input
                  type="text"
                  required
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Slug (URL别名)
                </label>
                <input
                  type="text"
                  required
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  分类
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">请选择分类</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 摘要和封面 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  文章摘要
                </label>
                <textarea
                  rows={3}
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  封面图片 URL
                </label>
                <input
                  type="url"
                  value={formData.coverImage}
                  onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
            </div>

            {/* 内容编辑器 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                文章内容 (Markdown)
              </label>
              <textarea
                required
                rows={20}
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            </div>

            {/* 标签选择 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                标签
              </label>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag) => (
                  <button
                    key={tag.id}
                    type="button"
                    onClick={() => handleTagToggle(tag.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      formData.tagIds.includes(tag.id)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {tag.name}
                  </button>
                ))}
              </div>
            </div>

            {/* 状态设置 */}
            <div className="flex items-center space-x-8 pt-4 border-t">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isTop"
                  checked={formData.isTop}
                  onChange={(e) => setFormData({ ...formData, isTop: e.target.checked })}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isTop" className="ml-2 block text-sm text-gray-900">
                  置顶文章
                </label>
              </div>

              <div className="flex items-center space-x-4">
                <label className="text-sm font-medium text-gray-700">状态:</label>
                <div className="flex items-center space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="DRAFT"
                      checked={formData.status === 'DRAFT'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' })}
                      className="form-radio text-blue-600"
                    />
                    <span className="ml-2">草稿</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="PUBLISHED"
                      checked={formData.status === 'PUBLISHED'}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value as 'PUBLISHED' })}
                      className="form-radio text-green-600"
                    />
                    <span className="ml-2">发布</span>
                  </label>
                </div>
              </div>
            </div>

            {/* 提交按钮 */}
            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/articles')}
                className="mr-4 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存文章'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}