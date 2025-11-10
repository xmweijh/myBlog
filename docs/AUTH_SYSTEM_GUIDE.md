# 🔐 MyBlog 用户认证系统实现指南
> 完整的JWT认证系统，包含注册、登录、权限管理等功能

---

## 🎉 实现成果

### ✅ 核心功能

- **用户注册** - 邮箱验证、用户名唯一性检查、密码加密
- **用户登录** - JWT令牌生成、密码验证、账号状态检查
- **用户信息** - 获取当前用户、更新资料、修改密码
- **权限控制** - 基于角色的访问控制（RBAC）
- **令牌管理** - JWT生成、验证、过期处理

### 📊 API端点一览

| 端点 | 方法 | 功能 | 权限 |
|------|------|------|------|
| `/api/auth/register` | POST | 用户注册 | Public |
| `/api/auth/login` | POST | 用户登录 | Public |
| `/api/auth/me` | GET | 获取当前用户信息 | Private |
| `/api/auth/profile` | PUT | 更新用户资料 | Private |
| `/api/auth/password` | PUT | 修改密码 | Private |

---

## 🏗️ 系统架构

### 认证流程图

```
┌─────────────┐
│   客户端    │
└──────┬──────┘
       │
       │ 1. POST /api/auth/register
       │    { email, username, password }
       ▼
┌─────────────────────────────────┐
│      注册控制器                  │
│  - 验证输入                      │
│  - 检查邮箱/用户名唯一性         │
│  - 加密密码 (bcrypt)             │
│  - 创建用户                      │
│  - 生成JWT令牌                   │
└──────┬──────────────────────────┘
       │
       │ 2. 返回 { user, token }
       ▼
┌─────────────┐
│   客户端    │
│ 存储 token  │
└──────┬──────┘
       │
       │ 3. GET /api/auth/me
       │    Header: Authorization: Bearer <token>
       ▼
┌─────────────────────────────────┐
│      认证中间件                  │
│  - 提取JWT令牌                   │
│  - 验证令牌有效性                │
│  - 检查用户状态                  │
│  - 附加用户信息到请求            │
└──────┬──────────────────────────┘
       │
       │ 4. 执行业务逻辑
       ▼
┌─────────────────────────────────┐
│      控制器                      │
│  - 处理请求                      │
│  - 返回响应                      │
└─────────────────────────────────┘
```

---

## 🔧 技术实现

### 1. JWT令牌管理 (`utils/jwt.ts`)

```typescript
// 生成JWT令牌
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN, // 默认7天
  });
}

// 验证JWT令牌
export function verifyToken(token: string): JwtPayload {
  try {
    return jwt.verify(token, JWT_SECRET) as JwtPayload;
  } catch (error) {
    // 处理过期、无效等错误
  }
}

// 从请求头提取令牌
export function extractTokenFromHeader(authHeader?: string): string | null {
  // 格式: "Bearer <token>"
  const parts = authHeader?.split(' ');
  return parts?.[1] || null;
}
```

**关键特性：**
- 使用环境变量配置密钥和过期时间
- 详细的错误处理（过期、无效、格式错误）
- 标准的Bearer令牌格式

### 2. 密码加密 (`utils/password.ts`)

```typescript
// 加密密码
export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12); // 12轮加盐
}

// 验证密码
export async function verifyPassword(
  password: string, 
  hashedPassword: string
): Promise<boolean> {
  return await bcrypt.compare(password, hashedPassword);
}
```

**安全措施：**
- 使用bcrypt算法（行业标准）
- 12轮加盐（平衡安全性和性能）
- 异步操作避免阻塞

### 3. 认证中间件 (`middleware/auth.ts`)

