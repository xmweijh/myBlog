# 数据验证与异常处理完全指南

## 🎯 学习目标

通过这个文档，你将学到：
1. ✅ 为什么需要验证数据
2. ✅ 验证的三个层次
3. ✅ 如何创建和使用自定义异常
4. ✅ 如何实现统一的错误处理
5. ✅ 最佳实践和常见坑

---

## 📚 第一部分：验证的重要性

### 为什么要验证？

```
用户输入 ❌ 永远不要信任！

威胁：
1. 无效数据 - 用户输入错误或格式不对
2. 恶意攻击 - SQL注入、XSS等
3. 逻辑错误 - 输入不符合业务规则
4. 数据泄露 - 敏感信息被暴露

验证的好处：
✅ 保护应用安全
✅ 保证数据一致性
✅ 提供清晰的错误信息
✅ 改进用户体验
```

### 验证的三个层次

```
┌─────────────────────────────────────┐
│ 第1层：前端验证                      │
│ 技术：HTML5 + JavaScript             │
│ 目的：快速反馈，改进用户体验         │
│ 特点：用户可以绕过                   │
├─────────────────────────────────────┤
│ 第2层：API层验证（HTTP中间件）      │
│ 技术：Express中间件                  │
│ 目的：快速拒绝无效请求               │
│ 特点：保护服务器资源                 │
├─────────────────────────────────────┤
│ 第3层：业务层验证（服务层）         │
│ 技术：服务类中的验证方法             │
│ 目的：保证业务逻辑正确               │
│ 特点：检查业务规则                   │
└─────────────────────────────────────┘

例子：创建文章

前端验证：
✅ 标题长度3-200字符
✅ 内容长度10-100000字符

API层验证：
✅ 检查Content-Type
✅ 检查请求头有效性

业务层验证：
✅ slug是否已存在（检查数据库）
✅ 分类是否存在（检查数据库）
✅ 标签是否存在（检查数据库）
```

---

## 🛡️ 第二部分：验证方法

### 1. 类型检查

```typescript
// ❌ 不安全
function createArticle(data: any) {
  // data可能是任何类型
  const article = Article.create(data);
}

// ✅ 安全
function createArticle(data: CreateArticleInput) {
  // TypeScript会在编译时检查类型
  // 运行时也要检查
  if (typeof data.title !== 'string') {
    throw new Error('TITLE_MUST_BE_STRING');
  }
  if (!Array.isArray(data.tagIds)) {
    throw new Error('TAG_IDS_MUST_BE_ARRAY');
  }
}
```

### 2. 必填字段检查

```typescript
// ✅ 使用Validators库
import { Validators } from './validators';

Validators.validateEmail(email); // 抛出异常如果无效
Validators.validateArticleTitle(title);
Validators.validateArticleContent(content);

// 如果验证失败，会抛出Error
// 例如：throw new Error('TITLE_REQUIRED');
```

### 3. 长度检查

```typescript
// ✅ 专用验证方法
Validators.validateArticleTitle(title);
// 自动检查：
// - 是否为空
// - 长度 >= 3
// - 长度 <= 200

Validators.validateStringLength(bio, 0, 500, 'BIO');
// 自定义长度限制
```

### 4. 格式检查

```typescript
// ✅ 邮箱格式
Validators.validateEmail(email);
// 检查：格式、长度

// ✅ URL格式
Validators.validateURL(url);
// 检查：http://或https://开头

// ✅ Slug格式
Validators.validateArticleSlug(slug);
// 检查：小写字母、数字、连字符

// ✅ 日期格式
Validators.validateDate(publishedAt);
// 检查：可转换为有效日期
```

### 5. 业务规则检查

```typescript
// 检查唯一性
const existing = await Article.findUnique({ where: { slug } });
if (existing) {
  throw new Error('SLUG_EXISTS');
}

// 检查依赖关系
const category = await Category.findUnique({ where: { id: categoryId } });
if (!category) {
  throw new Error('CATEGORY_NOT_FOUND');
}

// 检查逻辑一致性
if (status === 'PUBLISHED' && !content) {
  throw new Error('PUBLISHED_ARTICLE_MUST_HAVE_CONTENT');
}

// 检查权限
if (article.authorId !== userId && role !== 'ADMIN') {
  throw new Error('ARTICLE_FORBIDDEN');
}
```

---

## 🚨 第三部分：异常处理系统

### 异常类的层次结构

```
Error（JavaScript内置）
  ↓
AppError（应用基类）
  ├─ ValidationError（400）- 验证失败
  ├─ AuthenticationError（401）- 认证失败
  ├─ AuthorizationError（403）- 授权失败
  ├─ NotFoundError（404）- 资源不存在
  ├─ ConflictError（409）- 资源冲突
  └─ InternalServerError（500）- 服务器错误
```

### 使用自定义异常

```typescript
// ❌ 不好 - 使用通用Error
if (!user) {
  throw new Error('用户不存在');
}

// ✅ 好 - 使用自定义异常
if (!user) {
  throw new NotFoundError('USER_NOT_FOUND');
}

// 自动映射到：
// - HTTP状态码：404
// - 用户消息："用户不存在"
// - 错误代码：USER_NOT_FOUND
```

