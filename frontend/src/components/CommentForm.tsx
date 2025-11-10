import { useState } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { createComment } from '@/services/commentService'
interface CommentFormProps {
  articleId: string
  parentId?: string
  onCommentAdded?: () => void
  onCancel?: () => void
  isReply?: boolean
}

export default function CommentForm({
  articleId,
  parentId,
  onCommentAdded,
  onCancel,
  isReply = false,
}: CommentFormProps) {
  const { isAuthenticated, user } = useAuthStore()
  const [content, setContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!content.trim()) {
      setError('评论内容不能为空')
      return
    }

    if (content.length > 5000) {
      setError('评论内容不能超过5000个字符')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      await createComment({
        content: content.trim(),
        articleId,
        parentId,
      })

      setContent('')
      onCommentAdded?.()
    } catch (err) {
      const message = err instanceof Error ? err.message : '发表评论失败'
      setError(message)
    } finally {
      setIsLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
      <div className={`${isReply ? 'ml-8' : ''} bg-blue-50 border border-blue-200 rounded-lg p-4 text-center`}>
        <p className="text-blue-700 text-sm">
          请 <a href="/login" className="font-medium hover:underline">登录</a> 后发表评论
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className={`${isReply ? 'ml-8' : ''} mt-6`}>
      {/* 用户信息 */}
      <div className="flex items-center space-x-3 mb-4">
        <img
          src={user?.avatar}
          alt={user?.username}
          className="w-10 h-10 rounded-full"
        />
        <span className="font-medium text-gray-900">{user?.username}</span>
      </div>

      {/* 错误提示 */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {/* 评论框 */}
      <div className="mb-4">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={isReply ? '写下你的回复...' : '写下你的评论...'}
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
        />
        <div className="mt-2 text-xs text-gray-500">
          {content.length} / 5000
        </div>
      </div>

      {/* 按钮 */}
      <div className="flex items-center justify-end space-x-3">
        {isReply && onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
          >
            取消
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading || !content.trim()}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg transition-colors font-medium"
        >
          {isLoading ? '发表中...' : isReply ? '回复' : '发表评论'}
        </button>
      </div>
    </form>
  )
}
