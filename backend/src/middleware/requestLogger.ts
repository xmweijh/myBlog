import morgan, { StreamOptions } from 'morgan';
import Logger from '../utils/logger';

// 定义流，将 morgan 的日志输出到 winston
const stream: StreamOptions = {
  write: (message) => Logger.http(message.trim()),
};

// 跳过逻辑（例如：在测试环境中跳过日志）
const skip = () => {
  const env = process.env.NODE_ENV || 'development';
  return env !== 'development' && env !== 'production';
};

// 构建 morgan 中间件
const requestLoggerMiddleware = morgan(
  // 定义日志格式
  ':remote-addr - :method :url :status :res[content-length] - :response-time ms',
  { stream, skip }
);

export default requestLoggerMiddleware;
