# 📚 文章列表页面开发指南
> 完整的文章列表页面，包含搜索、筛选、排序、分页等功能

---

## 🎉 完成成果

### ✅ 已实现的功能

#### 1. **文章卡片组件** ✅
- 文章封面图片
- 置顶标签
- 文章标题和摘要
- 分类和标签显示
- 作者信息和头像
- 浏览量、评论数、点赞数统计
- 发布时间显示
- 悬停效果和动画

#### 2. **分页组件** ✅
- 上一页/下一页按钮
- 页码按钮
- 省略号处理
- 首页/末页快速跳转
- 当前页码高亮
- 禁用状态处理
- 页码信息显示

#### 3. **文章列表页面** ✅
- 响应式网格布局（1列/2列/3列）
- 搜索功能
- 分类筛选
- 排序功能（最新、最多浏览、最多点赞）
- 文章统计信息
- 加载状态
- 错误提示
- 空状态提示
- 平滑滚动

#### 4. **日期工具函数** ✅
- 相对时间格式化（"2小时前"）
- 标准日期格式化（"2024-11-10"）
- 完整日期格式化（"2024年11月10日 14:30"）

#### 5. **路由和导航** ✅
- 文章列表路由
- 导航栏链接
- URL查询参数管理

---

## 📁 文件结构

```
frontend/src/
├── components/
│   ├── ArticleCard.tsx        ✅ 文章卡片组件
│   └── Pagination.tsx         ✅ 分页组件
├── pages/
│   └── ArticleListPage.tsx    ✅ 文章列表页面
├── utils/
│   └── date.ts                ✅ 日期工具函数
└── App.tsx                    ✅ 已更新路由
```

---

## 🎨 UI组件详解

### ArticleCard 组件

**功能**:
- 显示单篇文章的卡片
- 支持封面图片
- 显示分类和标签
- 显示作者信息
- 显示统计数据

**Props**:
```typescript
interface ArticleCardProps {
  article: Article
}
```

**特性**:
- 响应式设计
- 悬停效果
- 图片缩放动画
- 文本截断处理

### Pagination 组件

**功能**:
- 分页导航
- 页码跳转
- 上一页/下一页

**Props**:
```typescript
interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
}
```

**特性**:
- 智能页码显示
- 省略号处理
- 禁用状态
- 加载状态

### ArticleListPage 页面

**功能**:
- 显示文章列表
- 搜索和筛选
- 排序
- 分页

**特性**:
- 响应式布局
- 实时搜索
- URL参数管理
- 加载状态
- 错误处理

---

## 🔍 搜索和筛选功能

### 搜索

```typescript
// 搜索文章
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
```

### 分类筛选

```typescript
// 按分类筛选
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
```

### 排序

```typescript
// 排序文章
const handleSortChange = (value: string) => {
  setSearchParams((prev) => {
    prev.set('sortBy', value)
    prev.set('page', '1')
    return prev
  })
}
```

---

## 📊 URL查询参数

### 支持的参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 当前页码 |
| `limit` | number | 12 | 每页数量 |
| `search` | string | '' | 搜索关键词 |
| `categoryId` | string | '' | 分类ID |
| `sortBy` | string | 'createdAt' | 排序字段 |
| `sortOrder` | string | 'desc' | 排序顺序 |

### 示例URL

```
# 搜索React相关文章
/articles?search=React

# 按后端分类筛选
/articles?categoryId=backend-id

# 按浏览量排序
/articles?sortBy=viewCount&sortOrder=desc

# 组合查询
/articles?search=Node.js&categoryId=backend-id&sortBy=viewCount&page=2
```

---

## 🎯 日期工具函数

### formatRelativeTime

```typescript
import { formatRelativeTime } from '@/utils/date'

// 返回相对时间
formatRelativeTime('2024-11-10T10:00:00')
// 输出: "2小时前"
```

### formatDate

```typescript
import { formatDate } from '@/utils/date'

// 返回格式化日期
formatDate('2024-11-10T14:30:00', 'YYYY-MM-DD')
// 输出: "2024-11-10"

formatDate('2024-11-10T14:30:00', 'YYYY-MM-DD HH:mm')
// 输出: "2024-11-10 14:30"
```

