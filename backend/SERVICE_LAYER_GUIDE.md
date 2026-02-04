# 服务层（Service Layer）完全指南

## 🎯 学习目标

通过这个文档，你将学到：
1. ✅ 什么是服务层以及为什么需要它
2. ✅ 服务层的设计模式和最佳实践
3. ✅ 如何在你的项目中使用服务层
4. ✅ 控制器 vs 服务层的职责划分
5. ✅ 错误处理的最佳方式

---

## 📚 第一部分：理论基础

### 什么是服务层？

服务层是位于**控制器**和**数据访问层**之间的逻辑层。

```
HTTP请求
   ↓
控制器（Controller）
   ├─ 验证HTTP请求
   ├─ 调用服务层
   ├─ 处理响应
   └─ 返回HTTP响应
   ↓
服务层（Service）
   ├─ 业务逻辑处理
   ├─ 数据转换
   ├─ 错误检查
   └─ 调用数据访问层
   ↓
数据访问层（DAO/ORM）
   ├─ 数据库查询
   ├─ SQL操作
   └─ 数据持久化
   ↓
数据库（Database）
```

### 为什么需要服务层？

#### 问题1：控制器中的逻辑太复杂

```typescript
// ❌ 没有服务层的情况
app.post('/api/articles', requireAuth, async (req, res) => {
  try {
    const { title, slug, content, categoryId, tagIds } = req.body;

    // 验证必填字段
    if (!title || !slug || !content || !categoryId) {
      return res.status(400).json({ error: '必填字段缺失' });
    }

    // 验证字段长度
    if (title.length < 3 || title.length > 200) {
      return res.status(400).json({ error: '标题长度不符' });
    }

    // 查询slug是否存在
    const existingArticle = await client.article.findUnique({ where: { slug } });
    if (existingArticle) {
      return res.status(409).json({ error: '该slug已被使用' });
    }

    // 查询分类是否存在
    const category = await client.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      return res.status(404).json({ error: '分类不存在' });
    }

    // 查询标签是否存在
    if (tagIds && tagIds.length > 0) {
      const tags = await client.tag.findMany({ where: { id: { in: tagIds } } });
      if (tags.length !== tagIds.length) {
        return res.status(404).json({ error: '部分标签不存在' });
      }
    }

    // 创建文章
    const article = await client.article.create({
      data: {
        title,
        slug,
        content,
        categoryId,
        authorId: req.user.userId,
        tags: {
          create: (tagIds || []).map(tagId => ({ tagId })),
        },
      },
      include: { author: true, category: true, tags: true },
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    res.status(500).json({ error: '创建文章失败' });
  }
});

// 问题：
// 1. 控制器有80行代码！
// 2. 验证逻辑混在一起
// 3. 难以测试
// 4. 难以复用
// 5. 如果有多个路由需要创建文章，需要重复所有代码
```

#### 解决方案：使用服务层

```typescript
// ✅ 使用服务层的情况
app.post('/api/articles', requireAuth, async (req, res) => {
  try {
    const { title, slug, content, categoryId, tagIds } = req.body;

    // 调用服务层
    const article = await articleService.createArticle(
      { title, slug, content, categoryId, tagIds },
      req.user.userId
    );

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    // 统一错误处理
    handleError(error, res);
  }
});

// 优势：
// 1. 控制器只有10行代码！
// 2. 清晰的职责划分
// 3. 易于测试服务层
// 4. 易于复用
// 5. 可以在多个地方使用同一个服务
```

### 职责划分

```
控制器（Controller）
├─ HTTP请求解析 ✓
├─ HTTP响应格式化 ✓
├─ 错误到HTTP状态码映射 ✓
├─ 验证输入 ?（可选）
├─ 业务逻辑 ✗ 不应该做
├─ 数据库操作 ✗ 不应该做
└─ 复杂计算 ✗ 不应该做

服务层（Service）
├─ HTTP请求解析 ✗ 不应该做
├─ HTTP响应格式化 ✗ 不应该做
├─ 错误到HTTP状态码映射 ✗ 不应该做
├─ 验证输入 ✓
├─ 业务逻辑 ✓
├─ 数据库操作 ✓
└─ 复杂计算 ✓

数据访问层（DAO/Prisma）
├─ 数据库查询 ✓
├─ SQL操作 ✓
├─ 数据模型映射 ✓
└─ 事务管理 ✓
```

---

## 🏗️ 第二部分：服务层设计模式

### 模式1：单一职责原则

每个服务类处理一个特定的业务域。

