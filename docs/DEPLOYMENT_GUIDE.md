# 🚀 MyBlog 腾讯云部署指南
> 完整的生产环境部署方案，包含Docker容器化、云服务器配置、数据库设置等

---

## 📋 部署前准备

### 1. 腾讯云账户和资源

#### 需要购买的资源
- **云服务器 (CVM)**: 2核4GB内存，Ubuntu 20.04 LTS
- **云数据库 (MySQL)**: 1核1GB内存（可选，也可用本地SQLite）
- **对象存储 (COS)**: 用于存储文章图片（可选）
- **域名**: 用于访问应用（可选）

#### 推荐配置
```
云服务器: 2核4GB (¥99/月)
操作系统: Ubuntu 20.04 LTS
带宽: 5Mbps
存储: 50GB SSD
```

### 2. 本地准备

```bash
# 确保已安装
- Node.js 18+
- Docker & Docker Compose
- Git
- npm 或 pnpm
```

---

## 🐳 Docker 容器化

### 第一步：创建后端 Dockerfile

```dockerfile
# backend/Dockerfile
FROM node:18-alpine

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建 TypeScript
RUN pnpm run build

# 暴露端口
EXPOSE 3001

# 启动应用
CMD ["pnpm", "start"]
```

### 第二步：创建前端 Dockerfile

```dockerfile
# frontend/Dockerfile
FROM node:18-alpine as builder

WORKDIR /app

# 复制 package 文件
COPY package*.json ./
COPY pnpm-lock.yaml ./

# 安装依赖
RUN npm install -g pnpm && pnpm install --frozen-lockfile

# 复制源代码
COPY . .

# 构建应用
RUN pnpm run build

# 使用 nginx 作为生产服务器
FROM nginx:alpine

# 复制构建结果
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 nginx 配置
COPY nginx.conf /etc/nginx/conf.d/default.conf

# 暴露端口
EXPOSE 80

# 启动 nginx
CMD ["nginx", "-g", "daemon off;"]
```

### 第三步：创建 nginx 配置

```nginx
# frontend/nginx.conf
server {
    listen 80;
    server_name _;

    # 静态文件缓存
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API 代理
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # React Router 支持
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

### 第四步：创建 Docker Compose 文件

```yaml
# docker-compose.yml
version: '3.8'

services:
  # 后端服务
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: myblog-backend
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:./prisma/prod.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_EXPIRE=7d
    volumes:
      - ./backend/prisma:/app/prisma
    restart: always
    networks:
      - myblog-network

  # 前端服务
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: myblog-frontend
    ports:
      - "80:80"
      - "443:443"
    depends_on:
      - backend
    restart: always
    networks:
      - myblog-network

  # MySQL 数据库（可选）
  mysql:
    image: mysql:8.0
    container_name: myblog-mysql
    environment:
      - MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD}
      - MYSQL_DATABASE=myblog
    ports:
      - "3306:3306"
    volumes:
      - mysql-data:/var/lib/mysql
    restart: always
    networks:
      - myblog-network

networks:
  myblog-network:
    driver: bridge

volumes:
  mysql-data:
```

---

## 🖥️ 腾讯云服务器配置

### 第一步：连接到服务器

```bash
# 使用 SSH 连接
ssh -i your-key.pem ubuntu@your-server-ip

# 或使用密码
ssh ubuntu@your-server-ip
```

### 第二步：安装必要软件

```bash
# 更新系统
sudo apt update
sudo apt upgrade -y

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

# 安装 Git
sudo apt install -y git

# 安装 Node.js（可选，用于直接运行）
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs
```

### 第三步：配置防火墙

```bash
# 开放必要端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # 后端 API
sudo ufw allow 3306/tcp  # MySQL

# 启用防火墙
sudo ufw enable

# 查看防火墙状态
sudo ufw status
```

### 第四步：配置 SSL 证书（使用 Let's Encrypt）

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem

# 自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer
```

---

## 📦 部署应用

### 第一步：克隆项目

```bash
# 进入应用目录
cd /home/ubuntu

# 克隆项目
git clone https://github.com/your-username/myblog.git
cd myblog

# 创建 .env 文件
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=your-secret-key-here
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=your-mysql-password
EOF
```

### 第二步：构建和启动容器

```bash
# 构建镜像
docker-compose build

# 启动容器
docker-compose up -d

# 查看日志
docker-compose logs -f

# 查看运行中的容器
docker-compose ps
```

### 第三步：初始化数据库

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行数据库迁移
pnpm run prisma:migrate

# 填充测试数据
pnpm run prisma:seed

