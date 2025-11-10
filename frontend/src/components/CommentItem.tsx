import { Comment } from '@/services/commentService'
import { formatRelativeTime } from '@/utils/date'
import { useAuthStore } from '@/stores/authStore'
interface CommentItemProps {
  comment: Comment
  onReply?: (commentId: string) => void
  onDelete?: (commentId: string) => void
  isReply?: boolean
}

export default function CommentItem({ comment, onReply, onDelete, isReply = false }: CommentItemProps) {
  const { user, isAuthenticated } = useAuthStore()
  const isAuthor = isAuthenticated && user?.id === comment.authorId

  return (
    <div className={`${isReply ? 'ml-8 mt-4' : 'mt-6'} pb-6 border-b last:border-b-0`}>
      {/* 评论头部 */}
      <div className="flex items-start space-x-3">
        {/* 用户头像 */}
        <img
          src={comment.author.avatar}
          alt={comment.author.username}
          className="w-10 h-10 rounded-full flex-shrink-0"
        />

        {/* 评论内容 */}
        <div className="flex-1 min-w-0">
          {/* 用户名和时间 */}
          <div className="flex items-center space-x-2">
            <span className="font-medium text-gray-900">{comment.author.username}</span>
            <span className="text-xs text-gray-500">{formatRelativeTime(comment.createdAt)}</span>
          </div>

          {/* 评论文本 */}
          <p className="mt-2 text-gray-700 break-words">{comment.content}</p>

          {/* 操作按钮 */}
          <div className="mt-2 flex items-center space-x-4">
            {!isReply && onReply && (
              <button
                onClick={() => onReply(comment.id)}
                className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                回复
              </button>
            )}
            {isAuthor && onDelete && (
              <button
                onClick={() => onDelete(comment.id)}
                className="text-xs text-red-600 hover:text-red-700 font-medium transition-colors"
              >
                删除
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 回复列表 */}
      {comment.replies && comment.replies.length > 0 && (
        <div className="mt-4">
          {comment.replies.map((reply) => (
            <CommentItem
              key={reply.id}
              comment={reply}
              onReply={onReply}
              onDelete={onDelete}
              isReply={true}
            />
          ))}
        </div>
      )}
    </div>
  )
}
