# 阶段2总结：数据库设计与Prisma ORM

> 从前端工程师的角度理解后端数据库操作

## 📚 学习成果回顾

### 2.1 数据库模型设计与Prisma Schema ✅

#### 核心学到

```
✅ 关系型数据库基本概念
   - 表、行、列、主键、外键
   - 一对多、多对多、自关联关系
   - 索引、约束、默认值

✅ Prisma ORM的核心优势
   - 类型安全（TypeScript）
   - 自动防止SQL注入
   - IDE自动完成
   - 易读易维护

✅ MyBlog的7个数据模型
   1. User - 用户
   2. Article - 文章
   3. Category - 分类
   4. Tag - 标签
   5. ArticleTag - 文章标签关联（多对多）
   6. Comment - 评论（含自关联）
   7. Like - 点赞
```

#### 关键概念

```
主键 @id
  ├─ 唯一标识符
  └─ 自动生成 @default(cuid())

唯一约束 @unique
  ├─ 字段值唯一
  └─ 例：email @unique

外键关系
  ├─ 一对多：User.articles
  ├─ 多对多：通过关联表
  └─ 自关联：Comment.replies

可选字段 ?
  ├─ String? 可以为null
  └─ Int? 可以为null
```

#### MyBlog数据模型全景

```
User (7个字段)
  ├─ articles[] ─────── 一对多
  ├─ comments[] ─────── 一对多
  └─ likes[] ────────── 一对多

Article (11个字段)
  ├─ author ────────── 多对一
  ├─ category ──────── 多对一
  ├─ tags[] (通过ArticleTag) ── 多对多
  ├─ comments[] ────── 一对多
  └─ likes[] ───────── 一对多

Category (5个字段)
  └─ articles[] ────── 一对多

Tag (5个字段)
  └─ articles[] ────── 多对多

Comment (6个字段)
  ├─ author ────────── 多对一
  ├─ article ───────── 多对一
  ├─ parent ────────── 自关联（可选）
  └─ replies[] ─────── 自关联

Like (4个字段)
  ├─ user ───────────── 多对一
  └─ article ────────── 多对一
```

---

### 2.2 Prisma CRUD与查询优化 ✅

#### 四个基本操作

```
Create - 创建
  └─ create()        创建单条
  └─ createMany()    创建多条

Read - 查询
  └─ findUnique()    查询单条（唯一字段）
  └─ findMany()      查询多条
  └─ count()         计数

Update - 更新
  └─ update()        更新单条
  └─ updateMany()    更新多条

Delete - 删除
  └─ delete()        删除单条
  └─ deleteMany()    删除多条
```

#### 关键查询技巧

```
where 过滤
  ├─ { status: 'PUBLISHED' }
  ├─ { title: { contains: 'react' } }
  ├─ { id: { in: [...] } }
  ├─ { viewCount: { gte: 100 } }
  └─ { OR: [...], AND: [...] }

include 包含关联
  ├─ include: { author: true }
  └─ include: { comments: { include: { author: true } } }

select 选择字段
  ├─ select: { id: true, title: true }
  └─ 用于隐藏敏感字段

orderBy 排序
  ├─ orderBy: { createdAt: 'desc' }
  └─ orderBy: [{ createdAt: 'desc' }, { viewCount: 'desc' }]

skip/take 分页
  ├─ skip: (page - 1) * limit
  └─ take: limit
```

#### 优化技巧

```
❌ N+1查询问题
  query articles × 1     ─┐
  query author × 10      ─┼─ 总11次查询！
                          ─┘

✅ 使用include一次解决
  query articles + author × 1 ─ 只需1次查询！

❌ 返回所有字段（包括密码）
✅ 使用select只返回需要的字段

❌ 深度嵌套关联
✅ 只包含必要的关联，限制数据量
```

#### 实战代码示例

```typescript
// 获取已发布文章列表（分页、排序、搜索）
const articles = await prisma.article.findMany({
  where: {
    status: 'PUBLISHED',
    title: { contains: 'react', mode: 'insensitive' }
  },
  include: {
    author: { select: { username: true, avatar: true } },
    category: true,
    _count: { select: { comments: true, likes: true } }
  },
  orderBy: { createdAt: 'desc' },
  skip: 0,
  take: 10
});

// 点赞/取消点赞（幂等操作）
const like = await prisma.like.findUnique({
  where: { userId_articleId: { userId, articleId } }
});

if (like) {
  await prisma.like.delete({ where: { id: like.id } });
  await prisma.article.update({
    where: { id: articleId },
    data: { likeCount: { decrement: 1 } }
  });
} else {
  await prisma.like.create({
    data: { userId, articleId }
  });
  await prisma.article.update({
    where: { id: articleId },
    data: { likeCount: { increment: 1 } }
  });
}
```

---

### 2.3 数据库迁移与版本管理 ✅

#### 为什么需要迁移

```
✅ 持久化记录每个变更
✅ 安全地修改数据库
✅ 团队协作无冲突
✅ 生产环境可回滚
```

#### 迁移工作流

```
1. 修改 schema.prisma
   ↓
2. 运行 npm run prisma:migrate -- dev --name xxx
   ↓
3. Prisma生成migration文件
   ↓
4. migration.sql被执行
   ↓
5. 数据库更新完毕
   ↓
6. Prisma Client重新生成
```

#### 常见迁移操作

```
添加字段           → ALTER TABLE ADD COLUMN
删除字段           → ALTER TABLE DROP COLUMN
修改字段类型       → ALTER TABLE MODIFY COLUMN
添加唯一约束       → ADD CONSTRAINT UNIQUE
添加索引           → CREATE INDEX
添加关系           → ADD FOREIGN KEY
```

