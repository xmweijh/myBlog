import { PrismaClient } from '@prisma/client';
import { Role, ArticleStatus } from '../src/types/database';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// 生成密码哈希
async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 12);
}

// 生成 slug
function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function main() {
  console.log('🌱 开始填充种子数据...');

  // 清理现有数据（开发环境）
  if (process.env.NODE_ENV === 'development') {
    console.log('🧹 清理现有数据...');
    await prisma.like.deleteMany();
    await prisma.comment.deleteMany();
    await prisma.articleTag.deleteMany();
    await prisma.article.deleteMany();
    await prisma.tag.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

  // 创建用户
  console.log('👥 创建用户...');
  const adminPassword = await hashPassword('admin123456');
  const userPassword = await hashPassword('user123456');

  const admin = await prisma.user.create({
    data: {
      email: 'admin@myblog.com',
      username: 'admin',
      password: adminPassword,
      bio: 'MyBlog 系统管理员',
      role: Role.ADMIN,
      avatar: 'https://ui-avatars.com/api/?name=Admin&background=3b82f6&color=fff',
    },
  });

  const user1 = await prisma.user.create({
    data: {
      email: 'john@example.com',
      username: 'john_doe',
      password: userPassword,
      bio: '热爱技术的前端开发者',
      role: Role.USER,
      avatar: 'https://ui-avatars.com/api/?name=John&background=10b981&color=fff',
    },
  });

  const user2 = await prisma.user.create({
    data: {
      email: 'jane@example.com',
      username: 'jane_smith',
      password: userPassword,
      bio: '全栈工程师，喜欢分享技术心得',
      role: Role.USER,
      avatar: 'https://ui-avatars.com/api/?name=Jane&background=f59e0b&color=fff',
    },
  });

  // 创建分类
  console.log('📂 创建分类...');
  const categories = [
    {
      name: '前端开发',
      slug: 'frontend',
      description: '前端技术分享，包括React、Vue、JavaScript等',
      color: '#3b82f6',
    },
    {
      name: '后端开发',
      slug: 'backend',
      description: '后端技术分享，包括Node.js、Python、数据库等',
      color: '#10b981',
    },
    {
      name: '全栈开发',
      slug: 'fullstack',
      description: '全栈开发经验和项目分享',
      color: '#f59e0b',
    },
    {
      name: '技术杂谈',
      slug: 'tech-talk',
      description: '技术趋势、职业发展、编程思考',
      color: '#8b5cf6',
    },
    {
      name: '项目实战',
      slug: 'projects',
      description: '实际项目开发经验和案例分析',
      color: '#ef4444',
    },
  ];

  const createdCategories = await Promise.all(
    categories.map(category => prisma.category.create({ data: category }))
  );

  // 创建标签
  console.log('🏷️ 创建标签...');
  const tags = [
    { name: 'React', slug: 'react', color: '#61dafb' },
    { name: 'Vue.js', slug: 'vue', color: '#4fc08d' },
    { name: 'TypeScript', slug: 'typescript', color: '#3178c6' },
    { name: 'Node.js', slug: 'nodejs', color: '#339933' },
    { name: 'Express', slug: 'express', color: '#000000' },
    { name: 'Prisma', slug: 'prisma', color: '#2d3748' },
    { name: 'PostgreSQL', slug: 'postgresql', color: '#336791' },
    { name: 'Tailwind CSS', slug: 'tailwind', color: '#06b6d4' },
    { name: 'Vite', slug: 'vite', color: '#646cff' },
    { name: '性能优化', slug: 'performance', color: '#f97316' },
    { name: '最佳实践', slug: 'best-practices', color: '#84cc16' },
    { name: '教程', slug: 'tutorial', color: '#06b6d4' },
  ];

  const createdTags = await Promise.all(
    tags.map(tag => prisma.tag.create({ data: tag }))
  );

  // 创建文章
  console.log('📝 创建文章...');
  const articles = [
    {
      title: 'MyBlog 全栈博客系统开发指南',
      slug: 'myblog-fullstack-development-guide',
      excerpt: '从零开始构建现代化的全栈博客系统，使用 React + Node.js + TypeScript 技术栈',
      content: `# MyBlog 全栈博客系统开发指南

欢迎来到 MyBlog 项目！这是一个现代化的全栈博客系统，使用最新的技术栈构建。

## 技术特性

### 前端技术栈
- **React 18**: 最新的 React 版本，支持并发特性
- **TypeScript**: 提供类型安全和更好的开发体验
- **Vite**: 极速的构建工具和开发服务器
- **Tailwind CSS**: 原子化 CSS 框架
- **Zustand**: 轻量级状态管理

### 后端技术栈
- **Node.js**: JavaScript 运行时环境
- **Express.js**: 轻量级 Web 框架
- **TypeScript**: 服务端类型安全
- **Prisma**: 现代化 ORM
- **PostgreSQL**: 强大的关系型数据库
- **JWT**: 安全的用户认证

## 项目特色

### 🚀 现代化架构
采用 Monorepo 架构，前后端代码统一管理，便于协作和部署。

### 🛡️ 类型安全
全栈 TypeScript，从数据库到前端界面都有完整的类型检查。

### 📱 响应式设计
基于 Tailwind CSS 构建的现代化界面，完美适配各种设备。

### ⚡ 高性能
优化的构建配置和缓存策略，确保最佳的用户体验。

## 开始使用

\`\`\`bash
# 克隆项目
git clone <项目地址>

# 安装依赖
pnpm install

# 启动开发环境
pnpm dev
\`\`\`

## 学习收获

通过这个项目，你将学习到：

- 现代化全栈开发流程
- 数据库设计和 ORM 使用
- RESTful API 设计原则
- React Hooks 和现代组件开发
- TypeScript 最佳实践
- 性能优化技巧

让我们一起构建这个优秀的博客系统！`,
      coverImage: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      authorId: admin.id,
      categoryId: createdCategories[2].id, // 全栈开发
      status: ArticleStatus.PUBLISHED,
      isTop: true,
      publishedAt: new Date(),
    },
    {
      title: 'React 18 新特性详解：并发渲染和 Hooks 优化',
      slug: 'react-18-new-features-concurrent-rendering',
      excerpt: '深入了解 React 18 的并发特性、自动批处理、Suspense 改进等新功能',
      content: `# React 18 新特性详解

React 18 引入了许多令人兴奋的新特性，其中最重要的是并发渲染功能。

## 并发特性

### startTransition
\`\`\`jsx
import { useTransition } from 'react';

function App() {
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState('');

  const handleChange = (e) => {
    startTransition(() => {
      setFilter(e.target.value);
    });
  };

  return (
    <div>
      <input onChange={handleChange} />
      {isPending && <Spinner />}
      <FilteredList filter={filter} />
    </div>
  );
}
\`\`\`

### useDeferredValue
\`\`\`jsx
import { useDeferredValue } from 'react';

function SearchResults({ query }) {
  const deferredQuery = useDeferredValue(query);

  return <Results query={deferredQuery} />;
}
\`\`\`

## 自动批处理

React 18 会自动批处理多个状态更新，减少不必要的重新渲染。

## Suspense 改进

服务端渲染支持 Suspense，实现流式渲染。

这些新特性让 React 应用更加高效和用户友好！`,
      coverImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      authorId: user1.id,
      categoryId: createdCategories[0].id, // 前端开发
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 86400000), // 1天前
    },
    {
      title: 'Node.js 性能优化最佳实践',
      slug: 'nodejs-performance-optimization-best-practices',
      excerpt: '分享 Node.js 应用性能优化的实用技巧和最佳实践',
      content: `# Node.js 性能优化最佳实践

性能优化是 Node.js 应用开发中的重要主题。

## 内存管理

### 避免内存泄漏
\`\`\`javascript
// 正确清理事件监听器
process.on('SIGTERM', () => {
  server.close(() => {
    database.disconnect();
  });
});
\`\`\`

## 异步操作优化

### 使用连接池
\`\`\`javascript
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20,
  idleTimeoutMillis: 30000,
});
\`\`\`

## 缓存策略

### Redis 缓存
\`\`\`javascript
const redis = require('redis');
const client = redis.createClient();

async function getUser(id) {
  const cached = await client.get(\`user:\${id}\`);
  if (cached) return JSON.parse(cached);

  const user = await db.user.findUnique({ where: { id } });
  await client.setex(\`user:\${id}\`, 3600, JSON.stringify(user));
  return user;
}
\`\`\`

通过这些优化技巧，可以大幅提升 Node.js 应用的性能！`,
      coverImage: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      authorId: user2.id,
      categoryId: createdCategories[1].id, // 后端开发
      status: ArticleStatus.PUBLISHED,
      publishedAt: new Date(Date.now() - 172800000), // 2天前
    },
    {
      title: 'TypeScript 进阶技巧：泛型和类型体操',
      slug: 'typescript-advanced-generics-type-gymnastics',
      excerpt: '掌握 TypeScript 的高级特性，提升代码类型安全性',
      content: `# TypeScript 进阶技巧

TypeScript 的类型系统非常强大，掌握高级特性能让代码更安全、更优雅。

## 泛型约束

\`\`\`typescript
interface Lengthwise {
  length: number;
}

function loggingIdentity<T extends Lengthwise>(arg: T): T {
  console.log(arg.length);
  return arg;
}
\`\`\`

## 映射类型

\`\`\`typescript
type Partial<T> = {
  [P in keyof T]?: T[P];
};

type Required<T> = {
  [P in keyof T]-?: T[P];
};
\`\`\`

## 条件类型

\`\`\`typescript
type NonNullable<T> = T extends null | undefined ? never : T;

type ReturnType<T> = T extends (...args: any[]) => infer R ? R : any;
\`\`\`

这些高级特性让 TypeScript 更加强大！`,
      coverImage: 'https://images.unsplash.com/photo-1516116216624-53e697fedbea?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80',
      authorId: admin.id,
      categoryId: createdCategories[3].id, // 技术杂谈
      status: ArticleStatus.DRAFT,
    },
  ];

  const createdArticles = await Promise.all(
    articles.map(article => prisma.article.create({ data: article }))
  );

  // 为文章添加标签
  console.log('🔗 关联文章和标签...');
  await prisma.articleTag.createMany({
    data: [
      // MyBlog 指南文章的标签
      { articleId: createdArticles[0].id, tagId: createdTags.find(t => t.slug === 'react')!.id },
      { articleId: createdArticles[0].id, tagId: createdTags.find(t => t.slug === 'nodejs')!.id },
      { articleId: createdArticles[0].id, tagId: createdTags.find(t => t.slug === 'typescript')!.id },
      { articleId: createdArticles[0].id, tagId: createdTags.find(t => t.slug === 'tutorial')!.id },

      // React 18 文章的标签
      { articleId: createdArticles[1].id, tagId: createdTags.find(t => t.slug === 'react')!.id },
      { articleId: createdArticles[1].id, tagId: createdTags.find(t => t.slug === 'performance')!.id },
      { articleId: createdArticles[1].id, tagId: createdTags.find(t => t.slug === 'best-practices')!.id },

      // Node.js 性能优化文章的标签
      { articleId: createdArticles[2].id, tagId: createdTags.find(t => t.slug === 'nodejs')!.id },
      { articleId: createdArticles[2].id, tagId: createdTags.find(t => t.slug === 'performance')!.id },
      { articleId: createdArticles[2].id, tagId: createdTags.find(t => t.slug === 'best-practices')!.id },

      // TypeScript 进阶文章的标签
      { articleId: createdArticles[3].id, tagId: createdTags.find(t => t.slug === 'typescript')!.id },
      { articleId: createdArticles[3].id, tagId: createdTags.find(t => t.slug === 'tutorial')!.id },
    ]
  });

  // 创建评论
  console.log('💬 创建评论...');
  const comments = [
    {
      content: '这篇文章写得太好了！对新手很友好，代码示例也很清晰。',
      authorId: user1.id,
      articleId: createdArticles[0].id,
    },
    {
      content: '感谢分享！已经开始尝试搭建自己的博客系统了。',
      authorId: user2.id,
      articleId: createdArticles[0].id,
    },
    {
      content: 'React 18 的并发特性确实很强大，期待更多深入的内容！',
      authorId: admin.id,
      articleId: createdArticles[1].id,
    },
  ];

  const createdComments = await Promise.all(
    comments.map(comment => prisma.comment.create({ data: comment }))
  );

  // 创建回复评论
  await prisma.comment.create({
    data: {
      content: '谢谢支持！后续会持续更新更多实用内容。',
      authorId: admin.id,
      articleId: createdArticles[0].id,
      parentId: createdComments[0].id,
    }
  });

  // 创建点赞
  console.log('👍 创建点赞...');
  await prisma.like.createMany({
    data: [
      { userId: user1.id, articleId: createdArticles[0].id },
      { userId: user2.id, articleId: createdArticles[0].id },
      { userId: admin.id, articleId: createdArticles[1].id },
      { userId: user2.id, articleId: createdArticles[1].id },
      { userId: user1.id, articleId: createdArticles[2].id },
    ]
  });

  // 更新文章的点赞数和浏览数
  await prisma.article.update({
    where: { id: createdArticles[0].id },
    data: { likeCount: 2, viewCount: 156 }
  });

  await prisma.article.update({
    where: { id: createdArticles[1].id },
    data: { likeCount: 2, viewCount: 98 }
  });

  await prisma.article.update({
    where: { id: createdArticles[2].id },
    data: { likeCount: 1, viewCount: 67 }
  });

  console.log('✅ 种子数据填充完成！');
  console.log('\n📊 数据统计:');
  console.log(`👥 用户: ${await prisma.user.count()} 个`);
  console.log(`📂 分类: ${await prisma.category.count()} 个`);
  console.log(`🏷️ 标签: ${await prisma.tag.count()} 个`);
  console.log(`📝 文章: ${await prisma.article.count()} 篇`);
  console.log(`💬 评论: ${await prisma.comment.count()} 条`);
  console.log(`👍 点赞: ${await prisma.like.count()} 个`);

  console.log('\n🔐 测试账号:');
  console.log('管理员: admin@myblog.com / admin123456');
  console.log('用户1: john@example.com / user123456');
  console.log('用户2: jane@example.com / user123456');
}

main()
  .catch((e) => {
    console.error('❌ 种子数据填充失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
