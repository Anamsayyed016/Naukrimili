# VPS Setup Commands

## Connect to your VPS:
```bash
ssh root@69.62.73.84
```

## Install Node.js:
```bash
curl -fsSL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs
```

## Install PM2:
```bash
npm install -g pm2
```

## Create directories:
```bash
mkdir -p /var/www/aftionix.in
mkdir -p /var/log/aftionix
```

## Set up firewall:
```bash
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload
```

## Quick deployment:
```bash
cd /var/www/aftionix.in
git clone https://github.com/yourusername/jobportal.git .
npm install --production
npm run build
pm2 start npm --name "aftionix" -- start
pm2 save
pm2 startup
```