import { useState, useEffect } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { createTag, getTag, updateTag } from '@/services/categoryTagService'

export default function AdminTagForm() {
  const navigate = useNavigate()
  const { id } = useParams<{ id: string }>()
  const isEditMode = !!id

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    color: '#6B7280',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (isEditMode) {
      const loadTag = async () => {
        try {
          const response = await getTag(id)
          const { name, slug, color } = response.data
          setFormData({
            name,
            slug,
            color: color || '#6B7280',
          })
        } catch (err) {
          setError('加载标签失败')
        }
      }
      loadTag()
    }
  }, [id, isEditMode])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError(null)

    try {
      if (isEditMode) {
        await updateTag(id, formData)
      } else {
        await createTag(formData)
      }
      navigate('/admin/tags')
    } catch (err) {
      const message = err instanceof Error ? err.message : '保存失败'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link
            to="/admin/tags"
            className="text-gray-600 hover:text-gray-900 mb-4 inline-block"
          >
            ← 返回标签列表
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditMode ? '编辑标签' : '创建新标签'}
          </h1>
        </div>

        <div className="bg-white rounded-lg shadow p-8">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                标签名称
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              <p className="mt-1 text-sm text-gray-500">
                用于URL中，只能包含字母、数字和连字符
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                颜色
              </label>
              <div className="flex items-center space-x-4">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="h-10 w-20 p-1 rounded border border-gray-300"
                />
                <span className="text-gray-600">{formData.color}</span>
              </div>
            </div>

            <div className="flex justify-end pt-6">
              <button
                type="button"
                onClick={() => navigate('/admin/tags')}
                className="mr-4 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
              >
                取消
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? '保存中...' : '保存'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}