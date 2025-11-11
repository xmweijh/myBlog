# 📦 从本地部署到腾讯云完整指南
> 详细的本地到腾讯云服务器部署步骤

---

## 🎯 部署流程概览

```
本地开发环境
    ↓
代码提交到 Git
    ↓
腾讯云服务器拉取代码
    ↓
构建 Docker 镜像
    ↓
启动容器
    ↓
初始化数据库
    ↓
应用上线
```

---

## 📋 前置准备

### 1. 本地环境检查

```bash
# 检查 Node.js
node --version  # 需要 18+

# 检查 npm/pnpm
npm --version
pnpm --version

# 检查 Git
git --version

# 检查 Docker（可选，用于本地测试）
docker --version
```

### 2. 腾讯云账户准备

- ✅ 已注册腾讯云账户
- ✅ 已购买云服务器 (CVM)
- ✅ 已获取服务器公网 IP
- ✅ 已配置安全组（开放 22、80、443、3001 端口）
- ✅ 已获取 SSH 密钥或密码

### 3. Git 仓库准备

```bash
# 初始化 Git 仓库（如果还没有）
cd /path/to/myblog
git init

# 添加远程仓库
git remote add origin https://github.com/your-username/myblog.git

# 提交代码
git add .
git commit -m "Initial commit"
git push -u origin main
```

---

## 🚀 第一步：准备本地代码

### 1.1 检查项目结构

```bash
cd /path/to/myblog

# 确保项目结构完整
ls -la
# 应该看到:
# - backend/
# - frontend/
# - docker-compose.yml
# - .env.example
# - scripts/
# - docs/
```

### 1.2 创建 .env 文件

```bash
# 在项目根目录创建 .env 文件
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF

# 注意：不要提交 .env 到 Git
echo ".env" >> .gitignore
```

### 1.3 创建 .dockerignore 文件

```bash
# 后端
cat > backend/.dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
dist
EOF

# 前端
cat > frontend/.dockerignore << EOF
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
dist
EOF
```

### 1.4 本地测试（可选）

```bash
# 在本地测试 Docker 构建
docker-compose build

# 启动容器
docker-compose up -d

# 检查是否正常运行
curl http://localhost:3001/health
curl http://localhost

# 停止容器
docker-compose down
```

---

## 🖥️ 第二步：配置腾讯云服务器

### 2.1 连接到服务器

```bash
# 使用 SSH 密钥连接
ssh -i /path/to/your-key.pem ubuntu@your-server-ip

# 或使用密码连接
ssh ubuntu@your-server-ip
```

### 2.2 更新系统

```bash
# 更新包管理器
sudo apt update
sudo apt upgrade -y

# 安装基础工具
sudo apt install -y curl wget git vim
```

### 2.3 安装 Docker

```bash
# 一键安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将当前用户添加到 docker 组（避免每次都用 sudo）
sudo usermod -aG docker ubuntu

# 验证安装
docker --version

# 注意：需要重新登录或运行以下命令使组成员身份生效
newgrp docker
```

### 2.4 安装 Docker Compose

```bash
# 下载最新版本
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

# 添加执行权限
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker-compose --version
```

### 2.5 安装 Git

```bash
sudo apt install -y git

# 配置 Git（可选）
git config --global user.name "Your Name"
git config --global user.email "your-email@example.com"
```

### 2.6 配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 开放必要的端口
sudo ufw allow 22/tcp    # SSH
sudo ufw allow 80/tcp    # HTTP
sudo ufw allow 443/tcp   # HTTPS
sudo ufw allow 3001/tcp  # 后端 API

# 查看防火墙状态
sudo ufw status
```

---

## 📥 第三步：克隆项目到服务器

### 3.1 克隆代码

```bash
# 进入应用目录
cd /home/ubuntu

# 克隆项目
git clone https://github.com/your-username/myblog.git
cd myblog

# 查看项目结构
ls -la
```

### 3.2 创建环境文件

```bash
# 在服务器上创建 .env 文件
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF

# 查看生成的密钥（保存好！）
cat .env
```

### 3.3 验证 docker-compose.yml

```bash
# 检查 docker-compose.yml 是否存在
cat docker-compose.yml

# 验证配置文件语法
docker-compose config
```

---

## 🐳 第四步：构建和启动容器

### 4.1 构建 Docker 镜像

```bash
# 构建镜像（这会花费几分钟）
docker-compose build

