# 📝 MyBlog 文章管理API指南
> 完整的文章CRUD操作、搜索、筛选、分页功能

---

## 🎉 实现成果

### ✅ 核心功能

- **创建文章** - 支持标题、内容、分类、标签、状态等
- **获取文章列表** - 支持分页、搜索、筛选、排序
- **获取文章详情** - 包含作者、分类、标签、评论、点赞信息
- **更新文章** - 支持修改所有字段，权限控制
- **删除文章** - 级联删除相关数据
- **用户文章列表** - 获取特定用户的文章

### 📊 API端点一览

| 端点 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/articles` | POST | 创建文章 | Private |
| `/api/articles` | GET | 获取文章列表 | Public |
| `/api/articles/:id` | GET | 获取文章详情 | Public |
| `/api/articles/:id` | PUT | 更新文章 | Private (作者/管理员) |
| `/api/articles/:id` | DELETE | 删除文章 | Private (作者/管理员) |
| `/api/articles/user/:userId` | GET | 获取用户文章列表 | Public |

---

## 🏗️ 系统架构

### 文章管理流程

```
┌─────────────────────────────────────────────────────────┐
│                    文章管理系统                          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  创建文章                                               │
│  ├─ 验证输入（标题、内容、分类）                        │
│  ├─ 检查slug唯一性                                      │
│  ├─ 验证分类和标签存在                                  │
│  ├─ 创建文章记录                                        │
│  └─ 关联标签                                            │
│                                                         │
│  获取文章列表                                           │
│  ├─ 权限检查（草稿只显示给作者）                        │
│  ├─ 构建查询条件                                        │
│  │  ├─ 分类筛选                                         │
│  │  ├─ 标签筛选                                         │
│  │  ├─ 作者筛选                                         │
│  │  ├─ 全文搜索                                         │
│  │  └─ 状态筛选                                         │
│  ├─ 排序和分页                                          │
│  └─ 返回统计信息                                        │
│                                                         │
│  获取文章详情                                           │
│  ├─ 权限检查                                            │
│  ├─ 增加浏览量                                          │
│  ├─ 加载关联数据                                        │
│  │  ├─ 作者信息                                         │
│  │  ├─ 分类信息                                         │
│  │  ├─ 标签列表                                         │
│  │  ├─ 评论列表（含回复）                               │
│  │  └─ 点赞统计                                         │
│  └─ 返回完整数据                                        │
│                                                         │
│  更新文章                                               │
│  ├─ 权限检查（作者或管理员）                            │
│  ├─ 验证新数据                                          │
│  ├─ 更新文章字段                                        │
│  ├─ 更新标签关联                                        │
│  └─ 返回更新后的数据                                    │
│                                                         │
│  删除文章                                               │
│  ├─ 权限检查                                            │
│  ├─ 级联删除评论和点赞                                  │
│  └─ 返回成功消息                                        │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 📝 API使用示例

### 1. 创建文章

**请求：**
```bash
curl -X POST http://localhost:3001/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "我的第一篇文章",
    "slug": "my-first-article",
    "excerpt": "这是我的第一篇文章摘要",
    "content": "这是文章的完整内容，至少需要10个字符...",
    "coverImage": "https://example.com/image.jpg",
    "categoryId": "category-id",
    "tagIds": ["tag-id-1", "tag-id-2"],
    "status": "PUBLISHED",
    "isTop": false
  }'
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "article-id",
    "title": "我的第一篇文章",
    "slug": "my-first-article",
    "excerpt": "这是我的第一篇文章摘要",
    "content": "这是文章的完整内容...",
    "status": "PUBLISHED",
    "isTop": false,
    "viewCount": 0,
    "likeCount": 0,
    "publishedAt": "2025-11-10T14:06:03.262Z",
    "createdAt": "2025-11-10T14:06:03.263Z",
    "updatedAt": "2025-11-10T14:06:03.263Z",
    "author": {
      "id": "user-id",
      "username": "admin",
      "avatar": "https://..."
    },
    "category": {
      "id": "category-id",
      "name": "后端开发",
      "slug": "backend"
    },
    "tags": [
      {
        "tag": {
          "id": "tag-id-1",
          "name": "Node.js",
          "slug": "nodejs"
        }
      }
    ],
    "_count": {
      "comments": 0,
      "likes": 0
    }
  },
  "message": "文章创建成功",
  "timestamp": "2025-11-10T14:06:03.270Z"
}
```