```typescript
// ✅ 好 - 单一职责
export class ArticleService {
  async createArticle() { ... }
  async getArticleById() { ... }
  async listArticles() { ... }
  async updateArticle() { ... }
  async deleteArticle() { ... }
}

export class CommentService {
  async createComment() { ... }
  async updateComment() { ... }
  async deleteComment() { ... }
}

// ❌ 不好 - 职责过多
export class AppService {
  async createArticle() { ... }
  async createComment() { ... }
  async createUser() { ... }
  async sendEmail() { ... }
  async uploadFile() { ... }
  // ... 100个方法
}
```

### 模式2：方法返回结构化数据

服务方法返回一致的、有类型的数据。

```typescript
// ✅ 好 - 返回结构化数据
async createArticle(data: CreateArticleInput, authorId: string) {
  // ... 业务逻辑 ...
  return {
    id: string;
    title: string;
    slug: string;
    content: string;
    author: { id, username, avatar };
    category: { id, name };
    tags: { id, name }[];
    createdAt: Date;
    updatedAt: Date;
  }
}

// ❌ 不好 - 返回原始数据
async createArticle(data: CreateArticleInput, authorId: string) {
  const article = await client.article.create(...);
  return article; // 可能包含不想暴露的字段
}
```

### 模式3：错误处理

服务层抛出具有意义的错误，控制器捕获并转换为HTTP响应。

```typescript
// ✅ 好 - 抛出具有意义的错误
async createArticle(data: CreateArticleInput, authorId: string) {
  try {
    const existingArticle = await client.article.findUnique({
      where: { slug: data.slug },
    });

    if (existingArticle) {
      throw new Error('SLUG_EXISTS'); // 抛出业务错误
    }

    const category = await client.category.findUnique({
      where: { id: data.categoryId },
    });

    if (!category) {
      throw new Error('CATEGORY_NOT_FOUND'); // 抛出业务错误
    }

    return await client.article.create({ ... });
  } catch (error) {
    // 业务错误直接抛出
    if (error.message.startsWith('SLUG_EXISTS')) throw error;
    // 其他错误包装
    throw new Error(`Service error: ${error.message}`);
  }
}
```

### 模式4：验证在服务层

```typescript
// ✅ 好 - 在服务层进行验证
export class UserService {
  async register(data: RegisterInput) {
    // 验证邮箱格式
    if (!this.isValidEmail(data.email)) {
      throw new Error('INVALID_EMAIL');
    }

    // 验证邮箱唯一性
    const existingUser = await client.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // 验证密码强度
    const validation = validatePasswordStrength(data.password);
    if (!validation.valid) {
      throw new Error(`WEAK_PASSWORD`);
    }

    // ... 创建用户
  }
}

// 在控制器中使用
app.post('/api/auth/register', async (req, res) => {
  try {
    const result = await userService.register(req.body);
    res.json(result);
  } catch (error) {
    // 映射错误到HTTP状态码
    const statusCode = errorMap[error.message] || 500;
    res.status(statusCode).json({ error: error.message });
  }
});
```

### 模式5：服务单例

创建一个单例实例，而不是每次都创建新实例。

```typescript
// ✅ 好 - 服务单例
export class ArticleService {
  // ... 方法 ...
}

export const articleService = new ArticleService();

// 在其他地方使用
import { articleService } from './services/articleService';
articleService.createArticle(...);

// ❌ 不好 - 每次都创建新实例
const service = new ArticleService();
service.createArticle(...);
// ... 浪费资源
```

---

## 💻 第三部分：项目中的服务层

### 创建的服务文件

我已经为你的项目创建了以下服务：

#### 1. ArticleService (`/backend/src/services/articleService.ts`)

```typescript
class ArticleService {
  // 创建文章
  async createArticle(data: CreateArticleInput, authorId: string)
  
  // 获取文章详情
  async getArticleById(id: string, userId?: string)
  
  // 获取文章列表
  async listArticles(query: ArticleQuery, userId?: string, userRole?: string)
  
  // 更新文章
  async updateArticle(id: string, data: UpdateArticleInput, userId: string, userRole: string)
  
  // 删除文章
  async deleteArticle(id: string, userId: string, userRole: string)
  
  // 获取用户文章列表
  async getUserArticles(userId: string, query: ArticleQuery, currentUserId?: string)
}
```

**主要特性**：
- ✅ 完整的CRUD操作
- ✅ 权限检查（作者、管理员）
- ✅ 数据验证
- ✅ 错误处理
- ✅ 分页支持

#### 2. UserService (`/backend/src/services/userService.ts`)

