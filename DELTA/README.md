# DELTA - Discord Bot Hosting Platform

![DELTA Logo](https://via.placeholder.com/800x200/1a1b2e/eee?text=DELTA%20-%20Discord%20Bot%20Hosting%20Platform)

DELTA is a comprehensive Discord bot hosting platform that provides a professional dashboard for deploying, managing, and monitoring Discord bots with ease. Built with modern technologies including React, Node.js, Express, and PostgreSQL.

## 🚀 Deployment Instructions

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Discord Developer Application with OAuth2 credentials

### Environment Setup

1. Configure your `.env` file with the following variables:

```
# Discord OAuth Configuration
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_CLIENT_SECRET=your_discord_client_secret
DISCORD_SERVER_INVITE=your_discord_server_invite_link
DISCORD_BOT_TOKEN=your_discord_bot_token

# Session Configuration
SESSION_SECRET=your_session_secret

# Database Configuration
DATABASE_URL="postgresql://username:password@hostname:port/database?sslmode=require"

# Server Configuration
PORT=5000
NODE_ENV=production
APP_URL=your_application_url
```

### Installation

1. Clone the repository
2. Run the automated setup script:
   ```bash
   npm run setup
   ```
   This will:
   - Create necessary directories
   - Set up the .env file from template if not present
   - Install dependencies
   - Build the application
   - Initialize the database
   - Configure HTTPS with SSL certificates if enabled

3. Start the server:
   ```bash
   npm start
   ```

### Docker Deployment (Optional)

#### Using Docker Compose (Recommended)

1. Make sure you have Docker and Docker Compose installed
2. Configure your `.env` file with the necessary environment variables
3. Run the application with Docker Compose:
   ```bash
   docker-compose up -d
   ```
4. Access the application at http://localhost:5000

#### Using Docker Directly

1. Build the Docker image:
   ```bash
   docker build -t delta-bot-hosting .
   ```
2. Run the container:
   ```bash
   docker run -p 5000:5000 --env-file .env delta-bot-hosting
   ```

## ✨ Features

### 🚀 **Bot Management**
- **Multi-Language Support**: Deploy Python (discord.py) and Node.js (discord.js) bots
- **IDE-Quality Code Editor**: Monaco Editor with syntax highlighting and IntelliSense
- **Real-time Console**: Live bot logs with WebSocket connections
- **File Management**: Upload, edit, and organize bot files
- **Auto-dependency Detection**: Automatic requirements.txt and package.json generation

### 🛡️ **Security & Monitoring**
- **RADAR System**: Advanced code analysis and abuse detection
- **Resource Monitoring**: Real-time CPU, memory, and uptime tracking
- **Security Dashboard**: Account security scoring and activity logs
- **Discord OAuth Integration**: Secure authentication via Discord

### 🎨 **Modern Interface**
- **Responsive Design**: Mobile-first UI that works on all devices  
- **Dark/Light Themes**: System-aware theme switching with smooth transitions
- **Professional Dashboard**: Clean, intuitive interface with real-time updates
- **Glassmorphism Effects**: Modern UI with backdrop filters and animations

### ⚡ **Performance**
- **WebSocket Real-time Updates**: Instant status updates and live logs
- **Process Isolation**: Each bot runs in its own secure sandbox
- **Automatic Restarts**: Health monitoring with automatic recovery
- **Resource Limits**: RADAR system prevents abuse and overuse

---

## 🏗️ Architecture

```mermaid
graph TB
    A[Client - React/TypeScript] --> B[Express.js Server]
    B --> C[Discord OAuth]
    B --> D[PostgreSQL Database]
    B --> E[Bot Manager Service]
    E --> F[Python Bot Processes]
    E --> G[Node.js Bot Processes]
    E --> H[RADAR Security System]
    B --> I[WebSocket Server]
    I --> A
    E --> I
```

---

## 🚀 Deployment Guide

### 1. Discord Application Setup

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application
3. Under the "OAuth2" tab, add a redirect URL: `https://your-domain.com/api/auth/callback` (or `http://localhost:5000/api/auth/callback` for local development)
4. Under the "Bot" tab, create a bot and copy the token
5. Enable the following Privileged Gateway Intents:
   - Server Members Intent
   - Message Content Intent

### 2. Environment Configuration

1. Copy the `.env.template` file to `.env`
2. Fill in the required environment variables:
   ```
   DATABASE_URL="postgresql://user:password@hostname:port/database"
   DISCORD_CLIENT_ID="your_discord_client_id"
   DISCORD_CLIENT_SECRET="your_discord_client_secret"
   DISCORD_BOT_TOKEN="your_discord_bot_token"
   SESSION_SECRET="generate_a_strong_random_string"
   ```
3. Adjust other optional settings as needed

### 3. Database Setup

#### Option A: Local PostgreSQL

```bash
# Create a new database
psql -c "CREATE DATABASE delta_cursor;"

# The schema will be automatically created on first run
```

#### Option B: Neon.tech (Cloud PostgreSQL)

1. Create an account at [Neon.tech](https://neon.tech)
2. Create a new project and database
3. Copy the connection string to your `.env` file

### 4. Installation and Setup

```bash
# Clone the repository
git clone https://github.com/your-username/DELTA-CURSOR.git
cd DELTA-CURSOR/DELTA

# Install dependencies
npm install

# Build the application
npm run build

# Start the server
npm start
```

### 5. Production Deployment

For production deployment, we recommend using a process manager like PM2:

```bash
# Install PM2 globally
npm install -g pm2

# Start the application with PM2
pm2 start npm -- start

# Save the PM2 configuration
pm2 save

# Set up PM2 to start on system boot
pm2 startup
```

### 6. Docker Deployment (Optional)

If you want to use Docker for the main application:

```bash
# Build the Docker image
docker build -t delta-cursor .

# Run the container
docker run -d -p 5000:5000 --env-file .env --name delta-cursor delta-cursor
```

## Bot Isolation

For secure bot isolation, the platform can use Docker to run each bot in its own container. To enable this:

1. Ensure Docker is installed on your server
2. Set `ENABLE_BOT_ISOLATION=true` in your `.env` file
3. Create a Docker network: `docker network create delta-network`

## Troubleshooting

- **Database Connection Issues**: Verify your DATABASE_URL is correct and the database server is accessible
- **Discord Authentication Errors**: Check your DISCORD_CLIENT_ID, DISCORD_CLIENT_SECRET, and redirect URLs
- **Bot Startup Failures**: Check the logs for specific error messages and ensure dependencies are correctly installed

---

## 🚀 Quick Start (Development)

### Prerequisites
- **Node.js** 18+ and npm
- **Python** 3.8+ with pip
- **PostgreSQL** 13+
- **Discord Application** (for OAuth)

### 1. Clone & Setup
```bash
git clone <repository-url>
cd DELTA
npm install
```

### 2. Environment Configuration
Create a `.env` file in the root directory:
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/delta"

# Discord OAuth
DISCORD_CLIENT_ID="your_discord_client_id"
DISCORD_CLIENT_SECRET="your_discord_client_secret"

# Application
APP_URL="http://localhost:5173"
SESSION_SECRET="your-super-secure-session-secret-here"
NODE_ENV="development"

# Bot Configuration
MAX_BOTS_PER_USER="3"
```

### 3. Database Setup
```bash
npm run db:push
```

### 4. Start Development
```bash
# Terminal 1 - Backend
npm run dev:server

# Terminal 2 - Frontend
npm run dev:client
```

Visit `http://localhost:5173` and you're ready to go!

---

# 🌐 Production Deployment Guide

This comprehensive guide covers deploying DELTA on various VPS providers and server configurations.

## 📋 Server Requirements

### Minimum Requirements
- **CPU**: 2 vCPUs
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04+ / CentOS 8+ / Debian 10+
- **Network**: 100Mbps connection

### Recommended Requirements
- **CPU**: 4 vCPUs
- **RAM**: 8GB
- **Storage**: 50GB SSD
- **OS**: Ubuntu 22.04 LTS
- **Network**: 1Gbps connection

---

## 🔧 Server Setup (Ubuntu 22.04)

### 1. Initial Server Preparation

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Install essential packages
sudo apt install -y curl wget git build-essential software-properties-common

# Create application user
sudo adduser --disabled-password --gecos "" delta
sudo usermod -aG sudo delta
su - delta
```

### 2. Install Node.js 20

```bash
# Install Node.js via NodeSource
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Verify installation
node --version  # Should output v20.x.x
npm --version   # Should output 10.x.x
```

### 3. Install Python 3.11

```bash
# Install Python and pip
sudo apt install -y python3 python3-pip python3-venv python3-dev

# Install discord.py globally for better compatibility
pip3 install --user discord.py>=2.3.0

# Verify installation
python3 --version  # Should output Python 3.x.x
pip3 --version     # Should output pip 22.x.x
```

### 4. Install PostgreSQL

```bash
# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database and user
sudo -u postgres psql << EOF
CREATE DATABASE delta;
CREATE USER deltauser WITH PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE delta TO deltauser;
ALTER USER deltauser CREATEDB;
\\q
EOF
```

### 5. Install Redis (Optional - for session storage)

```bash
sudo apt install -y redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### 6. Install Nginx

```bash
sudo apt install -y nginx
sudo systemctl start nginx
sudo systemctl enable nginx

# Allow HTTP/HTTPS through firewall
sudo ufw allow 'Nginx Full'
sudo ufw allow ssh
sudo ufw --force enable
```

---

## 📁 Application Deployment

### 1. Clone Repository

```bash
cd /home/delta
git clone <your-repository-url> delta-app
cd delta-app
chown -R delta:delta /home/delta/delta-app
```

### 2. Install Dependencies

```bash
# Install Node.js dependencies
npm install --production

# Install additional Python dependencies globally
pip3 install --user aiohttp requests python-dotenv asyncio
```

### 3. Environment Configuration

Create production environment file:

```bash
nano .env
```

```env
# Production Environment Configuration

# Database Configuration
DATABASE_URL="postgresql://deltauser:your_secure_password_here@localhost:5432/delta"

# Discord OAuth (Get from Discord Developer Portal)
DISCORD_CLIENT_ID="your_production_discord_client_id"
DISCORD_CLIENT_SECRET="your_production_discord_client_secret"

# Application Settings
APP_URL="https://yourdomain.com"
APP_NAME="DELTA Production"
NODE_ENV="production"
PORT="3000"

# Security
SESSION_SECRET="your-ultra-secure-session-secret-min-32-chars"
SECURE_COOKIES="true"

# Bot Configuration
MAX_BOTS_PER_USER="5"
BOT_TIMEOUT_MS="300000"

# Resource Limits
MAX_MEMORY_MB="512"
MAX_CPU_PERCENT="80"

# Redis (if using)
REDIS_URL="redis://localhost:6379"

# Email Configuration (optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-app-password"
SMTP_FROM="DELTA <noreply@yourdomain.com>"
```

### 4. Database Migration

```bash
npm run db:push
```

### 5. Build Application

```bash
npm run build
```

---

## 🌐 Nginx Configuration

### 1. Create Nginx Configuration

```bash
sudo nano /etc/nginx/sites-available/delta
```

```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    # Redirect HTTP to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com www.yourdomain.com;

    # SSL Configuration (Let's Encrypt certificates)
    ssl_certificate /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;
    
    # SSL Security Headers
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: ws: wss: data: blob: 'unsafe-inline' 'unsafe-eval'" always;

    # Gzip Compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private auth;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=auth:10m rate=5r/m;

    # Root directory for static files
    root /home/delta/delta-app/dist/public;
    index index.html;

    # Handle static files
    location / {
        try_files $uri $uri/ @proxy;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # API routes
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Authentication routes (stricter rate limiting)
    location /api/auth/ {
        limit_req zone=auth burst=5 nodelay;
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Fallback to Node.js app
    location @proxy {
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

    # Logging
    access_log /var/log/nginx/delta_access.log;
    error_log /var/log/nginx/delta_error.log;
}
```

### 2. Enable Site

```bash
sudo ln -s /etc/nginx/sites-available/delta /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔒 SSL Certificate (Let's Encrypt)

### 1. Install Certbot

```bash
sudo apt install -y certbot python3-certbot-nginx
```

### 2. Obtain SSL Certificate

```bash
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
```

### 3. Auto-renewal Setup

```bash
sudo crontab -e
```

Add this line:
```bash
0 12 * * * /usr/bin/certbot renew --quiet
```

---

## 🔄 Process Management (PM2)

### 1. Install PM2

```bash
sudo npm install -g pm2
```

### 2. Create PM2 Configuration

```bash
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'delta-production',
    script: './dist/index.js',
    instances: 2, // or 'max' for all CPU cores
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    // Logging
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    
    // Auto-restart configuration
    watch: false,
    ignore_watch: ['node_modules', 'bot_workspace', 'bot_logs'],
    max_memory_restart: '1G',
    
    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,
    
    // Auto-restart on crashes
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s'
  }]
};
```

### 3. Start Application

```bash
# Create logs directory
mkdir -p /home/delta/delta-app/logs

