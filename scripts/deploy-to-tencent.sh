#!/bin/bash
# MyBlog 一键部署到腾讯云脚本
# 使用方法: bash scripts/deploy-to-tencent.sh <server-ip> <ssh-key-path>

set -e

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 函数：打印信息
print_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_step() {
    echo -e "${BLUE}[STEP]${NC} $1"
}

# 检查参数
if [ $# -lt 1 ]; then
    print_error "缺少参数"
    echo "使用方法: bash scripts/deploy-to-tencent.sh <server-ip> [ssh-key-path]"
    echo "示例: bash scripts/deploy-to-tencent.sh 123.45.67.89 /path/to/key.pem"
    exit 1
fi

SERVER_IP=$1
SSH_KEY=${2:-""}
SSH_USER="ubuntu"

# 检查本地环境
check_local_environment() {
    print_step "检查本地环境..."

    # 检查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装"
        exit 1
    fi
    print_info "✓ Git 已安装"

    # 检查 SSH
    if ! command -v ssh &> /dev/null; then
        print_error "SSH 未安装"
        exit 1
    fi
    print_info "✓ SSH 已安装"
}

# 测试 SSH 连接
test_ssh_connection() {
    print_step "测试 SSH 连接..."

    if [ -n "$SSH_KEY" ]; then
        SSH_CMD="ssh -i $SSH_KEY $SSH_USER@$SERVER_IP"
    else
        SSH_CMD="ssh $SSH_USER@$SERVER_IP"
    fi

    if $SSH_CMD "echo 'SSH 连接成功'" > /dev/null 2>&1; then
        print_info "✓ SSH 连接成功"
    else
        print_error "SSH 连接失败"
        print_error "请检查:"
        print_error "1. 服务器 IP 是否正确: $SERVER_IP"
        print_error "2. SSH 密钥是否正确: $SSH_KEY"
        print_error "3. 安全组是否开放了 22 端口"
        exit 1
    fi
}

# 在服务器上执行命令
run_remote_cmd() {
    local cmd=$1
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "$cmd"
    else
        ssh "$SSH_USER@$SERVER_IP" "$cmd"
    fi
}

# 在服务器上执行脚本
run_remote_script() {
    local script=$1
    if [ -n "$SSH_KEY" ]; then
        ssh -i "$SSH_KEY" "$SSH_USER@$SERVER_IP" "bash -s" < "$script"
    else
        ssh "$SSH_USER@$SERVER_IP" "bash -s" < "$script"
    fi
}

# 安装 Docker
install_docker() {
    print_step "在服务器上安装 Docker..."

    cat > /tmp/install-docker.sh << 'EOF'
#!/bin/bash
set -e

# 检查 Docker 是否已安装
if command -v docker &> /dev/null; then
    echo "Docker 已安装"
    exit 0
fi

# 安装 Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 将用户添加到 docker 组
sudo usermod -aG docker ubuntu

# 安装 Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 验证安装
docker --version
docker-compose --version

echo "Docker 安装完成"
EOF

    run_remote_script /tmp/install-docker.sh
    print_info "✓ Docker 安装完成"
}

# 克隆项目
clone_project() {
    print_step "克隆项目到服务器..."

    # 获取 Git 仓库 URL
    REPO_URL=$(git config --get remote.origin.url)

    if [ -z "$REPO_URL" ]; then
        print_error "无法获取 Git 仓库 URL"
        print_error "请确保项目已初始化 Git 仓库"
        exit 1
    fi

    print_info "仓库 URL: $REPO_URL"

    # 克隆项目
    run_remote_cmd "cd /home/ubuntu && git clone $REPO_URL myblog || (cd myblog && git pull origin main)"
    print_info "✓ 项目克隆完成"
}

# 创建环境文件
create_env_file() {
    print_step "创建环境文件..."

    cat > /tmp/create-env.sh << 'EOF'
#!/bin/bash
cd /home/ubuntu/myblog

if [ ! -f .env ]; then
    cat > .env << ENVEOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
ENVEOF
    echo ".env 文件已创建"
    cat .env
else
    echo ".env 文件已存在"
    cat .env
fi
EOF

    run_remote_script /tmp/create-env.sh
    print_info "✓ 环境文件创建完成"
}

# 构建和启动容器
build_and_start() {
    print_step "构建和启动容器..."

    cat > /tmp/build-start.sh << 'EOF'
#!/bin/bash
set -e
cd /home/ubuntu/myblog

echo "构建 Docker 镜像..."
docker-compose build

echo "启动容器..."
docker-compose up -d

echo "等待容器启动..."
sleep 10

echo "检查容器状态..."
docker-compose ps

echo "容器启动完成"
EOF

    run_remote_script /tmp/build-start.sh
    print_info "✓ 容器构建和启动完成"
}

# 初始化数据库
init_database() {
    print_step "初始化数据库..."

    cat > /tmp/init-db.sh << 'EOF'
#!/bin/bash
set -e
cd /home/ubuntu/myblog

echo "运行数据库迁移..."
docker-compose exec -T backend pnpm run prisma:migrate

echo "填充测试数据..."
docker-compose exec -T backend pnpm run prisma:seed

echo "数据库初始化完成"
EOF

    run_remote_script /tmp/init-db.sh
    print_info "✓ 数据库初始化完成"
}

# 配置 Nginx
configure_nginx() {
    print_step "配置 Nginx..."

    cat > /tmp/configure-nginx.sh << 'EOF'
#!/bin/bash
set -e

# 安装 Nginx
sudo apt install -y nginx

# 创建配置文件
sudo tee /etc/nginx/sites-available/myblog > /dev/null << 'NGINXEOF'
server {
    listen 80;
    server_name _;

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
NGINXEOF

# 启用配置
sudo ln -sf /etc/nginx/sites-available/myblog /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# 测试配置
sudo nginx -t

# 重启 Nginx
sudo systemctl restart nginx

echo "Nginx 配置完成"
EOF

    run_remote_script /tmp/configure-nginx.sh
    print_info "✓ Nginx 配置完成"
}

# 配置防火墙
configure_firewall() {
    print_step "配置防火墙..."

    cat > /tmp/configure-firewall.sh << 'EOF'
#!/bin/bash

# 启用防火墙
sudo ufw enable

# 开放端口
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 3001/tcp

# 查看状态
sudo ufw status

echo "防火墙配置完成"
EOF

    run_remote_script /tmp/configure-firewall.sh
    print_info "✓ 防火墙配置完成"
}

# 验证部署
verify_deployment() {
    print_step "验证部署..."

    # 检查容器
    print_info "检查容器状态..."
    run_remote_cmd "docker-compose ps"

    # 检查后端
    print_info "检查后端 API..."
    if run_remote_cmd "curl -s http://localhost:3001/health" > /dev/null; then
        print_info "✓ 后端 API 正常"
    else
        print_warn "⚠ 后端 API 可能有问题"
    fi

    # 检查前端
    print_info "检查前端..."
    if run_remote_cmd "curl -s http://localhost" > /dev/null; then
        print_info "✓ 前端正常"
    else
        print_warn "⚠ 前端可能有问题"
    fi
}

# 显示访问信息
show_access_info() {
    print_step "部署完成！"
    echo ""
    echo -e "${GREEN}📍 访问地址:${NC}"
    echo "   前端: http://$SERVER_IP"
    echo "   后端: http://$SERVER_IP:3001"
    echo ""
    echo -e "${GREEN}🔐 测试账号:${NC}"
    echo "   邮箱: admin@myblog.com"
    echo "   密码: admin123456"
    echo ""
    echo -e "${GREEN}📊 常用命令:${NC}"
    echo "   查看日志: ssh $SSH_USER@$SERVER_IP 'docker-compose logs -f'"
    echo "   进入容器: ssh $SSH_USER@$SERVER_IP 'docker-compose exec backend sh'"
    echo "   停止应用: ssh $SSH_USER@$SERVER_IP 'docker-compose stop'"
    echo "   启动应用: ssh $SSH_USER@$SERVER_IP 'docker-compose start'"
    echo ""
}

# 主函数
main() {
    print_info "开始部署 MyBlog 到腾讯云"
    echo "服务器 IP: $SERVER_IP"
    echo ""

    check_local_environment
    test_ssh_connection
    install_docker
    clone_project
    create_env_file
    build_and_start
    init_database
    configure_nginx
    configure_firewall
    verify_deployment
    show_access_info

    print_info "部署成功！"
}

# 执行主函数
main