### 异常代码映射

```typescript
// errorHandler.ts中定义

// 错误代码 → HTTP状态码
const errorStatusMap = {
  'INVALID_EMAIL': 400,
  'EMAIL_EXISTS': 409,
  'USER_NOT_FOUND': 404,
  'ARTICLE_NOT_FOUND': 404,
  'ARTICLE_FORBIDDEN': 403,
  // ...
};

// 错误代码 → 用户消息
const errorMessageMap = {
  'INVALID_EMAIL': '邮箱格式不正确',
  'EMAIL_EXISTS': '该邮箱已被使用',
  'USER_NOT_FOUND': '用户不存在',
  'ARTICLE_NOT_FOUND': '文章不存在',
  'ARTICLE_FORBIDDEN': '无权操作此文章',
  // ...
};
```

### 错误处理流程

```
服务层发生错误
    ↓
throw new Error('ERROR_CODE')
    ↓
控制器catch
    ↓
handleServiceError(error, res)
    ↓
查询errorStatusMap
    ERROR_CODE → 404
    ↓
查询errorMessageMap
    ERROR_CODE → "文章不存在"
    ↓
返回HTTP响应
res.status(404).json({
  success: false,
  error: "文章不存在",
  errorCode: "ARTICLE_NOT_FOUND"
})
    ↓
前端接收并处理
```

---

## 💻 第四部分：实际使用示例

### 例子1：验证用户注册

#### 使用前（混乱）

```typescript
export async function register(req: Request, res: Response) {
  try {
    const { email, username, password, confirmPassword } = req.body;

    // 分散的验证逻辑
    if (!email) {
      return res.status(400).json({ error: '邮箱必填' });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: '邮箱格式不对' });
    }

    if (!username) {
      return res.status(400).json({ error: '用户名必填' });
    }

    if (username.length < 2 || username.length > 50) {
      return res.status(400).json({ error: '用户名长度不对' });
    }

    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: '邮箱已存在' });
    }

    // ... 继续

    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ error: '注册失败' });
  }
}
```

#### 使用后（清晰）

```typescript
import { Validators } from '../utils/validators';
import { handleServiceError } from '../utils/errorHandler';

export async function register(req: Request, res: Response) {
  try {
    // 所有验证都在服务层
    const result = await userService.register(req.body);
    
    res.status(201).json({
      success: true,
      data: result,
      message: '注册成功',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    handleServiceError(error, res);
  }
}

// 服务层中
export class UserService {
  async register(data: RegisterInput) {
    const { email, username, password, confirmPassword } = data;

    // 集中的验证逻辑
    Validators.validateEmail(email);
    Validators.validateUsername(username);
    // ... 自动检查格式、长度等
    
    // 检查唯一性
    const existing = await db.user.findUnique({ where: { email } });
    if (existing) {
      throw new Error('EMAIL_EXISTS'); // 自动映射到409
    }

    // 创建用户...
  }
}
```

**改进**：
- ✅ 验证逻辑统一在服务层
- ✅ 控制器简洁清晰
- ✅ 错误处理集中
- ✅ 易于测试

### 例子2：更新文章

```typescript
export async function updateArticle(req: Request, res: Response) {
  try {
    const article = await articleService.updateArticle(
      req.params.id,
      req.body,
      req.user.userId,
      req.user.role
    );

    res.json({
      success: true,
      data: article,
      message: '文章更新成功',
    });
  } catch (error) {
    handleServiceError(error, res); // 统一处理所有错误
  }
}

// 服务层中
async updateArticle(id: string, data: UpdateArticleInput, userId: string, role: string) {
  // 验证ID
  Validators.validateId(id, 'ArticleId');

  // 查询文章
  const article = await client.article.findUnique({ where: { id } });
  if (!article) {
    throw new Error('ARTICLE_NOT_FOUND'); // 404
  }

  // 权限检查
  if (article.authorId !== userId && role !== 'ADMIN') {
    throw new Error('ARTICLE_FORBIDDEN'); // 403
  }

  // 验证更新数据
  if (data.title) {
    Validators.validateArticleTitle(data.title);
  }
  if (data.slug) {
    Validators.validateArticleSlug(data.slug);
  }
  if (data.content) {
    Validators.validateArticleContent(data.content);
  }

  // 执行更新...
}
```

---

## 📋 第五部分：验证最佳实践

### ✅ DO（应该做）

```typescript
// 1. 在服务层进行验证
export class UserService {
  async register(data: RegisterInput) {
    Validators.validateEmail(data.email);
    // ... 所有验证
  }
}

// 2. 使用具体的错误代码
throw new Error('EMAIL_EXISTS'); // ✅ 具体
throw new Error('Error'); // ❌ 太通用

// 3. 验证关键的业务规则
if (existing) {
  throw new Error('SLUG_EXISTS');
}

// 4. 清晰的错误消息
errorMessageMap['SLUG_EXISTS'] = '该slug已被使用';

// 5. 统一的异常处理
try {
  const result = await service.create(data);
} catch (error) {
  handleServiceError(error, res);
}

// 6. 记录错误日志
logError(error, { method: req.method, userId: req.user?.id });

// 7. 使用asyncHandler简化代码
app.post('/api/articles', asyncHandler(async (req, res) => {
  const article = await articleService.createArticle(req.body);
  res.json(article);
  // 错误自动被捕获和处理
}));
```