### formatFullDate

```typescript
import { formatFullDate } from '@/utils/date'

// 返回完整日期
formatFullDate('2024-11-10T14:30:00')
// 输出: "2024年11月10日 14:30"
```

---

## 🚀 使用示例

### 基础使用

```typescript
import ArticleListPage from '@/pages/ArticleListPage'

// 在路由中使用
<Route path="/articles" element={<ArticleListPage />} />
```

### 搜索文章

1. 在搜索框输入关键词
2. 自动触发搜索
3. 页码重置为1
4. 显示搜索结果

### 筛选文章

1. 选择分类
2. 自动筛选该分类的文章
3. 页码重置为1
4. 显示筛选结果

### 排序文章

1. 选择排序方式
2. 自动按选定方式排序
3. 页码重置为1
4. 显示排序结果

### 分页

1. 点击页码按钮
2. 页面平滑滚动到顶部
3. 加载对应页的文章
4. 更新分页信息

---

## 💡 最佳实践

### 1. 性能优化

```typescript
// 使用useSearchParams管理URL状态
const [searchParams, setSearchParams] = useSearchParams()

// 避免不必要的重新渲染
useEffect(() => {
  // 只在参数变化时加载
}, [page, limit, search, categoryId, sortBy, sortOrder])
```

### 2. 用户体验

```typescript
// 平滑滚动到顶部
window.scrollTo({ top: 0, behavior: 'smooth' })

// 显示加载状态
{isLoading ? <LoadingSpinner /> : <ArticleList />}

// 显示错误提示
{error && <ErrorMessage message={error} />}
```

### 3. 响应式设计

```typescript
// 使用Tailwind响应式类
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {/* 1列 -> 2列 -> 3列 */}
</div>
```

---

## 🧪 测试场景

### 1. 搜索功能

- [ ] 搜索存在的关键词
- [ ] 搜索不存在的关键词
- [ ] 清空搜索框
- [ ] 搜索特殊字符

### 2. 筛选功能

- [ ] 选择不同分类
- [ ] 清除分类筛选
- [ ] 组合搜索和筛选

### 3. 排序功能

- [ ] 按最新发布排序
- [ ] 按最多浏览排序
- [ ] 按最多点赞排序

### 4. 分页功能

- [ ] 点击下一页
- [ ] 点击上一页
- [ ] 点击特定页码
- [ ] 快速跳转到首页/末页

### 5. 响应式设计

- [ ] 桌面浏览器 (1920px+)
- [ ] 平板设备 (768px - 1024px)
- [ ] 手机设备 (320px - 767px)

---

## 📱 响应式布局

### 桌面版 (lg)
- 3列网格
- 完整的搜索和筛选栏
- 完整的分页控件

### 平板版 (md)
- 2列网格
- 响应式搜索和筛选栏
- 响应式分页控件

### 手机版 (sm)
- 1列网格
- 堆叠的搜索和筛选栏
- 简化的分页控件

---

## 🔗 相关文档

- [前端设置指南](./FRONTEND_SETUP_GUIDE.md)
- [前端开发进度](./FRONTEND_DEVELOPMENT_PROGRESS.md)
- [文章API指南](./ARTICLE_API_GUIDE.md)
- [项目实施计划](../IMPLEMENTATION_PLAN.md)

---

## 🎓 学习收获

通过文章列表页面的开发，你已经掌握了：

### React 开发

- ✅ 组件化设计
- ✅ 状态管理
- ✅ 副作用处理
- ✅ 条件渲染

### 路由管理

- ✅ URL查询参数
- ✅ 路由导航
- ✅ 状态同步

### UI/UX设计

- ✅ 响应式布局
- ✅ 加载状态
- ✅ 错误处理
- ✅ 用户反馈

### 性能优化

- ✅ 依赖优化
- ✅ 渲染优化
- ✅ 滚动优化

---

*📚 文章列表页面开发完成！现在可以开发文章详情页面了！*