#### 生产部署流程

```
开发环境           测试环境           生产环境
  ↓                  ↓                  ↓
创建迁移        验证迁移            备份数据库
提交Git         测试应用            npm run prisma:migrate -- deploy
              CodeReview            监测错误
              Merge main            验证结果
```

#### 迁移最佳实践

```
✅ 为迁移命名          →  --name add_user_avatar
✅ 一次迁移一个变更    →  便于回滚和追踪
✅ 测试迁移效果        →  npm run prisma:migrate -- reset
✅ 备份生产数据库      →  防止数据丢失
✅ 添加默认值          →  避免现有记录错误
✅ 使用级联删除        →  onDelete: Cascade
✅ 为查询字段索引      →  @@index([field])
```

#### 常用命令

```bash
# 创建新迁移
npm run prisma:migrate -- dev --name migration_name

# 查看迁移状态
npm run prisma:migrate -- status

# 生产部署
npm run prisma:migrate -- deploy

# 重置数据库（开发用）
npm run prisma:migrate -- reset

# 生成Client
npm run prisma:generate
```

---

## 🧠 核心概念统整

### 从Zustand状态管理到数据库

**前端（Zustand）**：
```typescript
const store = create((set) => ({
  articles: [],
  setArticles: (articles) => set({ articles })
}));

// 数据存在内存中，页面刷新丢失
```

**后端（Prisma）**：
```typescript
const articles = await prisma.article.findMany();

// 数据存在数据库中，永久保存
// 支持复杂查询、事务、关系等
```

### SQL vs Prisma

**SQL方式**：
```sql
SELECT u.*, COUNT(a.id) as article_count
FROM users u
LEFT JOIN articles a ON u.id = a.author_id
WHERE u.role = 'USER'
GROUP BY u.id
ORDER BY u.created_at DESC
LIMIT 10 OFFSET 0;

// 问题：
// - 容易出错
// - 没有类型检查
// - 不好维护
```

**Prisma方式**：
```typescript
const users = await prisma.user.findMany({
  where: { role: 'USER' },
  include: {
    articles: true,
    _count: { select: { articles: true } }
  },
  orderBy: { createdAt: 'desc' },
  take: 10
});

// 优点：
// - 清晰易懂
// - 类型安全
// - IDE提示
```

---

## 📊 学习进度

```
阶段1：后端基础理论与架构 ████████░░ 100% ✅
  - Express框架
  - 中间件
  - 路由设计

阶段2：数据库设计与Prisma ORM ████████░░ 100% ✅
  - 数据模型设计
  - CRUD操作
  - 迁移管理

阶段3：身份认证与安全 ░░░░░░░░░░ 0%
  - JWT认证
  - 密码加密
  - 权限控制

总体进度：▓▓▓▓▓▓░░░░ 50%
```

---

## 🎯 关键收获

### 你现在理解了

```
✅ 关系型数据库如何存储和组织数据
✅ ORM如何简化数据库操作
✅ 如何设计复杂的数据关系
✅ 如何编写高效的查询
✅ 如何管理数据库版本变更
✅ MyBlog的完整数据模型
✅ 如何处理N+1查询问题
✅ 如何使用事务保证数据一致性
```

### 你现在会做

```
✅ 使用Prisma进行CRUD操作
✅ 编写复杂的查询（包括关联、分页、排序）
✅ 优化查询性能
✅ 创建和应用数据库迁移
✅ 处理数据库版本管理
✅ 在团队中协作开发
```

---

## 💡 下一步学习建议

### 立即可做
1. [ ] 查看MyBlog的实际migration文件
2. [ ] 运行Prisma Studio查看数据
3. [ ] 修改schema并创建新迁移

### 本周应该做
1. [ ] 进入阶段3：JWT认证与安全
2. [ ] 学习密码加密和安全存储
3. [ ] 理解认证和授权的区别

### 本月应该做
1. [ ] 学习控制器架构
2. [ ] 学习前后端交互
3. [ ] 完整项目实战

---

## 📚 推荐资源

### Prisma官方
- 中文文档：https://www.prisma.io/docs/
- 在线演练场：https://www.prisma.io/docs/getting-started/setup-prisma

### 数据库设计
- 数据库设计规范化原理
- 关系建模最佳实践

### 性能优化
- 数据库索引策略
- 查询优化技巧

---

## 🔗 相关文件

本阶段创建的学习资料：

```
backend/
├── PRISMA_CRUD_GUIDE.md          CRUD操作详细指南
├── PRISMA_MIGRATION_GUIDE.md     迁移管理详细指南
└── PHASE2_SUMMARY.md             本总结文档

schema.prisma                      实际数据模型
migrations/                        迁移文件记录
```

---

*完成时间：本阶段集中学习2-3周*
*预期收获：理解数据库设计和ORM框架，能够独立操作数据库*

---

## ✅ 最后检查清单

确保你理解以下内容：

- [ ] 关系型数据库的5个基本概念（表、行、列、主键、外键）
- [ ] Prisma ORM的3个核心部分（Schema、Client、Migrate）
- [ ] MyBlog的7个数据模型及其关系
- [ ] Prisma的6个主要方法（create、findMany、findUnique、update、delete、count）
- [ ] where、include、select、orderBy的用法
- [ ] N+1查询问题的本质和解决方案
- [ ] 迁移的工作流程
- [ ] 生产环境的部署流程
- [ ] 常用的Prisma命令

如果有任何不清楚的地方，回到相关章节重新学习。

**准备好进入阶段3了吗？** 🚀