# 查看构建的镜像
docker images
```

### 4.2 启动容器

```bash
# 启动所有容器
docker-compose up -d

# 查看运行中的容器
docker-compose ps

# 查看容器日志
docker-compose logs -f
```

### 4.3 等待容器启动

```bash
# 等待 30 秒让容器完全启动
sleep 30

# 检查后端是否运行
curl http://localhost:3001/health

# 检查前端是否运行
curl http://localhost
```

---

## 🗄️ 第五步：初始化数据库

### 5.1 运行数据库迁移

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行 Prisma 迁移
pnpm run prisma:migrate

# 填充测试数据
pnpm run prisma:seed

# 退出容器
exit
```

### 5.2 验证数据库

```bash
# 进入 MySQL 容器
docker-compose exec mysql mysql -u root -p

# 输入密码（从 .env 文件中获取）

# 查看数据库
SHOW DATABASES;

# 使用 myblog 数据库
USE myblog;

# 查看表
SHOW TABLES;

# 查看用户
SELECT * FROM User;

# 退出
EXIT;
```

---

## 🌐 第六步：配置 Nginx 反向代理

### 6.1 安装 Nginx

```bash
# 安装 Nginx
sudo apt install -y nginx

# 启动 Nginx
sudo systemctl start nginx

# 启用开机自启
sudo systemctl enable nginx

# 查看状态
sudo systemctl status nginx
```

### 6.2 配置 Nginx

```bash
# 创建 Nginx 配置文件
sudo tee /etc/nginx/sites-available/myblog > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    # 前端
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # 后端 API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
EOF

# 启用配置
sudo ln -s /etc/nginx/sites-available/myblog /etc/nginx/sites-enabled/

# 删除默认配置
sudo rm /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔐 第七步：配置 SSL 证书（可选但推荐）

### 7.1 安装 Certbot

```bash
# 安装 Certbot
sudo apt install -y certbot python3-certbot-nginx

# 获取证书（替换为你的域名）
sudo certbot certonly --standalone -d your-domain.com

# 证书位置
# /etc/letsencrypt/live/your-domain.com/fullchain.pem
# /etc/letsencrypt/live/your-domain.com/privkey.pem
```

### 7.2 更新 Nginx 配置

```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/sites-available/myblog