```typescript
// 必须认证中间件
export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  // 1. 提取令牌
  const token = extractTokenFromHeader(req.headers.authorization);
  
  // 2. 验证令牌
  const payload = verifyToken(token);
  
  // 3. 验证用户存在且活跃
  const user = await db.user.findUnique({ where: { id: payload.userId } });
  
  // 4. 附加用户信息到请求
  req.user = { userId, email, username, role };
  
  next();
}

// 可选认证中间件
export async function optionalAuthenticate(...) {
  // 有令牌则验证，无令牌则继续
}

// 权限验证中间件
export function requireRole(...roles: Role[]) {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' });
    }
    next();
  };
}
```

**中间件类型：**
- `authenticate` - 必须登录
- `optionalAuthenticate` - 可选登录
- `requireRole` - 特定角色
- `requireAdmin` - 仅管理员
- `requireModerator` - 管理员或版主

### 4. 认证控制器 (`controllers/authController.ts`)

#### 用户注册

```typescript
export async function register(req: Request, res: Response): Promise<void> {
  const { email, username, password } = req.body;
  
  // 1. 验证输入
  if (!email || !username || !password) {
    return res.status(400).json({ error: '必填项缺失' });
  }
  
  // 2. 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ error: '邮箱格式不正确' });
  }
  
  // 3. 检查唯一性
  const existingUser = await db.user.findUnique({ where: { email } });
  if (existingUser) {
    return res.status(409).json({ error: '邮箱已被注册' });
  }
  
  // 4. 加密密码
  const hashedPassword = await hashPassword(password);
  
  // 5. 创建用户
  const user = await db.user.create({
    data: { email, username, password: hashedPassword, role: 'USER' }
  });
  
  // 6. 生成令牌
  const token = generateToken({ userId, email, username, role });
  
  // 7. 返回响应
  res.status(201).json({ success: true, data: { user, token } });
}
```

#### 用户登录

```typescript
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  
  // 1. 查找用户
  const user = await db.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  
  // 2. 验证密码
  const isValid = await verifyPassword(password, user.password);
  if (!isValid) {
    return res.status(401).json({ error: '邮箱或密码错误' });
  }
  
  // 3. 检查账号状态
  if (!user.isActive) {
    return res.status(403).json({ error: '账号已被禁用' });
  }
  
  // 4. 生成令牌
  const token = generateToken({ userId, email, username, role });
  
  // 5. 返回响应（不包含密码）
  const { password: _, ...safeUser } = user;
  res.json({ success: true, data: { user: safeUser, token } });
}
```

---

## 📝 API使用示例

### 1. 用户注册

**请求：**
```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "SecurePass123"
  }'
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmht75rkv0000zfiv0pr3j7tj",
      "email": "user@example.com",
      "username": "johndoe",
      "avatar": "https://ui-avatars.com/api/?name=johndoe&background=random",
      "bio": "",
      "role": "USER",
      "isActive": true,
      "createdAt": "2025-11-10T13:47:35.264Z",
      "updatedAt": "2025-11-10T13:47:35.264Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "注册成功",
  "timestamp": "2025-11-10T13:47:35.268Z"
}
```

### 2. 用户登录

**请求：**
```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@myblog.com",
    "password": "admin123456"
  }'
```

**响应：**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "cmghig9c5000055vgmhxfwpy2",
      "email": "admin@myblog.com",
      "username": "admin",
      "role": "ADMIN",
      ...
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  },
  "message": "登录成功"
}
```

### 3. 获取当前用户信息

**请求：**
```bash
curl -H "Authorization: Bearer <your-token>" \
  http://localhost:3001/api/auth/me
```

**响应：**
```json
{
  "success": true,
  "data": {
    "id": "cmghig9c5000055vgmhxfwpy2",
    "email": "admin@myblog.com",
    "username": "admin",
    "avatar": "https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff",
    "bio": "MyBlog 系统管理员",
    "role": "ADMIN",
    "isActive": true,
    "createdAt": "2025-10-08T04:50:44.166Z",
    "updatedAt": "2025-10-08T04:50:44.166Z"
  }
}
```

### 4. 更新用户资料

**请求：**
```bash
curl -X PUT http://localhost:3001/api/auth/profile \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "newusername",
    "bio": "Updated bio"
  }'
