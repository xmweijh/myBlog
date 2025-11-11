# ⚡ 快速部署步骤（5分钟版）
> 最简单的本地到腾讯云部署方式

---

## 🚀 三步快速部署

### 第一步：准备工作（1分钟）

```bash
# 1. 进入项目目录
cd /path/to/myblog

# 2. 确保代码已提交到 Git
git status
git add .
git commit -m "Ready to deploy"
git push origin main

# 3. 获取腾讯云服务器信息
# - 服务器 IP: 例如 123.45.67.89
# - SSH 密钥: 例如 /path/to/key.pem
```

### 第二步：运行部署脚本（3分钟）

```bash
# 使用 SSH 密钥
bash scripts/deploy-to-tencent.sh 123.45.67.89 /path/to/key.pem

# 或使用密码（会提示输入密码）
bash scripts/deploy-to-tencent.sh 123.45.67.89
```

### 第三步：访问应用（1分钟）

```
前端: http://123.45.67.89
后端: http://123.45.67.89:3001

测试账号:
邮箱: admin@myblog.com
密码: admin123456
```

---

## 📋 前置条件检查

在运行部署脚本前，请确保：

- ✅ 已购买腾讯云服务器
- ✅ 已获取服务器公网 IP
- ✅ 已配置安全组（开放 22、80、443、3001 端口）
- ✅ 已获取 SSH 密钥或密码
- ✅ 本地已安装 Git
- ✅ 代码已提交到 Git 仓库

---

## 🔧 手动部署（如果脚本失败）

### 步骤 1：连接到服务器

```bash
# 使用 SSH 密钥
ssh -i /path/to/key.pem ubuntu@123.45.67.89

# 或使用密码
ssh ubuntu@123.45.67.89
```

### 步骤 2：安装 Docker

```bash
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

docker --version
docker-compose --version
```

### 步骤 3：克隆项目

```bash
cd /home/ubuntu
git clone https://github.com/your-username/myblog.git
cd myblog
```

### 步骤 4：创建环境文件

```bash
cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF
```

### 步骤 5：启动应用

```bash
docker-compose build
docker-compose up -d
sleep 10
docker-compose exec backend pnpm run prisma:migrate
docker-compose exec backend pnpm run prisma:seed
```

### 步骤 6：配置 Nginx

```bash
sudo apt install -y nginx

sudo tee /etc/nginx/sites-available/myblog > /dev/null << 'EOF'
server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
EOF

sudo ln -sf /etc/nginx/sites-available/myblog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

### 步骤 7：验证

```bash
curl http://localhost:3001/health
curl http://localhost
```

---

## 📊 常用命令

### 查看日志

```bash
# 所有日志
docker-compose logs -f

# 后端日志
docker-compose logs -f backend

# 前端日志
docker-compose logs -f frontend
```

### 管理容器

```bash
# 查看状态
docker-compose ps

# 停止
docker-compose stop

# 启动
docker-compose start

# 重启
docker-compose restart
```

### 更新应用

```bash
# 拉取最新代码
git pull origin main

# 重新构建
docker-compose build

# 重启
docker-compose up -d
```

---

## 🚨 常见问题

### Q: 脚本执行失败？

```bash
# 检查 SSH 连接
ssh -i /path/to/key.pem ubuntu@123.45.67.89 "echo 'OK'"

# 检查安全组是否开放了 22 端口
# 进入腾讯云控制台 -> 安全组 -> 入站规则
```

### Q: 容器无法启动？

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

### Q: 无法访问应用？

```bash
# 检查容器是否运行
docker-compose ps

# 检查后端 API
curl http://localhost:3001/health

# 检查 Nginx
sudo systemctl status nginx
sudo tail -f /var/log/nginx/error.log
```

---

## 📞 获取帮助

- **详细部署指南**: 查看 `docs/LOCAL_TO_TENCENT_CLOUD_DEPLOYMENT.md`
- **快速部署指南**: 查看 `docs/TENCENT_CLOUD_QUICK_START.md`
- **故障排查**: 查看 `docs/DEPLOYMENT_GUIDE.md` 中的故障排查部分

---

## ✅ 部署检查清单

- [ ] 腾讯云服务器已购买
- [ ] 获取了服务器 IP
- [ ] 配置了安全组
- [ ] 获取了 SSH 密钥
- [ ] 代码已提交到 Git
- [ ] 运行了部署脚本
- [ ] 应用可以访问
- [ ] 测试账号可以登录

---

*🚀 祝你部署顺利！*