# 替换为以下内容
server {
    listen 80;
    server_name your-domain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;

    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

# 保存并退出（Ctrl+X, Y, Enter）

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx
```

### 7.3 自动续期证书

```bash
# 启用自动续期
sudo systemctl enable certbot.timer
sudo systemctl start certbot.timer

# 测试续期
sudo certbot renew --dry-run
```

---

## ✅ 第八步：验证部署

### 8.1 检查容器状态

```bash
# 查看所有容器
docker-compose ps

# 应该看到:
# - myblog-backend (running)
# - myblog-frontend (running)
# - myblog-mysql (running)
```

### 8.2 检查应用访问

```bash
# 检查后端 API
curl http://localhost:3001/health

# 检查前端
curl http://localhost

# 检查 Nginx
curl http://your-server-ip
```

### 8.3 在浏览器中访问

```
前端: http://your-server-ip
后端 API: http://your-server-ip:3001
```

### 8.4 测试登录

```
邮箱: admin@myblog.com
密码: admin123456
```

---

## 🔄 第九步：更新应用

### 9.1 拉取最新代码

```bash
# 进入项目目录
cd /home/ubuntu/myblog

# 拉取最新代码
git pull origin main
```

### 9.2 重新构建和启动

```bash
# 重新构建镜像
docker-compose build

# 重启容器
docker-compose up -d

# 查看日志
docker-compose logs -f
```

### 9.3 运行数据库迁移（如果有新的迁移）

```bash
# 进入后端容器
docker-compose exec backend sh

# 运行迁移
pnpm run prisma:migrate

# 退出
exit
```

---

## 📊 常用命令速查

### 查看状态

```bash
# 查看容器
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看特定容器日志
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f mysql

# 查看容器资源使用
docker stats
```

### 管理容器

```bash
# 停止容器
docker-compose stop

# 启动容器
docker-compose start

# 重启容器
docker-compose restart

# 重启特定容器
docker-compose restart backend

# 删除容器（谨慎！）
docker-compose down
```

### 进入容器

```bash
# 进入后端容器
docker-compose exec backend sh

# 进入前端容器
docker-compose exec frontend sh

# 进入数据库容器
docker-compose exec mysql bash
```

### 数据库操作

```bash
# 连接数据库
docker-compose exec mysql mysql -u root -p

# 备份数据库
docker-compose exec mysql mysqldump -u root -p myblog > backup.sql

# 恢复数据库
docker-compose exec mysql mysql -u root -p myblog < backup.sql
```

### 查看日志

```bash
# 查看 Nginx 日志
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# 查看系统日志
sudo tail -f /var/log/syslog

# 查看 Docker 日志
docker-compose logs -f
```

---

## 🚨 故障排查

### 问题 1: 无法连接到服务器

```bash
# 检查 SSH 密钥权限
chmod 600 /path/to/your-key.pem

# 检查安全组规则
# 1. 进入腾讯云控制台
# 2. 找到你的服务器
# 3. 点击"安全组"
# 4. 确保 22 端口已开放
```

### 问题 2: Docker 容器无法启动

```bash
# 查看错误日志
docker-compose logs

# 检查端口占用
sudo lsof -i :3001
sudo lsof -i :80

# 重新构建
docker-compose build --no-cache
docker-compose up -d
```

### 问题 3: 数据库连接失败

```bash
# 检查数据库容器
docker-compose ps mysql

# 查看数据库日志
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql

# 检查数据库密码
cat .env | grep MYSQL_ROOT_PASSWORD
```

### 问题 4: 前端无法访问

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx

# 检查防火墙
sudo ufw status
```

### 问题 5: 内存不足

```bash
# 查看内存使用
free -h

# 查看容器资源使用
docker stats

# 清理 Docker
docker system prune -a

# 查看磁盘使用
df -h
```

---

## 📈 性能优化

### 1. 启用 Docker 日志轮转

```bash
# 创建 daemon.json
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null << EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
EOF

# 重启 Docker
sudo systemctl restart docker
```

### 2. 优化数据库

```sql
-- 创建索引
CREATE INDEX idx_articles_category ON articles(categoryId);
CREATE INDEX idx_articles_author ON articles(authorId);
CREATE INDEX idx_comments_article ON comments(articleId);
CREATE INDEX idx_likes_article ON likes(articleId);
```

### 3. 启用 Gzip 压缩

```bash
# 编辑 Nginx 配置
sudo nano /etc/nginx/nginx.conf

# 在 http 块中添加
gzip on;
gzip_types text/plain text/css text/javascript application/json;
gzip_min_length 1000;

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 🔐 安全建议

### 1. 定期更新

```bash
# 更新系统
sudo apt update && sudo apt upgrade -y

# 更新 Docker 镜像
docker-compose pull
docker-compose up -d
```

### 2. 定期备份

```bash
# 创建备份脚本
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
mkdir -p $BACKUP_DIR
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} myblog > $BACKUP_DIR/backup_$TIMESTAMP.sql
echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql"
EOF

chmod +x /home/ubuntu/backup.sh

# 添加定时任务
crontab -e
# 添加: 0 2 * * * /home/ubuntu/backup.sh
```

### 3. 监控应用

```bash
# 创建监控脚本
cat > /home/ubuntu/monitor.sh << 'EOF'
#!/bin/bash
# 检查容器是否运行
docker-compose ps | grep -q "Up" || docker-compose up -d
EOF

chmod +x /home/ubuntu/monitor.sh

# 添加定时任务（每 5 分钟检查一次）
crontab -e
# 添加: */5 * * * * /home/ubuntu/monitor.sh
```

---

## ✅ 部署检查清单

- [ ] 本地代码已提交到 Git
- [ ] 腾讯云服务器已购买
- [ ] SSH 连接成功
- [ ] Docker 已安装
- [ ] Docker Compose 已安装
- [ ] 项目已克隆到服务器
- [ ] .env 文件已创建
- [ ] Docker 镜像已构建
- [ ] 容器已启动
- [ ] 数据库已初始化
- [ ] Nginx 已配置
- [ ] SSL 证书已配置（可选）
- [ ] 应用可以访问
- [ ] 测试账号可以登录
- [ ] 备份策略已配置

---

## 🎉 部署完成！

恭喜！你已经成功从本地部署到腾讯云！

### 下一步

1. **配置域名** - 使用自己的域名访问
2. **优化性能** - 配置 CDN、缓存等
3. **监控告警** - 设置性能监控和告警
4. **定期备份** - 确保数据安全
5. **持续更新** - 定期更新应用和依赖

---

*🚀 祝你使用愉快！*
