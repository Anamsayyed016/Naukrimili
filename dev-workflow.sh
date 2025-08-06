#!/bin/bash

# 🔄 Development Workflow Script
# Quick commands for server development

SERVER_IP="69.62.73.84"
SERVER_USER="root"
REMOTE_PATH="/root/jobportal"

case "$1" in
    "connect")
        echo "🔌 Connecting to server..."
        ssh ${SERVER_USER}@${SERVER_IP}
        ;;
    
    "sync")
        echo "🔄 Syncing files to server..."
        pnpm build
        rsync -avz --delete \
            --exclude 'node_modules' \
            --exclude '.git' \
            .next/ ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/.next/
        
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && systemctl restart jobportal"
        echo "✅ Sync completed!"
        ;;
    
    "status")
        echo "📊 Checking server status..."
        ssh ${SERVER_USER}@${SERVER_IP} "systemctl status jobportal --no-pager"
        ;;
    
    "logs")
        echo "📋 Showing server logs..."
        ssh ${SERVER_USER}@${SERVER_IP} "journalctl -u jobportal -f"
        ;;
    
    "restart")
        echo "🔄 Restarting server application..."
        ssh ${SERVER_USER}@${SERVER_IP} "systemctl restart jobportal"
        echo "✅ Server restarted!"
        ;;
    
    *)
        echo "🚀 Development Workflow Commands:"
        echo "  ./dev-workflow.sh connect  - SSH into server"
        echo "  ./dev-workflow.sh sync     - Build and sync to server"
        echo "  ./dev-workflow.sh status   - Check service status"
        echo "  ./dev-workflow.sh logs     - View live logs"
        echo "  ./dev-workflow.sh restart  - Restart application"
        ;;
esac
