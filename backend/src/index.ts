import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './utils/database';
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import commentRoutes from './routes/commentRoutes';

// 加载环境变量
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// 基础中间件
app.use(helmet()); // 安全头
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
})); // 跨域支持
app.use(compression()); // 响应压缩
app.use(morgan('combined')); // 请求日志
app.use(express.json({ limit: '10mb' })); // JSON 解析
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // URL 编码解析

// 速率限制
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 分钟
  max: 100, // 限制每个 IP 每 15 分钟最多 100 个请求
  message: {
    error: '请求过于频繁，请稍后再试',
  },
});
app.use('/api', limiter);

// 健康检查端点
app.get('/health', async (req, res) => {
  try {
    const dbConnected = await db.testConnection();
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
    });
  } catch (error) {
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'Database connection failed',
    });
  }
});

// 认证路由
app.use('/api/auth', authRoutes);

// 文章路由
app.use('/api/articles', articleRoutes);

// 分类路由
app.use('/api/categories', categoryRoutes);

// 标签路由
app.use('/api/tags', tagRoutes);

// 评论路由
app.use('/api/comments', commentRoutes);

// API 基础信息
app.get('/api', (req, res) => {
  res.status(200).json({
    message: 'MyBlog API 服务正在运行',
    version: '1.0.0',
    endpoints: [
      'GET /health - 健康检查',
      'GET /api - API 信息',
      'GET /api/stats - 数据统计',
      'GET /api/articles - 文章列表',
      'GET /api/categories - 分类列表',
      'GET /api/tags - 标签列表',
      'POST /api/auth/register - 用户注册',
      'POST /api/auth/login - 用户登录',
      'GET /api/auth/me - 获取当前用户信息',
      'PUT /api/auth/profile - 更新用户资料',
      'PUT /api/auth/password - 修改密码',
      'POST /api/articles - 创建文章',
      'GET /api/articles - 获取文章列表',
      'GET /api/articles/:id - 获取文章详情',
      'PUT /api/articles/:id - 更新文章',
      'DELETE /api/articles/:id - 删除文章',
      'GET /api/articles/user/:userId - 获取用户文章列表',
    ],
  });
});

// 数据统计 API
app.get('/api/stats', async (req, res) => {
  try {
    const client = db.getClient();
    const stats = await Promise.all([
      client.user.count(),
      client.article.count(),
      client.category.count(),
      client.tag.count(),
      client.comment.count(),
      client.like.count(),
    ]);

    res.json({
      success: true,
      data: {
        users: stats[0],
        articles: stats[1],
        categories: stats[2],
        tags: stats[3],
        comments: stats[4],
        likes: stats[5],
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取统计数据失败:', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 文章列表 API
app.get('/api/articles', async (req, res) => {
  try {
    const client = db.getClient();
    const articles = await client.article.findMany({
      include: {
        author: {
          select: {
            id: true,
            username: true,
            avatar: true,
          },
        },
        category: true,
        tags: {
          include: {
            tag: true,
          },
        },
        _count: {
          select: {
            comments: true,
            likes: true,
          },
        },
      },
      where: {
        status: 'PUBLISHED',
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: 10,
    });

    res.json({
      success: true,
      data: articles,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取文章列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取文章列表失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 分类列表 API
app.get('/api/categories', async (req, res) => {
  try {
    const client = db.getClient();
    const categories = await client.category.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    res.json({
      success: true,
      data: categories,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取分类列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取分类列表失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 标签列表 API
app.get('/api/tags', async (req, res) => {
  try {
    const client = db.getClient();
    const tags = await client.tag.findMany({
      include: {
        _count: {
          select: {
            articles: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    res.json({
      success: true,
      data: tags,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('获取标签列表失败:', error);
    res.status(500).json({
      success: false,
      error: '获取标签列表失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 处理
app.use('*', (req, res) => {
  res.status(404).json({
    error: '接口不存在',
    path: req.originalUrl,
  });
});

// 全局错误处理
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);

  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production' ? '服务器内部错误' : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 服务器运行在端口 ${PORT}`);
  console.log(`📍 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔌 API 地址: http://localhost:${PORT}/api`);
  console.log(`🌟 环境: ${process.env.NODE_ENV || 'development'}`);
});

export default app;
