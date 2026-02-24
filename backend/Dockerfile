# 阶段1：构建阶段
FROM node:18-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件
COPY package*.json ./
COPY prisma ./prisma/

# 安装所有依赖（包括devDependencies，因为需要编译TS）
RUN npm ci

# 复制源代码
COPY . .

# 生成 Prisma Client
RUN npx prisma generate

# 编译 TypeScript 代码
RUN npm run build

# 阶段2：运行阶段
FROM node:18-alpine AS runner

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV NODE_ENV=production

# 复制 package.json 用于安装生产依赖
COPY package*.json ./

# 只安装生产依赖
RUN npm ci --only=production

# 复制构建产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# 再次生成 Prisma Client (针对运行环境)
RUN npx prisma generate

# 暴露端口
EXPOSE 3000

# 启动命令
# 注意：生产环境通常在启动前运行迁移，或者在部署流程中单独运行
CMD ["node", "dist/index.js"]
