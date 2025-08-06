# 🚀 Direct Server Sync Script for Windows
# This script syncs your local project to Hostinger server

param(
    [string]$Action = "sync"
)

$SERVER_IP = "69.62.73.84"
$SERVER_USER = "root"
$LOCAL_PATH = "."
$REMOTE_PATH = "/root/jobportal"

Write-Host "🚀 Job Portal Server Sync" -ForegroundColor Blue
Write-Host "=========================" -ForegroundColor Blue

function Write-Success { param($Message) Write-Host "[SUCCESS] $Message" -ForegroundColor Green }
function Write-Info { param($Message) Write-Host "[INFO] $Message" -ForegroundColor Cyan }
function Write-Warning { param($Message) Write-Host "[WARNING] $Message" -ForegroundColor Yellow }
function Write-Error { param($Message) Write-Host "[ERROR] $Message" -ForegroundColor Red }

switch ($Action) {
    "sync" {
        Write-Info "Building project locally..."
        pnpm build
        
        Write-Info "Syncing files to server..."
        # Using SCP to copy files
        scp -r .next ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp -r public ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp -r app ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp -r components ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp -r lib ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp -r styles ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp package.json ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp server.js ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp next.config.mjs ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        scp tailwind.config.ts ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        
        Write-Info "Restarting server application..."
        ssh ${SERVER_USER}@${SERVER_IP} "cd ${REMOTE_PATH} && systemctl restart jobportal"
        
        Write-Success "Sync completed! Visit: http://${SERVER_IP}"
    }
    
    "status" {
        Write-Info "Checking server status..."
        ssh ${SERVER_USER}@${SERVER_IP} "systemctl status jobportal --no-pager"
    }
    
    "logs" {
        Write-Info "Showing server logs..."
        ssh ${SERVER_USER}@${SERVER_IP} "journalctl -u jobportal -f"
    }
    
    "shell" {
        Write-Info "Opening server shell..."
        ssh ${SERVER_USER}@${SERVER_IP}
    }
    
    "setup" {
        Write-Info "Setting up server environment..."
        ssh ${SERVER_USER}@${SERVER_IP} @"
            # Create project directory
            mkdir -p ${REMOTE_PATH}
            cd ${REMOTE_PATH}
            
            # Install Node.js if not installed
            curl -fsSL https://fnm.vercel.app/install | bash
            source ~/.bashrc
            fnm install --lts
            fnm use lts-latest
            npm install -g pnpm
            
            # Install dependencies
            pnpm install
            
            echo "Server setup completed!"
"@
    }
    
    "deploy" {
        Write-Info "Full deployment to server..."
        
        # Build locally
        Write-Info "Building locally..."
        pnpm build
        
        # Sync all files
        Write-Info "Syncing all files..."
        ssh ${SERVER_USER}@${SERVER_IP} "mkdir -p ${REMOTE_PATH}"
        scp -r * ${SERVER_USER}@${SERVER_IP}:${REMOTE_PATH}/
        
        # Install and start on server
        ssh ${SERVER_USER}@${SERVER_IP} @"
            cd ${REMOTE_PATH}
            pnpm install
            
            # Create systemd service
            cat > /etc/systemd/system/jobportal.service << 'EOF'
[Unit]
Description=Job Portal Next.js Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=${REMOTE_PATH}
Environment=NODE_ENV=production
Environment=PORT=3000
ExecStart=/root/.local/share/fnm/node-versions/v*/installation/bin/node server.js
Restart=on-failure
RestartSec=5s

[Install]
WantedBy=multi-user.target
EOF
            
            # Start service
            systemctl daemon-reload
            systemctl enable jobportal
            systemctl start jobportal
            
            echo "Deployment completed!"
"@
        
        Write-Success "Full deployment completed! Visit: http://${SERVER_IP}"
    }
    
    default {
        Write-Info "Usage: .\sync-to-server.ps1 [action]"
        Write-Info "Actions:"
        Write-Info "  sync   - Sync built files to server and restart"
        Write-Info "  status - Check server status"
        Write-Info "  logs   - Show server logs"
        Write-Info "  shell  - Open server SSH session"
        Write-Info "  setup  - Setup server environment"
        Write-Info "  deploy - Full deployment"
    }
}