# Start with PM2
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u delta --hp /home/delta
```

### 4. PM2 Commands

```bash
# View application status
pm2 status

# View logs
pm2 logs delta-production

# Restart application
pm2 restart delta-production

# Stop application
pm2 stop delta-production

# Reload application (zero-downtime)
pm2 reload delta-production

# Monitor resource usage
pm2 monit
```

---

## 📊 Monitoring & Maintenance

### 1. System Monitoring

```bash
# Install system monitoring tools
sudo apt install -y htop iotop nethogs fail2ban

# Configure fail2ban for additional security
sudo nano /etc/fail2ban/jail.local
```

```ini
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true

[nginx-http-auth]
enabled = true

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
action = iptables-multiport[name=ReqLimit, port="http,https", protocol=tcp]
logpath = /var/log/nginx/error.log
maxretry = 10
findtime = 600
bantime = 7200
```

### 2. Log Rotation

```bash
sudo nano /etc/logrotate.d/delta
```

```bash
/home/delta/delta-app/logs/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 delta delta
    postrotate
        pm2 reloadLogs
    endscript
}

/var/log/nginx/delta*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 www-data www-data
    prerotate
        if [ -d /etc/logrotate.d/httpd-prerotate ]; then \
            run-parts /etc/logrotate.d/httpd-prerotate; \
        fi \
    endscript
    postrotate
        invoke-rc.d nginx rotate >/dev/null 2>&1
    endscript
}
```

### 3. Automated Backups

```bash
nano ~/backup-delta.sh
```

```bash
#!/bin/bash

