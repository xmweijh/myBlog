# 🚀 部署与运维指南

## 🎯 学习目标

通过本文档，你将学习：
1. ✅ 如何管理不同环境的配置
2. ✅ 如何使用 Docker 容器化应用
3. ✅ 如何使用 Docker Compose 编排服务
4. ✅ CI/CD 自动化流程的基本概念

---

## 🌍 1. 环境配置管理

### 为什么需要环境变量？
- **安全性**：不要将密码、密钥提交到代码仓库。
- **灵活性**：不同环境（开发、测试、生产）使用不同的配置，无需修改代码。

### 最佳实践
1.  **`.env` 文件**：在本地存储敏感信息，**永远不要提交到 Git**。
2.  **`.env.example` 文件**：提交到 Git，包含所有需要的变量名和示例值，但不包含真实密钥。
3.  **配置加载**：使用 `dotenv` 库在应用启动时加载配置。

### 你的项目配置
查看 `backend/.env.example` 了解项目所需的所有环境变量。

---

## 🐳 2. Docker 容器化

### 什么是 Docker？
Docker 将应用及其所有依赖打包成一个**镜像 (Image)**。这个镜像可以在任何安装了 Docker 的机器上运行，保证了"一次构建，到处运行"。

### Dockerfile 解析
你的 `backend/Dockerfile` 采用了**多阶段构建 (Multi-stage Build)**，这是生产环境的最佳实践。

**阶段 1：构建 (Builder)**
- 安装所有依赖（包括开发依赖，如 TypeScript）。
- 编译 TypeScript 代码到 JavaScript。
- 生成 Prisma Client。

**阶段 2：运行 (Runner)**
- 基于轻量级的 `node:18-alpine` 镜像。
- 只安装生产依赖 (`npm ci --only=production`)，大大减小镜像体积。
- 从构建阶段复制编译好的代码 (`dist` 目录)。
- 启动应用。

### 常用 Docker 命令

```bash
# 构建镜像
docker build -t myblog-backend ./backend

# 运行容器
docker run -p 3000:3000 --env-file ./backend/.env myblog-backend

# 查看运行中的容器
docker ps

# 停止容器
docker stop <container_id>
```

---

## 🐙 3. Docker Compose 编排

在真实应用中，我们通常需要同时运行后端、数据库、缓存等多个服务。`docker-compose` 允许我们用一个 YAML 文件定义所有服务，并一键启动。

### 你的 docker-compose.yml
我们定义了两个服务：
1.  **backend**：你的 Node.js 应用。
2.  **postgres**：PostgreSQL 数据库（生产环境通常使用 PostgreSQL 而不是 SQLite）。

### 如何使用

```bash
# 启动所有服务（后台运行）
docker-compose up -d

# 查看日志
docker-compose logs -f

# 停止所有服务
docker-compose down
```

---

## 🔄 4. CI/CD 自动化

**CI (持续集成)**：
每次你推送代码到 GitHub，GitHub Actions 会自动：
1.  安装依赖。
2.  运行代码检查 (Lint)。
3.  运行测试 (Test)。
如果任何一步失败，你会在 GitHub 上看到红色的叉号❌，提醒你修复代码。

**CD (持续部署)**：
当代码合并到 `main` 分支且测试通过后，GitHub Actions 会自动：
1.  构建 Docker 镜像。
2.  将镜像推送到 Docker Hub。
3.  (可选) 通知服务器拉取新镜像并重启服务。

---

## 📚 下一步

现在你已经掌握了如何打包和部署应用。接下来，我们将学习如何**监控**应用的运行状态，确保它健康稳定。

进入 **阶段 6.2：日志管理与监控告警**。
