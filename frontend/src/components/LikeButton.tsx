import { useState, useEffect } from 'react'
import { useAuthStore } from '@/stores/authStore'
import { likeArticle, unlikeArticle, checkIfLiked } from '@/services/likeService'
interface LikeButtonProps {
  articleId: string
  likeCount: number
  onLikeChange?: (newCount: number) => void
}

export default function LikeButton({ articleId, likeCount, onLikeChange }: LikeButtonProps) {
  const { isAuthenticated } = useAuthStore()
  const [isLiked, setIsLiked] = useState(false)
  const [count, setCount] = useState(likeCount)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 检查是否已点赞
  useEffect(() => {
    const checkLike = async () => {
      if (!isAuthenticated) return

      try {
        const response = await checkIfLiked(articleId)
        setIsLiked(response.data.liked)
      } catch (err) {
        console.error('检查点赞状态失败:', err)
      }
    }

    checkLike()
  }, [articleId, isAuthenticated])

  const handleLike = async () => {
    if (!isAuthenticated) {
      setError('请登录后点赞')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      if (isLiked) {
        // 取消点赞
        await unlikeArticle(articleId)
        setIsLiked(false)
        const newCount = count - 1
        setCount(newCount)
        onLikeChange?.(newCount)
      } else {
        // 点赞
        await likeArticle(articleId)
        setIsLiked(true)
        const newCount = count + 1
        setCount(newCount)
        onLikeChange?.(newCount)
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : '操作失败'
      setError(message)
      // 恢复状态
      setIsLiked(!isLiked)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex items-center space-x-2">
      <button
        onClick={handleLike}
        disabled={isLoading}
        className={`flex items-center space-x-1 px-4 py-2 rounded-lg transition-all duration-200 ${
          isLiked
            ? 'bg-red-100 text-red-600 hover:bg-red-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        } disabled:opacity-50 disabled:cursor-not-allowed`}
        title={isAuthenticated ? (isLiked ? '取消点赞' : '点赞') : '请登录后点赞'}
      >
        <span className="text-lg">{isLiked ? '❤️' : '🤍'}</span>
        <span className="font-medium">{count}</span>
      </button>

      {error && (
        <div className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
          {error}
        </div>
      )}
    </div>
  )
}