### 2. 获取文章列表

**基础请求：**
```bash
curl "http://localhost:3001/api/articles?page=1&limit=10"
```

**带搜索的请求：**
```bash
curl "http://localhost:3001/api/articles?search=React&page=1&limit=10"
```

**按分类筛选：**
```bash
curl "http://localhost:3001/api/articles?categoryId=category-id&page=1&limit=10"
```

**按标签筛选：**
```bash
curl "http://localhost:3001/api/articles?tagId=tag-id&page=1&limit=10"
```

**按作者筛选：**
```bash
curl "http://localhost:3001/api/articles?authorId=user-id&page=1&limit=10"
```

**排序和分页：**
```bash
curl "http://localhost:3001/api/articles?sortBy=viewCount&sortOrder=desc&page=1&limit=10"
```

**响应：**
```json
{
  "success": true,
  "data": [
    {
      "id": "article-id",
      "title": "文章标题",
      "slug": "article-slug",
      "excerpt": "文章摘要",
      "status": "PUBLISHED",
      "viewCount": 156,
      "likeCount": 5,
      "author": {
        "id": "user-id",
        "username": "admin",
        "avatar": "https://..."
      },
      "category": {
        "id": "category-id",
        "name": "后端开发"
      },
      "tags": [...],
      "_count": {
        "comments": 3,
        "likes": 5
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2025-11-10T14:06:03.270Z"
}
```

### 3. 获取文章详情

**请求：**
```bash
curl "http://localhost:3001/api/articles/article-id"
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "article-id",
    "title": "文章标题",
    "content": "完整的文章内容...",
    "author": {
      "id": "user-id",
      "username": "admin",
      "avatar": "https://...",
      "bio": "用户简介"
    },
    "category": {...},
    "tags": [...],
    "comments": [
      {
        "id": "comment-id",
        "content": "评论内容",
        "author": {
          "id": "user-id",
          "username": "user",
          "avatar": "https://..."
        },
        "replies": [
          {
            "id": "reply-id",
            "content": "回复内容",
            "author": {...}
          }
        ]
      }
    ],
    "_count": {
      "comments": 5,
      "likes": 10
    }
  }
}
```

### 4. 更新文章

**请求：**
```bash
curl -X PUT http://localhost:3001/api/articles/article-id \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "更新后的标题",
    "content": "更新后的内容",
    "status": "PUBLISHED"
  }'
```

### 5. 删除文章

**请求：**
```bash
curl -X DELETE http://localhost:3001/api/articles/article-id \
  -H "Authorization: Bearer <token>"
```

### 6. 获取用户文章列表

**请求：**
```bash
curl "http://localhost:3001/api/articles/user/user-id?page=1&limit=10"
```

---

## 🔍 查询参数详解

### 分页参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `page` | number | 1 | 页码（从1开始） |
| `limit` | number | 10 | 每页数量（最多100） |

### 筛选参数

| 参数 | 类型 | 说明 |
|------|------|------|
| `categoryId` | string | 按分类ID筛选 |
| `tagId` | string | 按标签ID筛选 |
| `authorId` | string | 按作者ID筛选 |
| `status` | string | 按状态筛选（DRAFT/PUBLISHED/ARCHIVED） |
| `search` | string | 全文搜索（标题、摘要、内容） |

### 排序参数

| 参数 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `sortBy` | string | createdAt | 排序字段（createdAt/updatedAt/viewCount/likeCount） |
| `sortOrder` | string | desc | 排序顺序（asc/desc） |

---

## 🛡️ 权限控制

### 创建文章
- ✅ 需要登录
- ✅ 任何已登录用户都可以创建