### ❌ DON'T（不应该做）

```typescript
// 1. 在控制器中进行验证
app.post('/api/articles', (req, res) => {
  if (!req.body.title) { // ❌ 验证在控制器
    return res.status(400).json(...);
  }
});

// 2. 信任所有输入
const article = Article.create(req.body); // ❌ 没验证

// 3. 泄露敏感信息
res.status(500).json({
  error: error.message, // ❌ 可能暴露内部细节
  stack: error.stack,    // ❌ 泄露代码结构
});

// 4. 使用通用错误码
throw new Error('ERROR'); // ❌ 无法确定错误类型

// 5. 不记录错误
catch (error) {
  res.status(500).json({ error: 'Failed' }); // ❌ 没有日志
}

// 6. 不一致的错误处理
// 某些错误用handleServiceError
// 某些错误直接返回res.json
// ❌ 前端无法统一处理

// 7. 过度验证
// 验证所有字段，即使不需要
// ❌ 降低性能
```

---

## 🔐 第六部分：安全考虑

### 1. 不暴露敏感信息

```typescript
// ❌ 不好
catch (error) {
  res.status(500).json({
    error: error.message,      // 可能暴露数据库错误
    stack: error.stack,        // 暴露代码结构
    details: error.details,    // 暴露内部信息
  });
}

// ✅ 好
catch (error) {
  logError(error, { /* 内部信息 */ }); // 记录到服务器
  res.status(500).json({
    error: '操作失败，请稍后重试', // 通用消息
  });
}
```

### 2. 防止注入攻击

```typescript
// ❌ 不好 - SQL注入
const query = `SELECT * FROM users WHERE email = '${email}'`;

// ✅ 好 - 使用ORM
const user = await client.user.findUnique({ where: { email } });

// ✅ 好 - 验证输入
Validators.validateEmail(email);
```

### 3. 速率限制

```typescript
// 限制请求频率，防止暴力破解
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 5, // 最多5次尝试
  message: '登录尝试过于频繁，请稍后再试',
});

app.post('/api/auth/login', loginLimiter, async (req, res) => {
  // ...
});
```

### 4. 输入清理

```typescript
// 移除危险字符
function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}

// 在验证之前清理
const cleanedTitle = sanitizeInput(data.title);
Validators.validateArticleTitle(cleanedTitle);
```

---

## 📊 第七部分：错误响应示例

### 验证失败（400）

```json
HTTP 400 Bad Request
{
  "success": false,
  "error": "邮箱格式不正确",
  "errorCode": "INVALID_EMAIL",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### 未认证（401）

```json
HTTP 401 Unauthorized
{
  "success": false,
  "error": "邮箱或密码错误",
  "errorCode": "INVALID_CREDENTIALS",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### 无权限（403）

```json
HTTP 403 Forbidden
{
  "success": false,
  "error": "无权操作此文章",
  "errorCode": "ARTICLE_FORBIDDEN",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### 资源不存在（404）

```json
HTTP 404 Not Found
{
  "success": false,
  "error": "用户不存在",
  "errorCode": "USER_NOT_FOUND",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### 资源冲突（409）

```json
HTTP 409 Conflict
{
  "success": false,
  "error": "该邮箱已被使用",
  "errorCode": "EMAIL_EXISTS",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

### 服务器错误（500）

```json
HTTP 500 Internal Server Error
{
  "success": false,
  "error": "服务器内部错误，请稍后重试",
  "timestamp": "2024-02-03T10:30:00.000Z"
}
```

---

## ✅ 验证检查清单

```
验证层次
  [ ] 前端验证（提高用户体验）
  [ ] API层验证（保护服务器）
  [ ] 业务层验证（保证逻辑正确）

验证内容
  [ ] 必填字段检查
  [ ] 数据类型检查
  [ ] 字段长度检查
  [ ] 格式检查（邮箱、URL等）
  [ ] 业务规则检查
  [ ] 权限检查

错误处理
  [ ] 统一的异常类
  [ ] 错误代码映射
  [ ] 用户友好的错误信息
  [ ] 错误日志记录
  [ ] 不暴露敏感信息

安全性
  [ ] 防止SQL注入
  [ ] 防止XSS攻击
  [ ] 输入清理
  [ ] 速率限制
```

---

## 📚 下一步

1. ✅ 理解验证的重要性
2. ✅ 查看创建的验证库和异常处理系统
3. ✅ 在服务层中使用验证
4. ✅ 在控制器中使用统一的错误处理
5. ✅ 编写测试用例

继续进行阶段5.2：性能优化与监测，你将学习如何提升应用性能和实现监测系统。
