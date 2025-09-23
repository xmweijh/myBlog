import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// API 路由
app.use('/api', (req, res) => {
  res.status(200).json({
    message: 'MyBlog API 服务正在运行',
    version: '1.0.0',
    endpoints: [
      'GET /health - 健康检查',
      'GET /api - API 信息',
    ],
  });
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
