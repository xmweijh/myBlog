# Prisma CRUD与查询优化详解

> 基于MyBlog项目的实战指南

## 📚 目录

1. [CRUD基础](#crud基础)
2. [Create - 创建](#create---创建)
3. [Read - 查询](#read---查询)
4. [Update - 更新](#update---更新)
5. [Delete - 删除](#delete---删除)
6. [查询优化](#查询优化)
7. [实战案例](#实战案例)

---

## CRUD基础

CRUD是数据库操作的四个基本操作：

```
C - Create  创建   POST
R - Read    查询   GET
U - Update  更新   PUT/PATCH
D - Delete  删除   DELETE
```

在Prisma中对应的方法：

```typescript
create()        // 创建一条记录
createMany()    // 创建多条记录
findUnique()    // 查询单条（通过唯一字段）
findMany()      // 查询多条
update()        // 更新单条
updateMany()    // 更新多条
delete()        // 删除单条
deleteMany()    // 删除多条
count()         // 计数
```

---

## Create - 创建

### 最基础的创建

```typescript
// 创建用户
const user = await prisma.user.create({
  data: {
    email: 'alice@example.com',
    username: 'alice',
    password: 'hashed_password'
  }
});

// 返回
{
  id: 'cuid-123...',
  email: 'alice@example.com',
  username: 'alice',
  password: 'hashed_password',
  avatar: null,
  bio: null,
  role: 'USER',
  isActive: true,
  createdAt: 2024-01-01T00:00:00.000Z,
  updatedAt: 2024-01-01T00:00:00.000Z
}
```

### 创建时指定关联

```typescript
// 创建文章时同时创建标签关联
const article = await prisma.article.create({
  data: {
    title: 'My Article',
    slug: 'my-article',
    content: 'Content here',
    authorId: 'user-123',
    categoryId: 'cat-456',
    
    // 创建关联的标签
    tags: {
      create: [
        { tagId: 'tag-1' },
        { tagId: 'tag-2' },
        { tagId: 'tag-3' }
      ]
    }
  },
  include: {
    author: true,
    tags: {
      include: { tag: true }
    }
  }
});
```

### 创建多条记录

```typescript
// 批量创建标签
const tags = await prisma.tag.createMany({
  data: [
    { name: 'JavaScript', slug: 'javascript' },
    { name: 'React', slug: 'react' },
    { name: 'Node.js', slug: 'nodejs' }
  ]
});
// 返回 { count: 3 }
```

---

## Read - 查询

### findUnique() - 查询单条（唯一字段）

```typescript
// 通过ID查询
const user = await prisma.user.findUnique({
  where: { id: 'user-123' }
});

// 通过email查询（email也是唯一字段）
const user = await prisma.user.findUnique({
  where: { email: 'alice@example.com' }
});

// 通过username查询
const user = await prisma.user.findUnique({
  where: { username: 'alice' }
});

// 返回单个对象或null
```

### findMany() - 查询多条

#### 基础查询
```typescript
// 获取所有文章
const articles = await prisma.article.findMany();

// 按发布时间倒序
const articles = await prisma.article.findMany({
  orderBy: { createdAt: 'desc' }
});
```

#### where 过滤

```typescript
// 查询已发布的文章
const published = await prisma.article.findMany({
  where: {
    status: 'PUBLISHED'
  }
});

// 查询特定用户的文章
const userArticles = await prisma.article.findMany({
  where: {
    authorId: 'user-123'
  }
});

// 多条件AND（所有条件都要满足）
const articles = await prisma.article.findMany({
  where: {
    authorId: 'user-123',
    status: 'PUBLISHED',
    categoryId: 'cat-456'
  }
});

// OR查询（至少满足一个）
const articles = await prisma.article.findMany({
  where: {
    OR: [
      { title: { contains: 'React' } },
      { content: { contains: 'React' } }
    ]
  }
});

// NOT查询（不包含）
const unpublished = await prisma.article.findMany({
  where: {
    status: { not: 'PUBLISHED' }
  }
});

// 范围查询
const articles = await prisma.article.findMany({
  where: {
    viewCount: { gte: 100 }  // 大于等于100
  }
});

// 搜索（包含）
const articles = await prisma.article.findMany({
  where: {
    title: { contains: 'javascript' }
  }
});

// 搜索（不区分大小写）
const articles = await prisma.article.findMany({
  where: {
    title: { contains: 'javascript', mode: 'insensitive' }
  }
});

// in 查询（在列表中）
const articles = await prisma.article.findMany({
  where: {
    id: { in: ['article-1', 'article-2', 'article-3'] }
  }
});
```

#### 关系查询

```typescript
// 包含关联数据
const article = await prisma.article.findUnique({
  where: { id: 'article-123' },
  include: {
    author: true,           // 包含作者信息
    category: true,         // 包含分类信息
    tags: true,             // 包含标签关联
    comments: true,         // 包含所有评论
    likes: true             // 包含所有点赞
  }
});

// 深层关联
const article = await prisma.article.findUnique({
  where: { id: 'article-123' },
  include: {
    comments: {
      include: {
        author: true,     // 评论者信息
        replies: {
          include: {
            author: true  // 回复者信息
          }
        }
      }
    }
  }
});

// 只选择部分字段
const articles = await prisma.article.findMany({
  select: {
    id: true,
    title: true,
    author: {
      select: {
        username: true,
        avatar: true
      }
    }
  }
});
```

#### 分页和排序

```typescript
// 分页
const articles = await prisma.article.findMany({
  skip: 0,           // 跳过0条
  take: 10,          // 取10条
  orderBy: { createdAt: 'desc' }
});

// 第2页
const articles = await prisma.article.findMany({
  skip: 10,          // 跳过10条
  take: 10,          // 取10条
});

// 多字段排序
const articles = await prisma.article.findMany({
  orderBy: [
    { createdAt: 'desc' },
    { viewCount: 'desc' }
  ]
});
```

### count() - 计数

```typescript
// 统计所有文章
const total = await prisma.article.count();

// 统计特定条件的文章
const publishedCount = await prisma.article.count({
  where: {
    status: 'PUBLISHED'
  }
});

// 统计用户的文章数
const userArticleCount = await prisma.article.count({
  where: {
    authorId: 'user-123'
  }
});
```

---

## Update - 更新

### update() - 更新单条

```typescript
// 更新文章标题
const article = await prisma.article.update({
  where: { id: 'article-123' },
  data: {
    title: 'New Title'
  }
});

// 更新多个字段
const article = await prisma.article.update({
  where: { id: 'article-123' },
  data: {
    title: 'New Title',
    status: 'PUBLISHED',
    publishedAt: new Date()
  }
});

// 增加计数（increment操作）
const article = await prisma.article.update({
  where: { id: 'article-123' },
  data: {
    viewCount: { increment: 1 }  // 每次查看+1
  }
});

// 减少计数
const article = await prisma.article.update({
  where: { id: 'article-123' },
  data: {
    likeCount: { decrement: 1 }  // 取消点赞-1
  }
});
```

### updateMany() - 批量更新

```typescript
// 将所有草稿设为发布
const updated = await prisma.article.updateMany({
  where: { status: 'DRAFT' },
  data: { status: 'PUBLISHED' }
});

// 返回 { count: 5 }  表示更新了5条记录
```

---

## Delete - 删除

### delete() - 删除单条

```typescript
// 删除文章
const article = await prisma.article.delete({
  where: { id: 'article-123' }
});

// 删除用户（会级联删除其所有文章）
const user = await prisma.user.delete({
  where: { id: 'user-123' }
});
```

### deleteMany() - 批量删除

```typescript
// 删除所有草稿
const deleted = await prisma.article.deleteMany({
  where: { status: 'DRAFT' }
});

// 返回 { count: 3 }  表示删除了3条记录
```

---

## 查询优化

### 问题1：N+1查询问题

**❌ 不好的做法**：

```typescript
// 获取所有文章
const articles = await prisma.article.findMany();

// 循环中查询每篇文章的作者（N+1问题！）
for (const article of articles) {
  const author = await prisma.user.findUnique({
    where: { id: article.authorId }
  });
  console.log(author.username);
}

// 问题：
// - 第1次查询：获取10篇文章
// - 接下来10次查询：逐个获取作者信息
// - 总共11次数据库查询！
```

**✅ 好的做法**：

```typescript
// 使用include一次性获取
const articles = await prisma.article.findMany({
  include: { author: true }
});

// 循环中直接使用（不需要额外查询）
for (const article of articles) {
  console.log(article.author.username);
}

// 优势：
// - 只需1次查询
// - Prisma会进行JOIN操作
```

### 问题2：选择性返回数据

**❌ 不好的做法**：

```typescript
// 返回用户的所有字段（包括密码！）
const users = await prisma.user.findMany();

// 前端会收到：
[
  {
    id: '...',
    email: '...',
    username: '...',
    password: 'hashed_password',  // ❌ 不应该返回！
    ...
  }
]
```

**✅ 好的做法**：

```typescript
// 只返回需要的字段
const users = await prisma.user.findMany({
  select: {
    id: true,
    email: true,
    username: true,
    avatar: true,
    // password 不返回
  }
});

// 前端会收到：
[
  {
    id: '...',
    email: '...',
    username: '...',
    avatar: '...'
  }
]
```

### 问题3：关联数据的循环包含

**❌ 不好的做法**：

```typescript
// 递归包含所有关联（可能导致无限循环或性能问题）
const articles = await prisma.article.findMany({
  include: {
    author: {
      include: {
        articles: {  // ❌ 作者的所有文章
          include: {
            comments: {  // ❌ 所有评论
              include: {
                author: {  // ❌ 评论者
                  include: {
                    articles: true  // ❌ 评论者的所有文章
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

// 可能查询几MB的数据！
```

**✅ 好的做法**：

```typescript
// 只包含需要的关联
const articles = await prisma.article.findMany({
  include: {
    author: {
      select: {
        id: true,
        username: true,
        avatar: true
      }
    },
    comments: {
      take: 5,  // 只取前5条评论
      include: {
        author: {
          select: {
            username: true
          }
        }
      }
    }
  }
});
```

### 问题4：没有使用索引

**❌ 不好的做法**：

```prisma
// 经常查询这个字段，但没有索引
model Article {
  slug String  // 每次查询都很慢
}
```

**✅ 好的做法**：

```prisma
// 添加索引
model Article {
  slug String @unique  // @unique自动创建索引
}

// 或者：
model Article {
  slug String
  @@index([slug])  // 显式创建索引
}
```

---

## 实战案例

### 案例1：获取文章列表（带分页、搜索、排序）

```typescript
async function getArticles(query: {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  sort?: 'newest' | 'popular' | 'trending';
}) {
  const page = query.page || 1;
  const limit = query.limit || 10;
  const skip = (page - 1) * limit;

  // 构建where条件
  const where: any = {
    status: 'PUBLISHED'
  };

  if (query.search) {
    where.OR = [
      { title: { contains: query.search, mode: 'insensitive' } },
      { content: { contains: query.search, mode: 'insensitive' } }
    ];
  }

  if (query.categoryId) {
    where.categoryId = query.categoryId;
  }

  // 构建排序
  let orderBy: any = { createdAt: 'desc' };
  if (query.sort === 'popular') {
    orderBy = { viewCount: 'desc' };
  } else if (query.sort === 'trending') {
    orderBy = { likeCount: 'desc' };
  }

  // 并行查询
  const [articles, total] = await Promise.all([
    prisma.article.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        coverImage: true,
        viewCount: true,
        likeCount: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            username: true,
            avatar: true
          }
        },
        category: {
          select: {
            id: true,
            name: true,
            slug: true
          }
        },
        _count: {
          select: {
            comments: true
          }
        }
      }
    }),
    prisma.article.count({ where })
  ]);

  return {
    articles,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    }
  };
}

// 使用
const result = await getArticles({
  page: 1,
  limit: 10,
  search: 'react',
  categoryId: 'cat-123',
  sort: 'popular'
});
```

### 案例2：获取文章详情（包含完整的评论树）

```typescript
async function getArticleWithComments(articleId: string) {
  return await prisma.article.findUnique({
    where: { id: articleId },
    include: {
      author: {
        select: {
          id: true,
          username: true,
          avatar: true,
          bio: true
        }
      },
      category: true,
      tags: {
        include: {
          tag: {
            select: {
              id: true,
              name: true,
              slug: true
            }
          }
        }
      },
      comments: {
        where: { parentId: null },  // 只获取主评论
        include: {
          author: {
            select: {
              id: true,
              username: true,
              avatar: true
            }
          },
          replies: {
            include: {
              author: {
                select: {
                  id: true,
                  username: true,
                  avatar: true
                }
              }
            },
            orderBy: { createdAt: 'asc' }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: {
        select: {
          likes: true,
          comments: true
        }
      }
    }
  });
}
```

### 案例3：点赞/取消点赞

```typescript
async function toggleLike(userId: string, articleId: string) {
  // 检查是否已点赞
  const existing = await prisma.like.findUnique({
    where: {
      userId_articleId: { userId, articleId }
    }
  });

  if (existing) {
    // 已点赞，取消点赞
    await prisma.like.delete({
      where: {
        userId_articleId: { userId, articleId }
      }
    });

    // 减少文章的点赞数
    await prisma.article.update({
      where: { id: articleId },
      data: { likeCount: { decrement: 1 } }
    });

    return { liked: false };
  } else {
    // 未点赞，添加点赞
    await prisma.like.create({
      data: { userId, articleId }
    });

    // 增加文章的点赞数
    await prisma.article.update({
      where: { id: articleId },
      data: { likeCount: { increment: 1 } }
    });

    return { liked: true };
  }
}
```

---

## ✅ 学习检查清单

- [ ] 理解Prisma的6个主要方法（create、findMany、findUnique、update、delete、count）
- [ ] 知道如何使用where条件过滤
- [ ] 能够正确使用include和select
- [ ] 理解N+1查询问题
- [ ] 能够写出优化的查询
- [ ] 理解分页的实现
- [ ] 能够处理关联数据的创建和删除

---

*这是实战指南，配合项目代码学习效果更好*
