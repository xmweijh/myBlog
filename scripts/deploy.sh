#!/bin/bash
# MyBlog 腾讯云部署脚本
# 使用方法: bash scripts/deploy.sh

set -e

echo "🚀 MyBlog 部署脚本"
echo "=================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
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

# 检查环境
check_environment() {
    print_info "检查环境..."

    # 检查 Docker
    if ! command -v docker &> /dev/null; then
        print_error "Docker 未安装"
        exit 1
    fi
    print_info "✓ Docker 已安装"

    # 检查 Docker Compose
    if ! command -v docker-compose &> /dev/null; then
        print_error "Docker Compose 未安装"
        exit 1
    fi
    print_info "✓ Docker Compose 已安装"

    # 检查 Git
    if ! command -v git &> /dev/null; then
        print_error "Git 未安装"
        exit 1
    fi
    print_info "✓ Git 已安装"
}

# 创建环境文件
create_env_file() {
    print_info "创建环境文件..."

    if [ ! -f .env ]; then
        cat > .env << EOF
NODE_ENV=production
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRE=7d
MYSQL_ROOT_PASSWORD=$(openssl rand -base64 16)
EOF
        print_info "✓ .env 文件已创建"
    else
        print_warn ".env 文件已存在，跳过创建"
    fi
}

# 构建镜像
build_images() {
    print_info "构建 Docker 镜像..."
    docker-compose build
    print_info "✓ 镜像构建完成"
}

# 启动容器
start_containers() {
    print_info "启动容器..."
    docker-compose up -d
    print_info "✓ 容器已启动"
}

# 初始化数据库
init_database() {
    print_info "初始化数据库..."
    
    # 等待数据库启动
    sleep 5
    
    # 运行迁移
    docker-compose exec -T backend pnpm run prisma:migrate
    print_info "✓ 数据库迁移完成"
    
    # 填充测试数据
    docker-compose exec -T backend pnpm run prisma:seed
    print_info "✓ 测试数据已填充"
}

# 检查应用状态
check_status() {
    print_info "检查应用状态..."
    
    # 检查后端
    if curl -s http://localhost:3001/health > /dev/null; then
        print_info "✓ 后端服务正常"
    else
        print_error "后端服务异常"
    fi
    
    # 检查前端
    if curl -s http://localhost:80 > /dev/null; then
        print_info "✓ 前端服务正常"
    else
        print_error "前端服务异常"
    fi
}

# 显示访问信息
show_access_info() {
    print_info "部署完成！"
    echo ""
    echo "📍 访问地址:"
    echo "   前端: http://localhost"
    echo "   后端: http://localhost:3001"
    echo ""
    echo "🔐 测试账号:"
    echo "   邮箱: admin@myblog.com"
    echo "   密码: admin123456"
    echo ""
    echo "📊 常用命令:"
    echo "   查看日志: docker-compose logs -f"
    echo "   进入容器: docker-compose exec backend sh"
    echo "   停止应用: docker-compose stop"
    echo "   启动应用: docker-compose start"
    echo ""
}

# 主函数
main() {
    print_info "开始部署..."
    
    check_environment
    create_env_file
    build_images
    start_containers
    init_database
    check_status
    show_access_info
    
    print_info "部署成功！"
}

# 执行主函数
main