```typescript
class UserService {
  // 用户注册
  async register(data: RegisterInput)
  
  // 用户登录
  async login(data: LoginInput)
  
  // 获取当前用户信息
  async getCurrentUser(userId: string)
  
  // 获取用户公开资料
  async getUserPublicProfile(userId: string)
  
  // 更新用户信息
  async updateUser(userId: string, data: UpdateUserInput)
  
  // 修改密码
  async changePassword(userId: string, oldPassword: string, newPassword: string)
}
```

**主要特性**：
- ✅ 用户认证
- ✅ 密码哈希和验证
- ✅ 邮箱验证
- ✅ 密码强度检查
- ✅ JWT令牌生成

#### 3. CommentService (`/backend/src/services/commentService.ts`)

```typescript
class CommentService {
  // 创建评论
  async createComment(data: CreateCommentInput, authorId: string)
  
  // 获取评论详情
  async getCommentById(commentId: string)
  
  // 获取文章评论列表
  async getArticleComments(articleId: string, page: number, limit: number)
  
  // 获取用户评论列表
  async getUserComments(userId: string, page: number, limit: number)
  
  // 更新评论
  async updateComment(commentId: string, data: UpdateCommentInput, userId: string, userRole: string)
  
  // 删除评论
  async deleteComment(commentId: string, userId: string, userRole: string)
}
```

**主要特性**：
- ✅ 嵌套评论支持
- ✅ 权限检查
- ✅ 分页支持

#### 4. LikeService (`/backend/src/services/likeService.ts`)

```typescript
class LikeService {
  // 点赞/取消点赞
  async toggleLike(articleId: string, userId: string)
  
  // 检查是否已点赞
  async isLiked(articleId: string, userId: string)
  
  // 获取文章点赞数
  async getLikeCount(articleId: string)
  
  // 获取文章点赞者列表
  async getArticleLikes(articleId: string, page: number, limit: number)
  
  // 获取用户点赞过的文章列表
  async getUserLikes(userId: string, page: number, limit: number)
  
  // 批量检查点赞状态
  async checkLikeStatus(articleIds: string[], userId: string)
}
```

**主要特性**：
- ✅ 点赞切换
- ✅ 批量检查
- ✅ 分页支持

---

## 🔄 第四部分：从控制器迁移到服务层

### 实际例子1：创建文章

#### 原来的控制器（繁重）

```typescript
export async function createArticle(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: '需要登录' });
      return;
    }

    const { title, slug, excerpt, content, coverImage, categoryId, tagIds, status, isTop } = req.body;

    // 验证必填字段
    if (!title || !slug || !content || !categoryId) {
      res.status(400).json({ success: false, error: '标题、slug、内容和分类为必填项' });
      return;
    }

    // 验证标题长度
    if (title.length < 3 || title.length > 200) {
      res.status(400).json({ success: false, error: '标题长度必须在3-200个字符之间' });
      return;
    }

    // ... 更多验证 ...

    const client = db.getClient();

    // 检查slug是否已存在
    const existingArticle = await client.article.findUnique({ where: { slug } });
    if (existingArticle) {
      res.status(409).json({ success: false, error: '该slug已被使用' });
      return;
    }

    // 检查分类是否存在
    const category = await client.category.findUnique({ where: { id: categoryId } });
    if (!category) {
      res.status(404).json({ success: false, error: '分类不存在' });
      return;
    }

    // ... 更多检查 ...

    // 创建文章
    const article = await client.article.create({
      data: { /* ... */ },
      include: { /* ... */ },
    });

    res.status(201).json({ success: true, data: article });
  } catch (error) {
    console.error('创建文章失败:', error);
    res.status(500).json({ success: false, error: '创建文章失败' });
  }
}
```

#### 改进后的控制器（轻薄）

```typescript
import { articleService } from '../services';
import { handleServiceError } from '../utils/errorHandler';

export async function createArticle(req: Request, res: Response): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, error: '需要登录' });
      return;
    }

    // 调用服务层
    const article = await articleService.createArticle(
      req.body,
      req.user.userId
    );

    res.status(201).json({
      success: true,
      data: article,
      message: '文章创建成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // 使用统一的错误处理
    handleServiceError(error, res);
  }
}
```

**改进**：
- 减少40行代码
- 逻辑清晰
- 易于测试
- 错误处理集中

### 实际例子2：用户登录

#### 原来的控制器

