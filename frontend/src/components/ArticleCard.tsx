import { Link } from 'react-router-dom'
import { Article } from '@/services/articleService'
import { formatDate } from '@/utils/date'
interface ArticleCardProps {
  article: Article
}

export default function ArticleCard({ article }: ArticleCardProps) {
  return (
    <Link to={`/articles/${article.id}`}>
      <div className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden h-full flex flex-col">
        {/* 封面图片 */}
        {article.coverImage && (
          <div className="relative h-48 overflow-hidden bg-gray-200">
            <img
              src={article.coverImage}
              alt={article.title}
              className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
            />
            {article.isTop && (
              <div className="absolute top-2 right-2 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-bold">
                置顶
              </div>
            )}
          </div>
        )}

        {/* 内容 */}
        <div className="p-4 flex-1 flex flex-col">
          {/* 标题 */}
          <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {article.title}
          </h3>

          {/* 摘要 */}
          <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-1">
            {article.excerpt || article.content.substring(0, 100)}
          </p>

          {/* 分类和标签 */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span
              className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
              style={{ backgroundColor: article.category.color }}
            >
              {article.category.name}
            </span>
            {article.tags.slice(0, 2).map((tagObj) => (
              <span
                key={tagObj.tag.id}
                className="inline-block px-3 py-1 rounded-full text-xs font-medium text-white"
                style={{ backgroundColor: tagObj.tag.color }}
              >
                {tagObj.tag.name}
              </span>
            ))}
            {article.tags.length > 2 && (
              <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-gray-300 text-gray-700">
                +{article.tags.length - 2}
              </span>
            )}
          </div>

          {/* 底部信息 */}
          <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
            <div className="flex items-center space-x-2">
              <img
                src={article.author.avatar}
                alt={article.author.username}
                className="w-6 h-6 rounded-full"
              />
              <span>{article.author.username}</span>
            </div>
            <div className="flex items-center space-x-3">
              <span>👁 {article.viewCount}</span>
              <span>💬 {article._count.comments}</span>
              <span>❤️ {article.likeCount}</span>
            </div>
          </div>

          {/* 发布时间 */}
          <div className="text-xs text-gray-400 mt-2">
            {formatDate(article.publishedAt || article.createdAt)}
          </div>
        </div>
      </div>
    </Link>
  )
}
