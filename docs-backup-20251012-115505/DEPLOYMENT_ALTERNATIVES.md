# 🚀 **DEPLOYMENT ALTERNATIVES - NO SSH REQUIRED**

## ✅ **OPTION 1: GitHub Actions with Deploy Scripts (Recommended)**

### **How it works:**
1. GitHub Actions builds your app
2. Creates a deployment package
3. Uses a webhook or API to trigger deployment on your server
4. Server pulls and deploys automatically

### **Setup:**
1. **Create a webhook endpoint on your server**
2. **GitHub Actions calls the webhook**
3. **Server automatically pulls and deploys**

---

## ✅ **OPTION 2: FTP/SFTP Deployment**

### **How it works:**
1. GitHub Actions builds your app
2. Uploads files via FTP/SFTP
3. Server automatically restarts the application

### **Setup:**
```yaml
- name: Deploy via FTP
  uses: SamKirkland/FTP-Deploy-Action@4.3.4
  with:
    server: your-server-ip
    username: ${{ secrets.FTP_USERNAME }}
    password: ${{ secrets.FTP_PASSWORD }}
    local-dir: ./
    server-dir: /var/www/jobportal/
```

---

## ✅ **OPTION 3: Docker Container Deployment**

### **How it works:**
1. GitHub Actions builds Docker image
2. Pushes to Docker Hub or GitHub Container Registry
3. Server pulls and runs the new container

### **Setup:**
```yaml
- name: Build and push Docker image
  run: |
    docker build -t jobportal:latest .
    docker push jobportal:latest

- name: Deploy to server
  run: |
    # Server pulls and runs new container
    ssh server "docker pull jobportal:latest && docker-compose up -d"
```

---

## ✅ **OPTION 4: Git Webhook Deployment**

### **How it works:**
1. Server has a webhook listener
2. GitHub sends webhook on push
3. Server automatically pulls and deploys

### **Server Setup:**
```bash
# Install webhook listener
npm install -g github-webhook-handler

# Create webhook script
cat > /var/www/webhook.js << 'EOF'
const http = require('http');
const exec = require('child_process').exec;
const createHandler = require('github-webhook-handler');

const handler = createHandler({
  path: '/webhook',
  secret: 'your-webhook-secret'
});

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('no such location');
  });
}).listen(7777);

handler.on('push', (event) => {
  console.log('Received push event');
  exec('cd /var/www/jobportal && git pull && npm install && npm run build && pm2 restart jobportal', (error, stdout, stderr) => {
    if (error) {
      console.error('Deploy error:', error);
    } else {
      console.log('Deploy successful:', stdout);
    }
  });
});
EOF

# Start webhook listener
pm2 start /var/www/webhook.js --name webhook
```

### **GitHub Actions:**
```yaml
- name: Trigger Webhook
  run: |
    curl -X POST http://your-server-ip:7777/webhook \
      -H "Content-Type: application/json" \
      -H "X-GitHub-Event: push" \
      -H "X-Hub-Signature: sha1=your-signature" \
      -d '{"ref":"refs/heads/main"}'
```

---

## ✅ **OPTION 5: Simple File Upload Deployment**

### **How it works:**
1. GitHub Actions builds the app
2. Creates a ZIP file
3. Uploads to server via HTTP API
4. Server extracts and deploys

### **Server API Endpoint:**
```javascript
// /var/www/deploy-api.js
const express = require('express');
const multer = require('multer');
const unzip = require('extract-zip');
const { exec } = require('child_process');

const app = express();
const upload = multer({ dest: '/tmp/' });

app.post('/deploy', upload.single('deployment'), (req, res) => {
  const zipPath = req.file.path;
  
  // Extract to deployment directory
  unzip(zipPath, { dir: '/var/www/jobportal' }, (err) => {
    if (err) {
      res.status(500).send('Deploy failed');
      return;
    }
    
    // Install dependencies and restart
    exec('cd /var/www/jobportal && npm install && npm run build && pm2 restart jobportal', (error) => {
      if (error) {
        res.status(500).send('Restart failed');
      } else {
        res.send('Deploy successful');
      }
    });
  });
});

app.listen(3001);
```

---

## 🎯 **RECOMMENDED APPROACH: Webhook Deployment**

**This is the most reliable and doesn't require SSH:**

1. **Server Setup:**
   - Install webhook listener
   - Create deployment script
   - Set up PM2 to manage the webhook service

2. **GitHub Actions:**
   - Build the application
   - Trigger webhook on server
   - Server handles the rest

3. **Benefits:**
   - No SSH required
   - Automatic deployment
   - Easy to debug
   - Reliable and fast

## 🚀 **QUICK SETUP COMMANDS**

**Run these on your server to set up webhook deployment:**

```bash
# Install webhook handler
npm install -g github-webhook-handler

# Create webhook script
cat > /var/www/deploy-webhook.js << 'EOF'
const http = require('http');
const exec = require('child_process').exec;
const crypto = require('crypto');
const createHandler = require('github-webhook-handler');

const handler = createHandler({
  path: '/webhook',
  secret: 'your-webhook-secret-here'
});

http.createServer((req, res) => {
  handler(req, res, (err) => {
    res.statusCode = 404;
    res.end('Not found');
  });
}).listen(7777);

handler.on('push', (event) => {
  console.log('Received push event for', event.payload.ref);
  
  if (event.payload.ref === 'refs/heads/main') {
    console.log('Deploying main branch...');
    
    exec(`
      cd /var/www/jobportal &&
      git pull origin main &&
      npm install --legacy-peer-deps --engine-strict=false --force &&
      npx prisma generate &&
      npm run build &&
      pm2 restart jobportal
    `, (error, stdout, stderr) => {
      if (error) {
        console.error('Deploy error:', error);
      } else {
        console.log('Deploy successful!');
        console.log(stdout);
      }
    });
  }
});

console.log('Webhook server running on port 7777');
EOF

# Start webhook service
pm2 start /var/www/deploy-webhook.js --name deploy-webhook

# Test the webhook
curl -X POST http://localhost:7777/webhook \
  -H "Content-Type: application/json" \
  -d '{"ref":"refs/heads/main"}'
```

**This will give you automatic deployments without SSH!** 🎉
