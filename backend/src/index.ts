import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { db } from './utils/database';
import authRoutes from './routes/authRoutes';
import articleRoutes from './routes/articleRoutes';
import categoryRoutes from './routes/categoryRoutes';
import tagRoutes from './routes/tagRoutes';
import commentRoutes from './routes/commentRoutes';
import requestLoggerMiddleware from './middleware/requestLogger';
import { performanceMiddleware, performanceStatsMiddleware } from './middleware/performanceMiddleware';
import { globalErrorHandler, notFoundHandler } from './middleware/errorMiddleware';
import { getMemoryInfo } from './utils/performance';
import Logger from './utils/logger';

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
app.use(requestLoggerMiddleware); // 结构化请求日志
app.use(performanceMiddleware); // 性能监测
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
    const memory = getMemoryInfo();
    
    res.status(200).json({
      status: 'OK',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      database: dbConnected ? 'connected' : 'disconnected',
      memory: {
        heapUsed: `${memory.heapUsed} MB`,
        rss: `${memory.rss} MB`,
      }
    });
  } catch (error) {
    Logger.error('Health check failed', error);
    res.status(503).json({
      status: 'ERROR',
      timestamp: new Date().toISOString(),
      error: 'System unhealthy',
    });
  }
});

// 性能统计端点 (仅在非生产环境或有管理员权限时开放)
// 这里为了演示简单开放，生产环境应加权限控制
app.get('/api/debug/performance', performanceStatsMiddleware, (req, res) => {
  const monitor = (req as any).performanceMonitor;
  if (monitor) {
    res.json({
      stats: monitor.getStats(),
      slowestApis: monitor.getSlowestApis(),
      errorProneApis: monitor.getMostErrorProneApis(),
    });
  } else {
    res.status(500).json({ error: 'Performance monitor not available' });
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
      // ... 其他端点
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
    Logger.error('获取统计数据失败', error);
    res.status(500).json({
      success: false,
      error: '获取统计数据失败',
      timestamp: new Date().toISOString(),
    });
  }
});

// 404 处理
app.use(notFoundHandler);

// 全局错误处理
app.use(globalErrorHandler);

// 启动服务器
if (require.main === module) {
  app.listen(PORT, () => {
    Logger.info(`🚀 服务器运行在端口 ${PORT}`);
    Logger.info(`📍 健康检查: http://localhost:${PORT}/health`);
    Logger.info(`🔌 API 地址: http://localhost:${PORT}/api`);
    Logger.info(`🌟 环境: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