### 获取文章列表
- ✅ 公开端点
- ✅ 未登录用户只能看到已发布的文章
- ✅ 已登录用户可以看到自己的草稿

### 获取文章详情
- ✅ 公开端点
- ✅ 已发布的文章任何人都可以查看
- ✅ 草稿只有作者本人可以查看

### 更新文章
- ✅ 需要登录
- ✅ 只有作者或管理员可以更新

### 删除文章
- ✅ 需要登录
- ✅ 只有作者或管理员可以删除

---

## 📊 数据验证

### 创建/更新文章的验证规则

| 字段 | 验证规则 | 错误消息 |
|------|---------|---------|
| `title` | 3-200字符 | 标题长度必须在3-200个字符之间 |
| `slug` | 唯一性 | 该slug已被使用 |
| `content` | 最少10字符 | 内容长度至少为10个字符 |
| `categoryId` | 必填、存在 | 分类不存在 |
| `tagIds` | 存在 | 部分标签不存在 |
| `status` | DRAFT/PUBLISHED/ARCHIVED | 无效的状态值 |

---

## 🔍 搜索功能

### 搜索范围

搜索会在以下字段中查找：
- 文章标题
- 文章摘要
- 文章内容

### 搜索示例

```bash
# 搜索包含"React"的文章
curl "http://localhost:3001/api/articles?search=React"

# 搜索包含"性能优化"的文章
curl "http://localhost:3001/api/articles?search=性能优化"

# 组合搜索和分类筛选
curl "http://localhost:3001/api/articles?search=Node.js&categoryId=backend-id"
```

---

## 📈 性能优化

### 查询优化

- ✅ 使用分页避免一次加载过多数据
- ✅ 只返回必要的字段
- ✅ 使用数据库索引加速查询
- ✅ 缓存热门文章

### 建议

1. **分页** - 始终使用分页，避免一次加载所有文章
2. **搜索** - 对于大量数据，考虑使用全文搜索引擎（如Elasticsearch）
3. **缓存** - 缓存热门文章和分类列表
4. **CDN** - 使用CDN加速图片和静态资源

---

## 🧪 测试用例

### 创建文章测试

```bash
# 成功创建
curl -X POST http://localhost:3001/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","content":"Test content","categoryId":"cat-id"}'

# 未登录
curl -X POST http://localhost:3001/api/articles \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"test","content":"Test content","categoryId":"cat-id"}'

# 标题太短
curl -X POST http://localhost:3001/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"T","slug":"test","content":"Test content","categoryId":"cat-id"}'

# Slug已存在
curl -X POST http://localhost:3001/api/articles \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"title":"Test","slug":"existing-slug","content":"Test content","categoryId":"cat-id"}'
```

---

## 💡 最佳实践

### 前端集成

```typescript
// 获取文章列表
const response = await fetch('/api/articles?page=1&limit=10');
const { data, pagination } = await response.json();

// 创建文章
const response = await fetch('/api/articles', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    title: '新文章',
    slug: 'new-article',
    content: '文章内容...',
    categoryId: 'cat-id'
  })
});

// 处理错误
if (!response.ok) {
  const error = await response.json();
  console.error(error.error);
}
```

### 常见错误处理

```typescript
// 处理401 - 未认证
if (response.status === 401) {
  // 重定向到登录页
  window.location.href = '/login';
}

// 处理403 - 权限不足
if (response.status === 403) {
  // 显示权限错误提示
  alert('您没有权限执行此操作');
}

// 处理404 - 资源不存在
if (response.status === 404) {
  // 显示404页面
  window.location.href = '/404';
}

// 处理409 - 冲突（如slug已存在）
if (response.status === 409) {
  // 提示用户修改冲突字段
  alert('该slug已被使用，请修改');
}
```

---

## 📚 相关文档

- [认证系统指南](./AUTH_SYSTEM_GUIDE.md)
- [数据库配置指南](./DATABASE_SETUP_GUIDE.md)
- [项目实施计划](../IMPLEMENTATION_PLAN.md)

---

*📝 完整的文章管理系统已就绪！*
