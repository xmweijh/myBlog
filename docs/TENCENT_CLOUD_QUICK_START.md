# 🚀 腾讯云快速部署指南
> 5分钟快速部署 MyBlog 到腾讯云

---

## 📋 快速步骤

### 步骤 1: 购买腾讯云服务器 (2分钟)

1. **访问腾讯云官网**
   - 地址: https://cloud.tencent.com/
   - 登录或注册账号

2. **购买云服务器 (CVM)**
   - 进入 CVM 控制台
   - 点击"新建"
   - 选择配置:
     - 地域: 选择离你最近的地域
     - 可用区: 默认
     - 实例类型: 标准型 S5
     - 实例规格: 2核4GB (¥99/月)
     - 镜像: Ubuntu 20.04 LTS
     - 存储: 50GB SSD
     - 带宽: 5Mbps

3. **配置安全组**
   - 开放端口: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3001 (API)

4. **获取公网 IP**
   - 记下分配的公网 IP 地址

### 步骤 2: 连接到服务器 (1分钟)

```bash
# 使用 SSH 连接
ssh -i your-key.pem ubuntu@your-server-ip

# 或使用密码连接
ssh ubuntu@your-server-ip
```

### 步骤 3: 安装 Docker (1分钟)

```bash
# 一键安装脚本
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version
```

### 步骤 4: 部署应用 (1分钟)

```bash
# 克隆项目
cd /home/ubuntu
git clone https://github.com/your-username/myblog.git
cd myblog

# 运行部署脚本
bash scripts/deploy.sh
```

---

## 🎯 部署后配置

### 配置域名（可选）

```bash
# 1. 在腾讯云购买域名或转入
# 2. 配置 DNS 解析
#    - 记录类型: A
#    - 主机记录: @
#    - 记录值: 你的服务器 IP

# 3. 配置 SSL 证书
sudo apt install -y certbot
sudo certbot certonly --standalone -d your-domain.com

# 4. 更新 Nginx 配置
sudo nano /etc/nginx/sites-available/myblog
# 修改 server_name 为你的域名
# 添加 SSL 证书路径

# 5. 重启 Nginx
sudo systemctl restart nginx
```

### 配置数据库备份

```bash
# 创建备份目录
mkdir -p /home/ubuntu/backups

# 创建备份脚本
cat > /home/ubuntu/backup.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="/home/ubuntu/backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
docker-compose exec -T mysql mysqldump -u root -p${MYSQL_ROOT_PASSWORD} myblog > $BACKUP_DIR/backup_$TIMESTAMP.sql
echo "Backup completed: $BACKUP_DIR/backup_$TIMESTAMP.sql"
EOF

chmod +x /home/ubuntu/backup.sh

# 添加定时任务（每天凌晨2点备份）
crontab -e
# 添加: 0 2 * * * /home/ubuntu/backup.sh
```

---

## 📊 常用命令速查

### 查看应用状态

```bash
# 查看所有容器
docker-compose ps

# 查看日志
docker-compose logs -f

# 查看后端日志
docker-compose logs -f backend

# 查看前端日志
docker-compose logs -f frontend
```

### 管理应用

```bash
# 停止应用
docker-compose stop

# 启动应用
docker-compose start

# 重启应用
docker-compose restart

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

# 查看数据库
SHOW DATABASES;

# 使用数据库
USE myblog;

# 查看表
SHOW TABLES;

# 查看用户
SELECT * FROM User;
```

---

## 🔍 访问应用

### 本地访问

```
前端: http://localhost
后端 API: http://localhost:3001
```

### 远程访问

```
前端: http://your-server-ip
后端 API: http://your-server-ip:3001
```

### 测试账号

```
邮箱: admin@myblog.com
密码: admin123456
```

---

## 🚨 常见问题

### Q1: 无法连接到服务器？

```bash
# 检查安全组规则
# 1. 进入腾讯云控制台
# 2. 找到你的服务器
# 3. 点击"安全组"
# 4. 确保 22 端口已开放

# 检查 SSH 密钥权限
chmod 600 your-key.pem
```

### Q2: Docker 容器无法启动？

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

### Q3: 数据库连接失败？

```bash
# 检查数据库容器
docker-compose ps mysql

# 查看数据库日志
docker-compose logs mysql

# 重启数据库
docker-compose restart mysql
```

### Q4: 前端无法访问？

```bash
# 检查 Nginx 配置
sudo nginx -t

# 查看 Nginx 日志
sudo tail -f /var/log/nginx/error.log

# 重启 Nginx
sudo systemctl restart nginx
```

---

## 📈 性能优化

### 1. 增加服务器配置

```bash
# 在腾讯云控制台升级实例
# 1. 停止实例
# 2. 调整配置
# 3. 重启实例
```

### 2. 启用 CDN

```bash
# 1. 在腾讯云创建 CDN 分发
# 2. 配置源站为你的服务器
# 3. 更新 DNS 指向 CDN
```

### 3. 数据库优化

```sql
-- 创建索引
CREATE INDEX idx_articles_category ON articles(categoryId);
CREATE INDEX idx_articles_author ON articles(authorId);
CREATE INDEX idx_comments_article ON comments(articleId);
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

### 2. 配置防火墙

```bash
# 启用防火墙
sudo ufw enable

# 只允许必要的端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
```

### 3. 定期备份

```bash
# 每天自动备份
0 2 * * * /home/ubuntu/backup.sh
```

---

## 📞 获取帮助

### 腾讯云支持

- **官方文档**: https://cloud.tencent.com/document
- **工单支持**: 在腾讯云控制台提交工单
- **社区论坛**: https://cloud.tencent.com/developer/support

### 项目支持

- **GitHub Issues**: 提交问题
- **文档**: 查看 docs 目录
- **部署指南**: 查看 DEPLOYMENT_GUIDE.md

---

## ✅ 部署检查清单

- [ ] 购买腾讯云服务器
- [ ] 获取公网 IP
- [ ] 配置安全组
- [ ] SSH 连接成功
- [ ] Docker 安装完成
- [ ] 项目克隆成功
- [ ] 部署脚本运行成功
- [ ] 应用访问正常
- [ ] 测试账号登录成功
- [ ] 配置域名（可选）
- [ ] 配置 SSL 证书（可选）
- [ ] 配置备份策略

---

## 🎉 部署完成！

恭喜！你已经成功部署了 MyBlog 到腾讯云！

### 下一步

1. **配置域名** - 使用自己的域名访问
2. **优化性能** - 配置 CDN、缓存等
3. **监控告警** - 设置性能监控和告警
4. **定期备份** - 确保数据安全
5. **持续更新** - 定期更新应用和依赖

---

*🚀 祝你使用愉快！*
