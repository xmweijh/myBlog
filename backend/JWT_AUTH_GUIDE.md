# JWT认证机制完整指南

> 基于MyBlog项目的实战认证系统

## 📖 目录

1. [认证基础概念](#认证基础概念)
2. [JWT结构详解](#jwt结构详解)
3. [完整认证流程](#完整认证流程)
4. [代码实现分析](#代码实现分析)
5. [安全最佳实践](#安全最佳实践)
6. [常见问题](#常见问题)

---

## 认证基础概念

### 认证 vs 授权

```
认证（Authentication）
  ├─ 验证你是谁
  ├─ 通过用户名+密码
  └─ "我确认你是Alice"

授权（Authorization）
  ├─ 验证你能做什么
  ├─ 通过角色+权限
  └─ "Alice有权删除这篇文章"

类比：
  认证 = 门卫检查你的身份证
  授权 = 检查你有没有会议室钥匙
```

### 认证流程概览

```
初次访问（无token）
  ├─ 用户提供 email + password
  ├─ 后端验证密码
  └─ ✅ 验证成功 → 生成并返回token

后续访问（有token）
  ├─ 请求头包含 Authorization: Bearer {token}
  ├─ 后端验证token
  └─ ✅ 验证成功 → 识别用户身份 → 执行操作
```

---

## JWT结构详解

### JWT的三个部分

```
Header.Payload.Signature

例：
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJ1c2VySWQiOiJ1c2VyLTEyMyIsImlhdCI6MTYzMTgwOTk3NywiZXhwIjoxNjMyNDE0Nzc3fQ.
7sHjCN4vKvGqcYc-7zNnlKvqcW8ZjqKvNkjH8kL5vSM

  ↓              ↓                    ↓
Header        Payload            Signature
（头部）       （载体）            （签名）
```

### 第1部分：Header（头部）

```json
{
  "alg": "HS256",      // 签名算法
  "typ": "JWT"         // 令牌类型
}
```

**作用**：告诉系统使用什么算法来验证签名

**在MyBlog中**：
```typescript
// jsonwebtoken 自动处理
jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
// 默认算法就是 HS256（HMAC SHA256）
```

### 第2部分：Payload（载体）

```json
{
  "userId": "cuid-abc123...",
  "email": "alice@example.com",
  "username": "alice",
  "role": "USER",
  "iat": 1631809977,        // Issued At（发行时间）
  "exp": 1632414777         // Expiration Time（过期时间）
}
```

**字段解析**：
- `userId`: 用户唯一标识（最重要！）
- `email`: 用户邮箱
- `username`: 用户名
- `role`: 用户角色（用于权限检查）
- `iat`: 令牌创建的Unix时间戳
- `exp`: 令牌过期的Unix时间戳

**过期时间计算**：
```javascript
// 创建时：iat = 1631809977
// 有效期：7天 = 604800秒
// 过期时：exp = 1631809977 + 604800 = 1632414777

// 当前时间 > exp → 令牌过期 ❌
// 当前时间 < exp → 令牌有效 ✅
```

**在MyBlog中**：
```typescript
// backend/src/utils/jwt.ts
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,  // '7d'
  });
}

// jsonwebtoken 自动添加 iat 和 exp
```

### 第3部分：Signature（签名）

```
签名算法（HMAC SHA256）：
signature = HMAC-SHA256(
  base64UrlEncode(header) + "." + base64UrlEncode(payload),
  secret
)

例：
signature = HMAC-SHA256(
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiJ1c2VyLTEyMyIsLi4ufQ",
  "your-secret-key"
)
= "7sHjCN4vKvGqcYc-7zNnlKvqcW8ZjqKvNkjH8kL5vSM"
```

**作用**：
- ✅ 验证令牌没被篡改
- ✅ 验证令牌来自可信源（拥有secret key）

**原理**：
```
如果有人修改了payload：
  原payload: { "userId": "user-123", "role": "USER" }
  修改为：   { "userId": "user-456", "role": "ADMIN" }
  
  原签名对应原payload
  修改后的payload需要重新计算签名
  但没有secret key，计算不出正确签名！
  
  验证失败 ❌ 令牌无效
```

**在MyBlog中**：
```typescript
// backend/src/utils/jwt.ts
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
    // jsonwebtoken 自动验证签名
    // 如果签名不匹配，抛出异常
  } catch (error) {
    throw new Error('令牌验证失败');
  }
}
```

---

## 完整认证流程

### 场景1：用户注册

```
用户输入
  ↓
{
  "email": "alice@example.com",
  "username": "alice",
  "password": "Alice@123456"
}
  ↓
后端 POST /api/auth/register
  ├─ 验证邮箱格式
  ├─ 验证用户名长度（3-20）
  ├─ 验证密码长度（≥6）
  ├─ 检查邮箱是否已注册
  ├─ 检查用户名是否已使用
  ├─ 加密密码：hashPassword("Alice@123456")
  │    ↓
  │   bcryptjs加密 + salt
  │    ↓
  │   "$2a$12$abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNO"
  ├─ 创建用户记录
  ├─ 生成JWT token
  │    ↓
  │   payload: {
  │     userId: "user-123",
  │     email: "alice@example.com",
  │     username: "alice",
  │     role: "USER"
  │   }
  │    ↓
  │   token: "eyJhbGciOiJIUzI1NiI..."
  └─ 返回给前端
    ↓
{
  "success": true,
  "data": {
    "user": {
      "id": "user-123",
      "email": "alice@example.com",
      "username": "alice"
    },
    "token": "eyJhbGciOiJIUzI1NiI..."
  }
}
  ↓
前端保存token
  ├─ localStorage.setItem('token', token)
  ├─ useAuthStore.setAuth(user, token)
  └─ 后续请求自动附加 Authorization 头
```

### 场景2：用户登录

```
用户输入
  ↓
{
  "email": "alice@example.com",
  "password": "Alice@123456"
}
  ↓
后端 POST /api/auth/login
  ├─ 查询用户
  │   query: { email: "alice@example.com" }
  │   result: User {
  │     id: "user-123",
  │     password: "$2a$12$...",  // 加密后的密码
  │     ...
  │   }
  ├─ 验证密码
  │   verifyPassword("Alice@123456", "$2a$12$...")
  │    ↓
  │   bcryptjs.compare(输入, 数据库哈希)
  │    ↓
  │   ✅ 匹配 → 密码正确
  │   ❌ 不匹配 → 密码错误
  ├─ ✅ 密码正确
  ├─ 生成JWT token
  └─ 返回token给前端
    ↓
{
  "success": true,
  "data": {
    "user": { ... },
    "token": "eyJhbGciOiJIUzI1NiI..."
  }
}
  ↓
前端保存token
```

### 场景3：认证请求（如创建文章）

```
前端请求
  ↓
POST /api/articles
Authorization: Bearer eyJhbGciOiJIUzI1NiI...
{
  "title": "My Article",
  "content": "..."
}
  ↓
后端 requireAuth 中间件
  ├─ 提取token
  │   extractTokenFromHeader("Bearer eyJhbGciOiJIUzI1NiI...")
  │    ↓
  │   return "eyJhbGciOiJIUzI1NiI..."
  ├─ 验证token
  │   verifyToken("eyJhbGciOiJIUzI1NiI...")
  │    ↓
  │   验证签名 ✅
  │   检查过期时间 ✅
  │   解码payload ✅
  │    ↓
  │   return { userId: "user-123", email: "...", ... }
  ├─ 查询用户（确保用户仍存在）
  │   findUnique({ id: "user-123" })
  │    ↓
  │   User { id: "user-123", isActive: true, ... }
  ├─ 检查用户状态
  │   isActive = true ✅
  ├─ 将用户信息附加到req
  │   req.user = { userId: "user-123", ... }
  └─ next() 继续处理
    ↓
后端控制器（articleController.createArticle）
  ├─ 使用 req.user.userId 作为文章作者
  ├─ 创建文章
  └─ 返回成功响应
```

---

## 代码实现分析

### 1. 密码加密（password.ts）

```typescript
import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 12;

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, SALT_ROUNDS);
}

// 工作原理：
// 1. 生成随机salt（SALT_ROUNDS = 12表示2^12次轮数）
// 2. 将password和salt组合，进行多轮哈希
// 3. 返回 $2a$12$...(62字节)
//
// 每次调用都生成不同的哈希（即使密码相同）
// 例：
//   hashPassword("test") → "$2a$12$abc..."
//   hashPassword("test") → "$2a$12$xyz..."  ← 不同！
```

### 2. 密码验证

```typescript
export async function verifyPassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}

// 工作原理：
// bcryptjs.compare(输入密码, 数据库哈希)
// 1. 从哈希中提取salt
// 2. 使用相同的salt对输入密码进行哈希
// 3. 对比结果是否相同
//
// 例：
//   compare("test", "$2a$12$abc...") → true/false
```

### 3. Token生成

```typescript
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-key';
const JWT_EXPIRES_IN = '7d';

export function generateToken(payload: JwtPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

// 工作流程：
// 1. jwt.sign() 接收 payload 对象
// 2. 自动添加 iat（当前时间）和 exp（当前时间 + 7天）
// 3. 对payload进行Base64编码
// 4. 使用JWT_SECRET签名
// 5. 返回 "header.payload.signature"
```

### 4. Token验证

```typescript
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('令牌已过期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('无效的令牌');
    }
    throw new Error('令牌验证失败');
  }
}

// 工作流程：
// 1. 分割token为 header.payload.signature
// 2. 验证签名
//    - 用JWT_SECRET重新签名 header.payload
//    - 对比结果是否与signature相同
// 3. 验证exp是否超过当前时间
// 4. 解码payload
// 5. 返回payload对象或抛出异常
```

### 5. Token提取

```typescript
export function extractTokenFromHeader(authHeader?: string): string | null {
  if (!authHeader) {
    return null;
  }

  const parts = authHeader.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}

// 工作流程：
// 输入："Bearer eyJhbGciOiJIUzI1NiI..."
//   ↓
// split(' ') → ["Bearer", "eyJhbGciOiJIUzI1NiI..."]
//   ↓
// 验证格式：parts[0] === 'Bearer' ✅
//   ↓
// 返回：parts[1] = "eyJhbGciOiJIUzI1NiI..."
```

### 6. 认证中间件

```typescript
export async function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // 1. 提取token
    const token = extractTokenFromHeader(req.headers.authorization);
    if (!token) {
      return res.status(401).json({ error: '未提供认证令牌' });
    }

    // 2. 验证token
    const payload = verifyToken(token);

    // 3. 查询用户（确保用户仍然存在）
    const user = await db.getClient().user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        isActive: true,
      },
    });

    if (!user) {
      return res.status(401).json({ error: '用户不存在' });
    }

    // 4. 检查用户状态
    if (!user.isActive) {
      return res.status(403).json({ error: '账号已被禁用' });
    }

    // 5. 将用户信息附加到req
    req.user = {
      userId: user.id,
      email: user.email,
      username: user.username,
      role: user.role as Role,
    };

    // 6. 继续处理
    next();
  } catch (error) {
    res.status(401).json({ error: error.message });
  }
}
```

---

## 安全最佳实践

### 1. 密钥管理

```typescript
// ❌ 不安全
const JWT_SECRET = 'secret123';

// ✅ 安全
const JWT_SECRET = process.env.JWT_SECRET;
// .env 中设置：
// JWT_SECRET=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9eyJ1c2VySWQiOiJ1c2VyLTEyMyI...
```

### 2. Token过期策略

```typescript
// 短期token（15分钟）
JWT_EXPIRES_IN=15m

// 配合refresh token（7天）的实现
POST /api/auth/refresh
{
  "refreshToken": "long-lived-token"
}
→ 返回新的 accessToken

// 这样即使accessToken被盗，风险有限
```

### 3. 密码强度要求

```typescript
export function validatePasswordStrength(password: string) {
  const errors: string[] = [];
  
  if (password.length < 8) 
    errors.push('密码长度至少为8个字符');
  
  if (!/[a-z]/.test(password)) 
    errors.push('密码必须包含至少一个小写字母');
  
  if (!/[A-Z]/.test(password)) 
    errors.push('密码必须包含至少一个大写字母');
  
  if (!/[0-9]/.test(password)) 
    errors.push('密码必须包含至少一个数字');
  
  return {
    valid: errors.length === 0,
    errors,
  };
}
```

### 4. HTTPS强制

```typescript
// 在生产环境强制HTTPS
app.use((req, res, next) => {
  if (req.header('x-forwarded-proto') !== 'https') {
    res.redirect(`https://${req.header('host')}${req.url}`);
  } else {
    next();
  }
});
```

### 5. CORS和token

```typescript
app.use(cors({
  origin: process.env.FRONTEND_URL,
  credentials: true,  // ✅ 允许浏览器发送token
}));
```

### 6. Token黑名单（登出）

```typescript
// 在Redis或数据库中保存已登出的token
const logoutTokens = new Set();

export async function logout(req: Request, res: Response) {
  const token = extractTokenFromHeader(req.headers.authorization);
  logoutTokens.add(token);
  res.json({ success: true });
}

// 验证token时检查黑名单
if (logoutTokens.has(token)) {
  throw new Error('令牌已被登出');
}
```

---

## 常见问题

### Q1: Token被盗了怎么办？

```
A: 
1. 立即登出（将token加入黑名单）
2. 短期token（15分钟）限制损失
3. 用户可以修改密码
4. 使用HTTPS防止中间人攻击
5. 监测异常登录（异地IP、异常时间等）
```

### Q2: 为什么密码不能直接存储？

```
A:
1. 数据库被泄露会暴露所有密码
2. bcryptjs加密后无法反向解密
3. 即使多个用户同密码，哈希也不同（因为salt不同）
4. bcryptjs是单向函数，只能用于验证

密码安全原则：
- 加密 = 可以反向解密（不用于密码）
- 哈希 = 单向函数，无法反向（用于密码）
```

### Q3: JWT能存在localStorage吗？

```
A:
不理想，但是可以接受。

localStorage:
  ✅ 易于实现
  ✅ SPA中广泛使用
  ❌ 容易被XSS攻击

更好的方式是HttpOnly Cookie:
  ✅ 防止XSS（前端无法访问）
  ✅ 浏览器自动发送
  ❌ 容易被CSRF攻击（需要验证）
```

### Q4: Token中能放什么信息？

```
A:
✅ 能放（不敏感信息）：
  - userId
  - username
  - email
  - role
  - iat, exp

❌ 不能放（敏感信息）：
  - password
  - 信用卡号
  - 个人地址
  - 医疗信息

因为：
  - JWT只是Base64编码，可以被解码
  - 任何人都能看到payload内容
  - 只是无法被篡改
```

### Q5: 为什么要查询数据库验证用户？

```
A:
因为token中的信息可能已过时：

场景：
1. Token中说 role = 'USER'
2. 管理员手动修改了用户role为'BANNED'
3. 用户仍持有旧token
4. 如果不查询数据库，还认为用户可用 ❌

解决：
每次请求都查询最新的用户信息
  └─ 确保isActive = true
  └─ 确保role是最新的
```

---

## ✅ 学习检查清单

- [ ] 理解认证和授权的区别
- [ ] 知道JWT的三个部分
- [ ] 理解签名的作用
- [ ] 知道过期时间的计算
- [ ] 理解bcrypt的工作原理
- [ ] 能解释密码验证流程
- [ ] 知道为什么要查询数据库
- [ ] 理解token黑名单的必要性
- [ ] 能设计安全的认证系统

---

*这是完整的JWT认证指南，配合MyBlog项目代码学习*