# Configuration
BACKUP_DIR="/home/delta/backups"
DB_NAME="delta"
DB_USER="deltauser"
DB_PASSWORD="your_secure_password_here"
APP_DIR="/home/delta/delta-app"
DATE=$(date +%Y%m%d_%H%M%S)

# Create backup directory
mkdir -p $BACKUP_DIR

# Database backup
echo "Creating database backup..."
PGPASSWORD=$DB_PASSWORD pg_dump -h localhost -U $DB_USER $DB_NAME > $BACKUP_DIR/database_$DATE.sql

# Application files backup
echo "Creating application backup..."
tar -czf $BACKUP_DIR/app_$DATE.tar.gz -C $APP_DIR .

# Keep only last 7 days of backups
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

```bash
chmod +x ~/backup-delta.sh

# Schedule daily backups
crontab -e
```

Add:
```bash
0 2 * * * /home/delta/backup-delta.sh >> /home/delta/backup.log 2>&1
```

---

## 🔧 Environment-Specific Configurations

### Development Environment

```env
NODE_ENV=development
APP_URL=http://localhost:5173
DATABASE_URL=postgresql://postgres:password@localhost:5432/delta_dev
SESSION_SECRET=dev-secret-key
MAX_BOTS_PER_USER=3
```

### Staging Environment

