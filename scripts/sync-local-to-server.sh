#!/bin/bash
# 同步本地代码到服务器脚本
# 使用方法: bash scripts/sync-local-to-server.sh <server-ip> [ssh-user] [remote-path]

SERVER_IP=$1
SSH_USER=${2:-root}
REMOTE_PATH=${3:-"~/myBlog"}

if [ -z "$SERVER_IP" ]; then
    echo "❌ 错误: 请提供服务器 IP"
    echo "使用方法: bash scripts/sync-local-to-server.sh <server-ip> [ssh-user] [remote-path]"
    echo "示例: bash scripts/sync-local-to-server.sh 119.27.186.64 root ~/myBlog"
    exit 1
fi

echo "🔄 正在同步代码到 $SSH_USER@$SERVER_IP:$REMOTE_PATH ..."

# 同步 backend/src 目录
echo "📦 同步 backend/src..."
scp -r backend/src "$SSH_USER@$SERVER_IP:$REMOTE_PATH/backend/"

# 同步 backend/package.json (以防依赖有变动)
echo "📦 同步 backend/package.json..."
scp backend/package.json "$SSH_USER@$SERVER_IP:$REMOTE_PATH/backend/"

# 同步 docker-compose.yml (以防配置有变动)
echo "📦 同步 docker-compose.yml..."
scp docker-compose.yml "$SSH_USER@$SERVER_IP:$REMOTE_PATH/"

echo "🚀 重启后端容器..."
ssh "$SSH_USER@$SERVER_IP" "cd $REMOTE_PATH && docker compose restart backend"

echo "✅ 同步并重启完成！"