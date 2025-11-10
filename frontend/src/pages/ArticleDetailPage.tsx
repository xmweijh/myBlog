import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import CommentItem from '@/components/CommentItem'
import CommentForm from '@/components/CommentForm'
import LikeButton from '@/components/LikeButton'
import { getArticle } from '@/services/articleService'
import { getArticleComments, deleteComment } from '@/services/commentService'
import { formatFullDate } from '@/utils/date'
import { Article, Comment } from '@/services/articleService'
export default function ArticleDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const [article, setArticle] = useState<Article | null>(null)
  const [comments, setComments] = useState<Comment[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [replyingTo, setReplyingTo] = useState<string | null>(null)

  // 加载文章
  useEffect(() => {
    const loadArticle = async () => {
      if (!id) return

      setIsLoading(true)
      setError(null)

      try {
        const response = await getArticle(id)
        setArticle(response.data)
      } catch (err) {
        const message = err instanceof Error ? err.message : '加载文章失败'
        setError(message)
      } finally {
        setIsLoading(false)
      }
    }

    loadArticle()
  }, [id])

  // 加载评论
  useEffect(() => {
    const loadComments = async () => {
      if (!id) return

      try {
        const response = await getArticleComments(id)
        setComments(response.data)
      } catch (err) {
        console.error('加载评论失败:', err)
      }
    }

    loadComments()
  }, [id])

  // 处理删除评论
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm('确定要删除这条评论吗？')) return

    try {
      await deleteComment(commentId)
      setComments((prev) => prev.filter((c) => c.id !== commentId))
    } catch (err) {
      alert(err instanceof Error ? err.message : '删除评论失败')
    }
  }

  // 处理评论添加
  const handleCommentAdded = async () => {
    if (!id) return

    try {
      const response = await getArticleComments(id)
      setComments(response.data)
      setReplyingTo(null)
    } catch (err) {
      console.error('重新加载评论失败:', err)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载中...</p>
        </div>
      </div>
    )
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900 mb-4">文章不存在</h1>
            <p className="text-gray-600 mb-6">{error || '无法加载文章'}</p>
            <Link
              to="/articles"
              className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium"
            >
              返回文章列表
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 文章头部 */}
      <div className="bg-white border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* 返回按钮 */}
          <Link
            to="/articles"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
          >
            ← 返回文章列表
          </Link>

          {/* 标题 */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">{article.title}</h1>

          {/* 文章元信息 */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-600">
            {/* 作者 */}
            <div className="flex items-center space-x-2">
              <img
                src={article.author.avatar}
                alt={article.author.username}
                className="w-8 h-8 rounded-full"
              />
              <span>{article.author.username}</span>
            </div>

            {/* 发布时间 */}
            <div>📅 {formatFullDate(article.publishedAt || article.createdAt)}</div>

            {/* 分类 */}
            <Link
              to={`/articles?categoryId=${article.category.id}`}
              className="px-3 py-1 rounded-full text-white font-medium transition-opacity hover:opacity-80"
              style={{ backgroundColor: article.category.color }}
            >
              {article.category.name}
            </Link>

            {/* 统计信息和点赞按钮 */}
            <div className="flex items-center space-x-4">
              <span>👁 {article.viewCount} 浏览</span>
              <span>💬 {article._count.comments} 评论</span>
              <LikeButton
                articleId={article.id}
                likeCount={article.likeCount}
                onLikeChange={(newCount) => {
                  setArticle((prev) => prev ? { ...prev, likeCount: newCount } : null)
                }}
              />
            </div>
          </div>

          {/* 标签 */}
          {article.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {article.tags.map((tagObj) => (
                <Link
                  key={tagObj.tag.id}
                  to={`/articles?tagId=${tagObj.tag.id}`}
                  className="px-3 py-1 rounded-full text-white text-sm font-medium transition-opacity hover:opacity-80"
                  style={{ backgroundColor: tagObj.tag.color }}
                >
                  {tagObj.tag.name}
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 文章内容 */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* 封面图片 */}
        {article.coverImage && (
          <div className="mb-8 rounded-lg overflow-hidden">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* 文章正文 */}
        <div className="bg-white rounded-lg shadow-md p-8 mb-12 prose prose-sm max-w-none">
          <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
            {article.content}
          </div>
        </div>

        {/* 分割线 */}
        <div className="border-t-2 border-gray-200 my-12"></div>

        {/* 评论区 */}
        <div className="bg-white rounded-lg shadow-md p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">
            评论 ({article._count.comments})
          </h2>

          {/* 评论表单 */}
          <CommentForm
            articleId={article.id}
            onCommentAdded={handleCommentAdded}
          />

          {/* 评论列表 */}
          <div className="mt-12">
            {comments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-500">暂无评论，来发表第一条评论吧！</p>
              </div>
            ) : (
              comments.map((comment) => (
                <div key={comment.id}>
                  <CommentItem
                    comment={comment}
                    onReply={(commentId) => setReplyingTo(commentId)}
                    onDelete={handleDeleteComment}
                  />

                  {/* 回复表单 */}
                  {replyingTo === comment.id && (
                    <CommentForm
                      articleId={article.id}
                      parentId={comment.id}
                      onCommentAdded={handleCommentAdded}
                      onCancel={() => setReplyingTo(null)}
                      isReply={true}
                    />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