```env
NODE_ENV=staging
APP_URL=https://staging.yourdomain.com
DATABASE_URL=postgresql://deltauser:password@localhost:5432/delta_staging
SESSION_SECRET=staging-secret-key-32-characters-minimum
MAX_BOTS_PER_USER=2
```

### Production Environment

```env
NODE_ENV=production
APP_URL=https://yourdomain.com
DATABASE_URL=postgresql://deltauser:secure_password@localhost:5432/delta
SESSION_SECRET=super-secure-production-secret-key-64-characters-minimum-length
MAX_BOTS_PER_USER=5
SECURE_COOKIES=true
```

---

## 🛡️ Security Hardening

### 1. Firewall Configuration

```bash
# Reset UFW rules
sudo ufw --force reset

# Default policies
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Allow SSH (change port if using custom)
sudo ufw allow ssh

# Allow HTTP/HTTPS
sudo ufw allow 'Nginx Full'

# Allow specific IP for admin access (optional)
# sudo ufw allow from YOUR_IP_ADDRESS to any port ssh

# Enable firewall
sudo ufw --force enable

# Check status
sudo ufw status verbose
```

### 2. SSH Hardening

```bash
sudo nano /etc/ssh/sshd_config
```

Key settings to modify:
```bash
# Change default port
Port 2222

# Disable root login
PermitRootLogin no

# Key-based authentication only
PubkeyAuthentication yes
PasswordAuthentication no

# Limit users
AllowUsers delta

# Connection limits
MaxAuthTries 3
MaxSessions 2

# Disable unused features
X11Forwarding no
AllowAgentForwarding no
AllowTcpForwarding no
```

