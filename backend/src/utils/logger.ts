import winston from 'winston';
import path from 'path';

// 定义日志级别颜色
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

// 定义日志格式
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// 生产环境格式（JSON，方便机器解析）
const productionFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

// 创建 Logger 实例
const Logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels: winston.config.npm.levels,
  format: process.env.NODE_ENV === 'production' ? productionFormat : format,
  transports: [
    // 控制台输出
    new winston.transports.Console(),
    // 错误日志文件
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      format: winston.format.json(), // 文件中始终存储 JSON
    }),
    // 所有日志文件
    new winston.transports.File({
      filename: path.join('logs', 'all.log'),
      format: winston.format.json(),
    }),
  ],
});

export default Logger;