```

### 5. 修改密码

**请求：**
```bash
curl -X PUT http://localhost:3001/api/auth/password \
  -H "Authorization: Bearer <your-token>" \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "OldPass123",
    "newPassword": "NewPass456"
  }'
```

---

## 🛡️ 安全特性

### 1. 密码安全

- ✅ bcrypt加密（12轮加盐）
- ✅ 密码长度验证（最少6个字符）
- ✅ 永不返回密码字段
- ✅ 修改密码需验证旧密码

### 2. JWT安全

- ✅ 使用环境变量存储密钥
- ✅ 令牌过期时间（默认7天）
- ✅ 详细的错误处理
- ✅ 每次请求验证用户状态

### 3. 输入验证

- ✅ 邮箱格式验证
- ✅ 用户名长度限制（3-20字符）
- ✅ 唯一性检查（邮箱、用户名）
- ✅ SQL注入防护（Prisma ORM）

### 4. 权限控制

- ✅ 基于角色的访问控制（RBAC）
- ✅ 三种角色：USER、MODERATOR、ADMIN
- ✅ 灵活的权限中间件
- ✅ 账号禁用功能

---

## 🔍 错误处理

### HTTP状态码

| 状态码 | 含义 | 使用场景 |
|--------|------|----------|
| 200 | 成功 | 登录、获取信息成功 |
| 201 | 创建成功 | 注册成功 |
| 400 | 请求错误 | 参数缺失、格式错误 |
| 401 | 未认证 | 令牌无效、密码错误 |
| 403 | 禁止访问 | 权限不足、账号禁用 |
| 404 | 未找到 | 用户不存在 |
| 409 | 冲突 | 邮箱/用户名已存在 |
| 500 | 服务器错误 | 内部错误 |

### 错误响应格式

```json
{
  "success": false,
  "error": "错误描述信息",
  "timestamp": "2025-11-10T13:47:35.268Z"
}
```

---

## 💡 最佳实践

### 1. 前端集成

```typescript
// 存储令牌
localStorage.setItem('token', response.data.token);

// 发送认证请求
const headers = {
  'Authorization': `Bearer ${localStorage.getItem('token')}`,
  'Content-Type': 'application/json'
};

// 处理401错误（令牌过期）
if (response.status === 401) {
  localStorage.removeItem('token');
  window.location.href = '/login';
}
```

### 2. 令牌刷新策略

```typescript
// 检查令牌是否即将过期
const decoded = jwt.decode(token);
const expiresIn = decoded.exp * 1000 - Date.now();

if (expiresIn < 24 * 60 * 60 * 1000) { // 少于24小时
  // 提示用户重新登录或实现刷新令牌机制
}
```

### 3. 安全建议

- 🔒 使用HTTPS传输
- 🔒 定期更换JWT密钥
- 🔒 实现登录尝试限制
- 🔒 记录安全相关日志
- 🔒 实现双因素认证（2FA）

---

## 🧪 测试用例

### 注册测试

```bash
# 成功注册
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","username":"testuser","password":"Test123"}'

# 邮箱已存在
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myblog.com","username":"newuser","password":"Test123"}'

# 密码太短
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"new@example.com","username":"newuser","password":"123"}'
```

### 登录测试

```bash
# 成功登录
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myblog.com","password":"admin123456"}'

# 密码错误
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@myblog.com","password":"wrongpassword"}'

# 用户不存在
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"notexist@example.com","password":"password"}'
```

---

## 📚 相关文档

- [数据库配置指南](./DATABASE_SETUP_GUIDE.md)
- [API开发规范](./API_DEVELOPMENT_GUIDE.md)
- [项目实施计划](../IMPLEMENTATION_PLAN.md)

---

*🔐 安全的认证系统是应用的基石！*