```bash
sudo systemctl restart sshd
```

### 3. System Security Updates

```bash
# Enable automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure unattended-upgrades

# Configure automatic updates
sudo nano /etc/apt/apt.conf.d/20auto-upgrades
```

```bash
APT::Periodic::Update-Package-Lists "1";
APT::Periodic::Download-Upgradeable-Packages "1";
APT::Periodic::AutocleanInterval "7";
APT::Periodic::Unattended-Upgrade "1";
```

---

## 📈 Performance Optimization

### 1. Node.js Performance

```bash
# Add to ecosystem.config.js
env: {
  NODE_ENV: 'production',
  NODE_OPTIONS: '--max-old-space-size=2048',
  UV_THREADPOOL_SIZE: 128
}
```

### 2. PostgreSQL Optimization

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

Key settings for a 4GB RAM server:
```bash
# Memory settings
shared_buffers = 1GB
effective_cache_size = 3GB
maintenance_work_mem = 256MB
work_mem = 16MB

# Connection settings
max_connections = 200

# Checkpoint settings
checkpoint_completion_target = 0.9
wal_buffers = 16MB

# Query planning
random_page_cost = 1.1
effective_io_concurrency = 200
```

```bash
sudo systemctl restart postgresql
```

### 3. Nginx Performance

```bash
sudo nano /etc/nginx/nginx.conf
```

Key optimizations:
```nginx
worker_processes auto;
worker_connections 2048;

# Enable keepalive
keepalive_timeout 30;
keepalive_requests 100;

# Buffer sizes
client_body_buffer_size 128k;
client_max_body_size 10m;
client_header_buffer_size 1k;
large_client_header_buffers 4 4k;
output_buffers 1 32k;
postpone_output 1460;
```

---

## 🚨 Troubleshooting Guide

### Common Issues & Solutions

#### 1. Bot Startup Failures

**Problem**: Bots fail to start with dependency errors