```typescript
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { email, password }: LoginInput = req.body;

    if (!email || !password) {
      res.status(400).json({ success: false, error: '邮箱和密码为必填项' });
      return;
    }

    const client = db.getClient();

    const user = await client.user.findUnique({ where: { email } });

    if (!user) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    const isPasswordValid = await verifyPassword(password, user.password);

    if (!isPasswordValid) {
      res.status(401).json({ success: false, error: '邮箱或密码错误' });
      return;
    }

    if (!user.isActive) {
      res.status(403).json({ success: false, error: '账号已被禁用' });
      return;
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
    });

    const { password: _, ...safeUser } = user;

    res.json({
      success: true,
      data: { user: safeUser, token },
      message: '登录成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({ success: false, error: '登录失败，请稍后重试' });
  }
}
```

#### 改进后的控制器

```typescript
export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { user, token } = await userService.login(req.body);

    res.json({
      success: true,
      data: { user, token },
      message: '登录成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleServiceError(error, res);
  }
}
```

**改进**：
- 从40行减到5行
- 业务逻辑完全在服务层
- 易于单元测试

---

## 🛡️ 第五部分：错误处理

### 错误映射

```typescript
// utils/errorHandler.ts
const errorStatusMap: { [key: string]: number } = {
  // 认证相关
  'INVALID_CREDENTIALS': 401,
  'MISSING_CREDENTIALS': 400,
  'ACCOUNT_DISABLED': 403,
  
  // 用户相关
  'EMAIL_EXISTS': 409,
  'USERNAME_EXISTS': 409,
  'USER_NOT_FOUND': 404,
  
  // 文章相关
  'ARTICLE_NOT_FOUND': 404,
  'ARTICLE_FORBIDDEN': 403,
  'SLUG_EXISTS': 409,
  'CATEGORY_NOT_FOUND': 404,
  'TAG_NOT_FOUND': 404,
  
  // 评论相关
  'COMMENT_NOT_FOUND': 404,
  'COMMENT_FORBIDDEN': 403,
  'PARENT_COMMENT_NOT_FOUND': 404,
  
  // 验证相关
  'INVALID_EMAIL': 400,
  'WEAK_PASSWORD': 400,
  'PASSWORD_MISMATCH': 400,
};

const errorMessageMap: { [key: string]: string } = {
  'INVALID_CREDENTIALS': '邮箱或密码错误',
  'MISSING_CREDENTIALS': '邮箱和密码为必填项',
  'ACCOUNT_DISABLED': '账号已被禁用，请联系管理员',
  'EMAIL_EXISTS': '该邮箱已被使用',
  'USERNAME_EXISTS': '该用户名已被使用',
  'USER_NOT_FOUND': '用户不存在',
  'ARTICLE_NOT_FOUND': '文章不存在',
  'ARTICLE_FORBIDDEN': '无权操作此文章',
  'SLUG_EXISTS': '该slug已被使用',
  'CATEGORY_NOT_FOUND': '分类不存在',
  'TAG_NOT_FOUND': '标签不存在',
  'COMMENT_NOT_FOUND': '评论不存在',
  'COMMENT_FORBIDDEN': '无权操作此评论',
  'INVALID_EMAIL': '邮箱格式不正确',
  'WEAK_PASSWORD': '密码强度不足',
  'PASSWORD_MISMATCH': '两次输入的密码不一致',
};

export function handleServiceError(error: Error, res: Response): void {
  const errorCode = error.message.split(':')[0];
  const statusCode = errorStatusMap[errorCode] || 500;
  const message = errorMessageMap[errorCode] || '操作失败，请稍后重试';

  console.error('Service error:', error);

  res.status(statusCode).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}
```

### 在控制器中使用

```typescript
import { handleServiceError } from '../utils/errorHandler';

app.post('/api/auth/login', async (req, res) => {
  try {
    const result = await userService.login(req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    handleServiceError(error, res); // 统一处理
  }
});

app.post('/api/articles', requireAuth, async (req, res) => {
  try {
    const article = await articleService.createArticle(req.body, req.user.userId);
    res.status(201).json({ success: true, data: article });
  } catch (error) {
    handleServiceError(error, res); // 统一处理
  }
});
```

---

## 📋 第六部分：测试示例

### 单元测试服务层

