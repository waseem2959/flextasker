# 🚀 FlexTasker Production Deployment Guide

This guide provides step-by-step instructions for deploying FlexTasker to production.

---

## 📋 Prerequisites

### System Requirements
- **Node.js**: 18+ LTS
- **PostgreSQL**: 14+
- **Redis**: 6+
- **Nginx**: 1.20+ (recommended)
- **SSL Certificate**: For HTTPS

### Required Services
- **Database**: PostgreSQL instance
- **Cache**: Redis instance
- **Email**: SMTP service (Gmail, SendGrid, etc.)
- **Storage**: File storage service (AWS S3, etc.)
- **Payments**: Stripe account

---

## 🔧 Environment Configuration

### 1. Frontend Environment (.env.local)
```bash
# API Configuration
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_UPLOAD_URL=https://api.yourdomain.com/uploads
VITE_AUTH_ENDPOINT=/api/auth

# Application
VITE_APP_NAME=FlexTasker
VITE_APP_VERSION=1.0.0
NODE_ENV=production

# Features
VITE_ENABLE_ANALYTICS=true
VITE_ENABLE_OFFLINE=true
VITE_ENABLE_NOTIFICATIONS=true
VITE_ENABLE_PWA=true

# External Services
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
VITE_GOOGLE_MAPS_API_KEY=your_maps_key
```

### 2. Backend Environment (server/.env)
```bash
# Server
NODE_ENV=production
PORT=3000
HOST=0.0.0.0
BASE_URL=https://api.yourdomain.com
CLIENT_URL=https://yourdomain.com

# Database
DATABASE_URL="postgresql://username:password@localhost:5432/flextasker_prod"

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PREFIX=flextasker:prod:

# JWT
JWT_SECRET=your-super-secure-jwt-secret-256-bits
JWT_EXPIRES_IN=7d
JWT_REFRESH_EXPIRES_IN=30d

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password
EMAIL_FROM=noreply@yourdomain.com

# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# File Upload
UPLOAD_DIR=/var/www/uploads
MAX_FILE_SIZE=5242880

# Security
CORS_ORIGIN=https://yourdomain.com
BCRYPT_ROUNDS=12

# Logging
LOG_LEVEL=info
```

---

## 🗄️ Database Setup

### 1. Create Production Database
```sql
CREATE DATABASE flextasker_prod;
CREATE USER flextasker_user WITH PASSWORD 'secure_password';
GRANT ALL PRIVILEGES ON DATABASE flextasker_prod TO flextasker_user;
```

### 2. Run Migrations
```bash
cd server
npx prisma migrate deploy
npx prisma generate
```

### 3. Seed Initial Data (Optional)
```bash
npm run seed:prod
```

---

## 🏗️ Build Process

### 1. Install Dependencies
```bash
# Frontend
npm ci --production

# Backend
cd server
npm ci --production
```

### 2. Build Applications
```bash
# Frontend
npm run build

# Backend
cd server
npm run build
```

### 3. Verify Builds
```bash
# Check frontend build
ls -la dist/

# Check backend build
ls -la server/dist/
```

---

## 🌐 Nginx Configuration

### 1. Create Nginx Config (/etc/nginx/sites-available/flextasker)
```nginx
# Frontend (Static Files)
server {
    listen 80;
    listen [::]:80;
    server_name yourdomain.com www.yourdomain.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Strict-Transport-Security "max-age=63072000" always;

    # Frontend Static Files
    location / {
        root /var/www/flextasker/dist;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API Proxy
    location /api/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket Support
    location /socket.io/ {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}

# API Server (Separate subdomain)
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name api.yourdomain.com;

    # SSL Configuration (same as above)
    ssl_certificate /path/to/ssl/cert.pem;
    ssl_certificate_key /path/to/ssl/private.key;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### 2. Enable Site
```bash
sudo ln -s /etc/nginx/sites-available/flextasker /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

---

## 🔄 Process Management

### 1. PM2 Configuration (ecosystem.config.js)
```javascript
module.exports = {
  apps: [{
    name: 'flextasker-api',
    script: './server/dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

### 2. Start Application
```bash
# Install PM2 globally
npm install -g pm2

# Start application
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

---

## 📊 Monitoring Setup

### 1. PM2 Monitoring
```bash
# Monitor processes
pm2 monit

# View logs
pm2 logs

# Restart application
pm2 restart flextasker-api
```

### 2. Log Rotation
```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure log rotation
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 30
```

---

## 🔒 Security Checklist

### 1. Firewall Configuration
```bash
# Allow SSH, HTTP, HTTPS
sudo ufw allow ssh
sudo ufw allow 80
sudo ufw allow 443
sudo ufw enable
```

### 2. SSL Certificate (Let's Encrypt)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com -d api.yourdomain.com

# Auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 3. Database Security
```bash
# Secure PostgreSQL
sudo -u postgres psql
\password postgres
```

---

## 🚀 Deployment Script

### deploy.sh
```bash
#!/bin/bash
set -e

echo "🚀 Starting FlexTasker deployment..."

# Pull latest code
git pull origin main

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --production
cd server && npm ci --production && cd ..

# Build applications
echo "🏗️ Building applications..."
npm run build
cd server && npm run build && cd ..

# Run database migrations
echo "🗄️ Running database migrations..."
cd server && npx prisma migrate deploy && cd ..

# Restart application
echo "🔄 Restarting application..."
pm2 restart flextasker-api

# Reload Nginx
echo "🌐 Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✅ Deployment completed successfully!"
```

---

## 🔧 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version (18+ required)
   - Clear node_modules and reinstall
   - Check for TypeScript errors

2. **Database Connection**
   - Verify DATABASE_URL format
   - Check PostgreSQL service status
   - Verify user permissions

3. **Redis Connection**
   - Check Redis service status
   - Verify REDIS_URL configuration
   - Test Redis connectivity

4. **SSL Issues**
   - Verify certificate paths
   - Check certificate expiration
   - Test SSL configuration

### Health Checks
```bash
# Check application health
curl https://api.yourdomain.com/health

# Check database connection
curl https://api.yourdomain.com/api/health

# Check Redis connection
redis-cli ping
```

---

## 📈 Performance Optimization

### 1. Database Optimization
- Enable connection pooling
- Configure query optimization
- Set up read replicas for scaling

### 2. Caching Strategy
- Configure Redis for session storage
- Enable application-level caching
- Set up CDN for static assets

### 3. Monitoring
- Set up application performance monitoring
- Configure error tracking
- Monitor resource usage

---

**🎉 Your FlexTasker marketplace is now ready for production!**

For support and updates, refer to the project documentation and monitoring dashboards.