**Solution**:
```bash
# Check system diagnostics
curl -H "Authorization: Bearer YOUR_TOKEN" https://yourdomain.com/api/system/diagnostics

# Manually install Python dependencies
cd /home/delta/delta-app
python3 -m pip install --user discord.py aiohttp requests

# Check Node.js dependencies
npm list --depth=0
```

#### 2. Database Connection Issues

**Problem**: Application can't connect to PostgreSQL

**Solution**:
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U deltauser -d delta

# Reset database password
sudo -u postgres psql
\password deltauser

# Update DATABASE_URL in .env file
```

#### 3. High Memory Usage

**Problem**: Application consuming too much memory

**Solution**:
```bash
# Check memory usage
pm2 monit

# Restart application
pm2 restart delta-production

# Adjust PM2 memory limits
pm2 stop delta-production
# Edit ecosystem.config.js
max_memory_restart: '512M'
pm2 start ecosystem.config.js --env production
```

#### 4. SSL Certificate Issues

**Problem**: HTTPS not working or certificate expired

**Solution**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate manually
sudo certbot renew --force-renewal

# Test nginx configuration
sudo nginx -t
sudo systemctl restart nginx
```

#### 5. WebSocket Connection Failures

**Problem**: Real-time features not working

**Solution**:
```bash
# Check if WebSocket port is open
sudo netstat -tlnp | grep :3000

# Test WebSocket connection
wscat -c ws://localhost:3000/ws

# Check nginx WebSocket configuration
sudo nginx -T | grep -A 10 "location /ws"
```

### Performance Monitoring

```bash
# System resources
htop
iotop -o
df -h

# Application logs
pm2 logs delta-production --lines 100

# Database performance
sudo -u postgres psql -d delta -c "SELECT * FROM pg_stat_activity;"

# Nginx access logs
sudo tail -f /var/log/nginx/delta_access.log
```

### Log Locations

- **Application Logs**: `/home/delta/delta-app/logs/`
- **PM2 Logs**: `~/.pm2/logs/`
- **Nginx Logs**: `/var/log/nginx/`
- **PostgreSQL Logs**: `/var/log/postgresql/`
- **System Logs**: `/var/log/syslog`

---

## 🔄 Updates & Maintenance

### Application Updates

```bash
# Navigate to application directory
cd /home/delta/delta-app

# Create backup before update
~/backup-delta.sh

# Pull latest changes
git pull origin main

# Install new dependencies
npm install --production

# Run database migrations if needed
npm run db:push

# Rebuild application
npm run build

# Restart with zero downtime
pm2 reload delta-production

# Verify deployment
curl -I https://yourdomain.com/api/health
```

### System Updates

```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js (if needed)
sudo npm cache clean -f
sudo npm install -g n
sudo n stable

# Update PM2
sudo npm update -g pm2
pm2 update

# Restart services if needed
sudo systemctl restart nginx
sudo systemctl restart postgresql
```

---

## 📞 Support & Contributing

### Getting Help

1. **Check Logs**: Always check application and system logs first
2. **System Diagnostics**: Use the `/api/system/diagnostics` endpoint
3. **Community**: Join our Discord server for community support
4. **Documentation**: Check this README and inline code comments

### Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Submit a Pull Request

### Development Setup

```bash
# Clone repository
git clone <repository-url>
cd DELTA

# Install dependencies
npm install

# Set up development environment
cp .env.example .env
# Edit .env with your configuration

# Start development servers
npm run dev:server  # Backend
npm run dev:client  # Frontend
```

---

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **Discord.js & Discord.py**: For excellent Discord bot libraries
- **React & Node.js Communities**: For amazing ecosystem and tools
- **PostgreSQL Team**: For robust database technology
- **Nginx Team**: For high-performance web server
- **Contributors**: All developers who contributed to this project

---

**Made with ❤️ for the Discord bot hosting community**

![Footer](https://via.placeholder.com/800x100/2d3748/eee?text=Happy%20Bot%20Hosting%20with%20DELTA!)