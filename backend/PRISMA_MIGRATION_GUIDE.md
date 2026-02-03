# Prisma迁移与版本管理详解

> 理解数据库版本控制和迁移策略

## 📖 目录

1. [为什么需要迁移](#为什么需要迁移)
2. [Prisma迁移工作流](#prisma迁移工作流)
3. [常见迁移操作](#常见迁移操作)
4. [MyBlog的迁移文件分析](#myblog的迁移文件分析)
5. [迁移最佳实践](#迁移最佳实践)

---

## 为什么需要迁移

### 问题场景

假设你的应用已经上线，有真实用户数据：

```
当前数据库Schema：
User { id, email, username, password, createdAt }

需求：添加头像和简介字段
新的Schema：
User { id, email, username, password, avatar?, bio?, createdAt }
```

**问题**：如何安全地添加这两个字段，同时保留现有数据？

**答案**：使用迁移！

```
❌ 不好的做法
- 直接修改Schema.prisma
- 丢失现有数据
- 其他开发者不知道做了什么

✅ 好的做法
- 创建迁移文件记录每个变更
- 安全地更新数据库
- 其他开发者可以看到变更历史
```

---

## Prisma迁移工作流

### 工作流程

```
1. 修改 schema.prisma
   ↓
2. 运行迁移命令
   ↓
3. Prisma生成迁移文件
   ↓
4. 执行迁移文件
   ↓
5. 数据库更新
   ↓
6. Prisma Client重新生成
```

### 具体步骤

#### 步骤1：修改Schema

假设要添加avatar字段：

```prisma
// prisma/schema.prisma
model User {
  id       String @id @default(cuid())
  email    String @unique
  username String @unique
  password String
  avatar   String?          // ← 新增字段
  bio      String?          // ← 新增字段
  // ...
}
```

#### 步骤2：创建迁移

```bash
# 创建并命名迁移
npm run prisma:migrate -- dev --name add_user_profile

# 输出：
# ✓ Environment variables loaded from .env
# ✓ Prisma schema loaded from prisma/schema.prisma
# 
# 为迁移创建迁移文件... ✓
# 
# 数据库已同步到schema.prisma。
# 
# ✨ 已生成Prisma Client代码。
```

#### 步骤3：迁移文件生成

Prisma会自动生成文件：

```
prisma/migrations/
└── 20240101120000_add_user_profile/
    ├── migration.sql      // SQL迁移脚本
    └── .migration_lock.toml
```

**migration.sql内容**：

```sql
-- AlterTable
ALTER TABLE "users" ADD COLUMN "avatar" TEXT,
ADD COLUMN "bio" TEXT;
```

#### 步骤4：验证更改

```typescript
// 现在可以使用新字段
const user = await prisma.user.create({
  data: {
    email: 'alice@example.com',
    username: 'alice',
    password: 'hashed',
    avatar: 'https://...',  // ✅ 新字段
    bio: 'My bio'           // ✅ 新字段
  }
});
```

---

## 常见迁移操作

### 操作1：添加字段

```prisma
model Article {
  // 原字段
  id      String @id @default(cuid())
  title   String
  
  // 新增字段
  excerpt String?                         // 摘要
  tags    String?                         // 标签（多个用逗号分隔）
}
```

**迁移SQL**：

```sql
ALTER TABLE "articles" 
ADD COLUMN "excerpt" TEXT,
ADD COLUMN "tags" TEXT;
```

**命令**：

```bash
npm run prisma:migrate -- dev --name add_article_fields
```

### 操作2：删除字段

**注意**：删除字段会丢失数据！

```prisma
model Article {
  // 移除了 tags 字段
  id      String @id @default(cuid())
  title   String
  excerpt String?
}
```

**迁移SQL**：

```sql
ALTER TABLE "articles" DROP COLUMN "tags";
```

**命令**：

```bash
npm run prisma:migrate -- dev --name remove_tags_field
```

### 操作3：修改字段类型

```prisma
model Article {
  // viewCount 从 Int 改为 BigInt（支持更大的数字）
  viewCount BigInt @default(0)
}
```

**迁移SQL**：

```sql
ALTER TABLE "articles" 
MODIFY "viewCount" BIGINT NOT NULL DEFAULT 0;
```

### 操作4：添加唯一约束

```prisma
model Article {
  slug String @unique  // 添加唯一约束
}
```

**迁移SQL**：

```sql
ALTER TABLE "articles" 
ADD CONSTRAINT "articles_slug_key" UNIQUE ("slug");
```

### 操作5：添加索引

```prisma
model Article {
  status String
  
  @@index([status])  // 在status字段上创建索引
  @@index([authorId, status])  // 复合索引
}
```

**迁移SQL**：

```sql
CREATE INDEX "articles_status_idx" ON "articles"("status");
CREATE INDEX "articles_authorId_status_idx" ON "articles"("authorId", "status");
```

### 操作6：添加关系

```prisma
model Article {
  categoryId String              // 新增外键
  category   Category @relation(
    fields: [categoryId],
    references: [id]
  )
}
```

**迁移SQL**：

```sql
ALTER TABLE "articles" 
ADD COLUMN "categoryId" TEXT NOT NULL;

ALTER TABLE "articles" 
ADD CONSTRAINT "articles_categoryId_fkey" 
FOREIGN KEY ("categoryId") REFERENCES "categories"("id") 
ON DELETE RESTRICT ON UPDATE CASCADE;
```

---

## MyBlog的迁移文件分析

### 查看迁移历史

```bash
# 查看所有迁移
ls -la prisma/migrations/

# 输出
# 20240101000000_init_blog_database/
# 20240102000000_add_user_profile/
# 20240103000000_add_article_status/
# ...
```

### 初始化迁移

```
prisma/migrations/20251008045042_init_blog_database/
```

这个文件包含了：
- 创建User表
- 创建Article表
- 创建Category表
- 创建Tag表
- 创建Comment表
- 创建Like表
- 所有外键关系
- 唯一约束

### 迁移的结构

```
migrations/
├── 20251008045042_init_blog_database/
│   ├── migration.sql      // SQL脚本
│   └── .migration_lock.toml
├── migration_lock.toml    // 全局锁定文件
└── _prisma_migrations/    // 迁移状态记录
    └── migration_lock.toml
```

### 检查迁移状态

```bash
# 查看已应用的迁移
npm run prisma:migrate -- status

# 输出
# Database migrations:
# Migration name                          Status     Applied at
# 20251008045042_init_blog_database       Success    2024-10-08 04:50:42
```

---

## Prisma迁移命令

### 开发环境命令

```bash
# 创建新迁移（推荐）
npm run prisma:migrate -- dev --name your_migration_name

# 快速迁移（跳过命令行提示）
npm run prisma:migrate -- dev

# 重置数据库（删除所有数据和迁移）
npm run prisma:migrate -- reset

# 仅生成迁移文件，不执行
npm run prisma:migrate -- create --name your_migration_name
```

### 生产环境命令

```bash
# 只部署迁移，不生成新迁移
npm run prisma:migrate -- deploy

# 检查迁移状态
npm run prisma:migrate -- status

# 解决迁移冲突
npm run prisma:migrate -- resolve
```

### 生成Prisma Client

```bash
# 生成或更新Client
npm run prisma:generate

# 或在迁移时自动生成
npm run prisma:migrate -- dev
```

---

## 迁移最佳实践

### 1. 始终为迁移命名

```bash
# ❌ 不好
npm run prisma:migrate -- dev

# ✅ 好
npm run prisma:migrate -- dev --name add_article_views
```

**原因**：
- 清楚地说明做了什么
- 便于代码审查
- 便于追踪变更历史

### 2. 一次迁移一个变更

```prisma
// ❌ 不好（同时做多件事）
model User {
  // 删除了 bio
  // 添加了 phone
  // 改了 email 类型
}

// ✅ 好（分开进行）
// 迁移1：添加phone字段
// 迁移2：删除bio字段
// 迁移3：修改email类型
```

**原因**：
- 便于回滚
- 便于故障排查
- 更易于理解

### 3. 在提交前测试迁移

```bash
# 开发时
npm run prisma:migrate -- dev --name test_migration

# 测试迁移效果
npm run prisma:migrate -- reset  # 重新开始

# 确保一切正常后再提交
```

### 4. 添加默认值而不是NOT NULL

```prisma
// ❌ 不好（现有记录会报错）
model Article {
  category String  // 没有默认值，现有记录会报错
}

// ✅ 好（提供默认值）
model Article {
  category String @default("OTHER")
}
```

### 5. 使用级联删除保护数据

```prisma
model Article {
  authorId String
  author User @relation(
    fields: [authorId],
    references: [id],
    onDelete: Cascade  // ✅ 删除用户时自动删除其文章
  )
}
```

### 6. 为常查询的字段添加索引

```prisma
model Article {
  status String
  authorId String
  
  // 常查询这两个字段，添加索引
  @@index([status])
  @@index([authorId, status])
}
```

### 7. 备份生产数据库

```bash
# 迁移前备份
mysqldump -u root -p myblog > backup_$(date +%Y%m%d_%H%M%S).sql

# 执行迁移
npm run prisma:migrate -- deploy

# 如果有问题，从备份恢复
mysql -u root -p myblog < backup_20240101_120000.sql
```

---

## 处理迁移冲突

### 场景：两个开发者同时修改Schema

```
开发者A创建迁移：add_user_avatar
开发者B创建迁移：add_user_phone

pull main后有两个迁移，可能冲突！
```

### 解决步骤

```bash
# 1. 查看迁移状态
npm run prisma:migrate -- status

# 2. 解决冲突
npm run prisma:migrate -- resolve

# 3. 从头开始
npm run prisma:migrate -- reset

# 4. 应用所有迁移
npm run prisma:migrate -- deploy
```

---

## 数据库版本管理策略

### 策略1：每个开发者有自己的本地数据库

```
我的开发环境：dev.db（本地）
其他开发者：dev.db（本地）
测试环境：test.db
生产环境：prod.db
```

### 策略2：提交迁移文件到Git

```bash
# ✅ 提交迁移文件
git add prisma/migrations/
git commit -m "add user avatar field"

# ❌ 不提交database文件
git ignore dev.db
```

### 策略3：生产环境迁移流程

```
1. 开发环境测试迁移
2. 提交迁移文件到Git
3. Code Review
4. Merge to main
5. CI/CD 验证
6. 部署到测试环境
7. 验证测试环境
8. 部署到生产环境（注意：备份！）
```

---

## ✅ 学习检查清单

- [ ] 理解为什么需要迁移
- [ ] 知道Prisma迁移的6个步骤
- [ ] 能够创建新迁移
- [ ] 理解migration.sql文件
- [ ] 知道如何重置数据库
- [ ] 理解生产环境的迁移流程
- [ ] 能够处理迁移冲突

---

## 常用命令速查

```bash
# 开发
npm run prisma:migrate -- dev --name migration_name

# 查看状态
npm run prisma:migrate -- status

# 生产部署
npm run prisma:migrate -- deploy

# 重置（开发用）
npm run prisma:migrate -- reset

# 生成Client
npm run prisma:generate

# Prisma Studio（可视化编辑）
npm run prisma:studio
```

---

*下一步：进入阶段3 - JWT认证与安全*