```typescript
// tests/services/articleService.test.ts
import { articleService } from '../../src/services';

describe('ArticleService', () => {
  describe('createArticle', () => {
    it('应该成功创建文章', async () => {
      const data = {
        title: '测试文章',
        slug: 'test-article',
        content: '这是一篇测试文章，内容足够长',
        categoryId: 'cat-1',
      };

      const result = await articleService.createArticle(data, 'user-1');

      expect(result).toHaveProperty('id');
      expect(result.title).toBe('测试文章');
      expect(result.authorId).toBe('user-1');
    });

    it('应该在slug已存在时抛出错误', async () => {
      const data = {
        title: '测试文章',
        slug: 'existing-slug',
        content: '内容足够长',
        categoryId: 'cat-1',
      };

      await expect(
        articleService.createArticle(data, 'user-1')
      ).rejects.toThrow('SLUG_EXISTS');
    });

    it('应该在分类不存在时抛出错误', async () => {
      const data = {
        title: '测试文章',
        slug: 'test-slug',
        content: '内容足够长',
        categoryId: 'invalid-id',
      };

      await expect(
        articleService.createArticle(data, 'user-1')
      ).rejects.toThrow('CATEGORY_NOT_FOUND');
    });
  });

  describe('updateArticle', () => {
    it('应该允许作者更新自己的文章', async () => {
      const result = await articleService.updateArticle(
        'article-1',
        { title: '新标题' },
        'user-1', // 作者ID
        'USER'
      );

      expect(result.title).toBe('新标题');
    });

    it('应该不允许其他用户更新文章', async () => {
      await expect(
        articleService.updateArticle(
          'article-1',
          { title: '新标题' },
          'user-2', // 不同的用户
          'USER'
        )
      ).rejects.toThrow('ARTICLE_FORBIDDEN');
    });

    it('应该允许管理员更新任何文章', async () => {
      const result = await articleService.updateArticle(
        'article-1',
        { title: '新标题' },
        'user-2', // 不同的用户
        'ADMIN'   // 但是是管理员
      );

      expect(result.title).toBe('新标题');
    });
  });
});
```

---

## 🎓 第七部分：最佳实践

### ✅ DO（应该做）

```typescript
// 1. 单一职责
export class ArticleService {
  // 只处理文章相关的业务逻辑
}

// 2. 返回有意义的错误
if (!article) {
  throw new Error('ARTICLE_NOT_FOUND');
}

// 3. 验证所有输入
if (!this.isValidEmail(email)) {
  throw new Error('INVALID_EMAIL');
}

// 4. 检查权限
if (article.authorId !== userId && userRole !== 'ADMIN') {
  throw new Error('ARTICLE_FORBIDDEN');
}

// 5. 使用异步/等待
async createArticle(data: CreateArticleInput, authorId: string) {
  const result = await db.create(...);
  return result;
}

// 6. 处理关联数据
const article = await client.article.create({
  data: { /* ... */ },
  include: {
    author: { select: { id: true, username: true } },
    category: true,
    tags: true,
  },
});

// 7. 使用数据库事务处理复杂操作
await client.$transaction(async (tx) => {
  const article = await tx.article.create({ /* ... */ });
  await tx.stats.update({ /* ... */ });
  return article;
});
```

### ❌ DON'T（不应该做）

```typescript
// 1. 多个职责混在一起
export class AppService {
  createArticle() { }
  sendEmail() { }
  uploadFile() { }
  createUser() { }
  // 太多职责
}

// 2. 返回通用错误
if (!article) {
  throw new Error('Error'); // 太通用
}

// 3. 信任所有输入
const article = await client.article.create(req.body); // 没验证

// 4. 忘记权限检查
await client.article.delete({ where: { id } }); // 任何人都能删

// 5. 同步操作
const result = client.article.findUnique(...); // 忘记await

// 6. 返回不完整的数据
const article = await client.article.create({ data });
// 返回没有关联的作者、分类等

// 7. 在服务中处理HTTP响应
export class ArticleService {
  async createArticle() {
    // ...
    res.json({ /* ... */ }); // 错误！服务不应该处理HTTP
  }
}
```

---

## 🚀 第八部分：总结

### 服务层的核心收益

| 方面 | 改进 |
|------|------|
| **代码质量** | 逻辑清晰，职责明确 |
| **可维护性** | 修改业务逻辑只需改服务层 |
| **可测试性** | 可独立测试服务层逻辑 |
| **代码复用** | 多个路由可共用同一个服务 |
| **错误处理** | 统一的错误处理机制 |
| **扩展性** | 易于添加新功能 |

### 架构对比

```
没有服务层：
控制器 = 验证 + 业务逻辑 + 数据库 + 响应处理
  ↓
  结果：混乱、臃肿、难以维护

有服务层：
控制器 = HTTP处理
服务层 = 业务逻辑 + 验证 + 错误处理
数据层 = 数据库操作
  ↓
  结果：清晰、灵活、易于维护
```

---

## 📚 下一步

1. ✅ 理解服务层的设计模式
2. ✅ 查看项目中创建的4个服务文件
3. ✅ 学习如何在控制器中使用服务
4. ✅ 为其他控制器添加服务
5. ✅ 编写单元测试

继续进行阶段4.3：前后端交互与API对接，你将学习如何充分利用服务层来构建强大的API。