# 退出容器
exit
```

### 第四步：配置 Nginx 反向代理

```bash
# 创建 Nginx 配置
sudo tee /etc/nginx/sites-available/myblog > /dev/null << EOF
server {
    listen 80;
    server_name your-domain.com;

    # 重定向到 HTTPS
    return 301 https://\$server_name\$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    # SSL 证书
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    # SSL 配置
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    # 前端
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/myblog /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔧 常用命令

### Docker 相关

```bash
# 查看容器日志
docker-compose logs -f backend
docker-compose logs -f frontend

# 进入容器
docker-compose exec backend sh
docker-compose exec frontend sh

# 重启容器
docker-compose restart backend
docker-compose restart frontend

# 停止容器
docker-compose stop

# 启动容器
docker-compose start

# 删除容器
docker-compose down

# 查看容器资源使用
docker stats
```

### 数据库相关

```bash
# 连接 MySQL
mysql -h localhost -u root -p

# 备份数据库
mysqldump -u root -p myblog > backup.sql

# 恢复数据库
mysql -u root -p myblog < backup.sql

# Prisma 命令
docker-compose exec backend pnpm run prisma:migrate
docker-compose exec backend pnpm run prisma:seed
docker-compose exec backend pnpm run prisma:studio
```

### 系统相关

```bash
# 查看磁盘使用
df -h

# 查看内存使用
free -h

# 查看进程
ps aux

# 查看网络连接
netstat -tuln

# 查看日志
tail -f /var/log/syslog
```

---

## 📊 监控和维护

### 1. 日志管理

```bash
# 查看应用日志
docker-compose logs -f

# 导出日志
docker-compose logs > logs.txt

# 清理日志
docker-compose logs --tail 100
```

### 2. 性能监控

```bash
# 实时监控
docker stats

# 查看容器详情
docker inspect container-name

# 查看网络
docker network ls
```

### 3. 备份策略

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p myblog > backup-$(date +%Y%m%d).sql

# 备份应用数据
tar -czf myblog-backup-$(date +%Y%m%d).tar.gz /home/ubuntu/myblog

# 定时备份（crontab）
0 2 * * * docker-compose exec mysql mysqldump -u root -p myblog > /backups/backup-$(date +\%Y\%m\%d).sql
```

### 4. 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建镜像
docker-compose build

# 重启容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

---

## 🔐 安全配置

### 1. 环境变量管理

```bash
# 创建 .env 文件（不要提交到 Git）
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF

# 设置权限
chmod 600 .env
```

### 2. 防火墙配置

```bash
# 只允许必要的端口
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable
```

### 3. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Docker 镜像
docker-compose pull
docker-compose up -d

# 更新依赖
docker-compose exec backend pnpm update
```

---

## 🚨 故障排查

### 问题 1: 容器无法启动

```bash
# 查看错误日志
docker-compose logs backend

# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :80

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 问题 2: 数据库连接失败

```bash
# 检查数据库容器
docker-compose ps mysql

# 查看数据库日志
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql
```

### 问题 3: 前端无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

### 问题 4: 内存不足

```bash
# 查看内存使用
free -h

# 清理 Docker
docker system prune -a

# 查看容器资源限制
docker stats
```

---

## 📈 性能优化

### 1. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_articles_category ON articles(categoryId);
CREATE INDEX idx_articles_author ON articles(authorId);
CREATE INDEX idx_comments_article ON comments(articleId);
CREATE INDEX idx_likes_article ON likes(articleId);
```

### 2. 缓存配置

```bash
# 在 docker-compose.yml 中添加 Redis
redis:
  image: redis:7-alpine
  container_name: myblog-redis
  ports:
    - "6379:6379"
  restart: always
```

### 3. CDN 配置

```bash
# 使用腾讯云 CDN
# 1. 在腾讯云控制台创建 CDN 分发
# 2. 配置源站为你的服务器
# 3. 更新 DNS 指向 CDN
```

---

## 📞 常见问题

### Q1: 如何更新应用代码？

```bash
# 1. 拉取最新代码
git pull origin main

# 2. 重新构建
docker-compose build

# 3. 重启容器
docker-compose up -d

# 4. 查看日志
docker-compose logs -f
```

### Q2: 如何备份数据？

```bash
# 备份数据库
docker-compose exec mysql mysqldump -u root -p myblog > backup.sql

# 备份应用
tar -czf myblog-backup.tar.gz /home/ubuntu/myblog
```

### Q3: 如何扩展存储？

```bash
# 1. 在腾讯云控制台扩展磁盘
# 2. 连接到服务器
# 3. 扩展分区
sudo growpart /dev/vda 1
sudo resize2fs /dev/vda1
```

### Q4: 如何配置自动备份？

```bash
# 编辑 crontab
crontab -e

# 添加定时任务
0 2 * * * docker-compose exec mysql mysqldump -u root -p myblog > /backups/backup-$(date +\%Y\%m\%d).sql
```

---

## 🎯 部署检查清单

- [ ] 购买腾讯云服务器
- [ ] 安装 Docker 和 Docker Compose
- [ ] 克隆项目代码
- [ ] 创建 .env 文件
- [ ] 构建 Docker 镜像
- [ ] 启动容器
- [ ] 初始化数据库
- [ ] 配置 Nginx
- [ ] 配置 SSL 证书
- [ ] 配置防火墙
- [ ] 测试应用访问
- [ ] 配置备份策略
- [ ] 配置监控告警
- [ ] 文档更新

---

## 📚 相关资源

- [腾讯云官方文档](https://cloud.tencent.com/document)
- [Docker 官方文档](https://docs.docker.com/)
- [Nginx 官方文档](https://nginx.org/en/docs/)
- [Let's Encrypt 官方文档](https://letsencrypt.org/docs/)

---

*🚀 部署指南完成！祝你部署顺利！*
