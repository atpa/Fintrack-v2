# FinTrackr Deployment Guide

## Prerequisites

- Node.js 14.0.0 or higher
- npm 6.0.0 or higher
- Git (for version control)

## Environment Variables

Create a `.env` file in the project root with the following variables:

```env
# Server Configuration
PORT=3000
NODE_ENV=production

# JWT Configuration (REQUIRED - Generate a strong secret!)
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production

# Cookie Configuration
COOKIE_SECURE=true

# Database Configuration
DATABASE_PATH=./backend/fintrackr.db

# Optional: Email Service (if using email features)
EMAIL_SERVICE=smtp
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
EMAIL_FROM=noreply@fintrackr.com

# Optional: External API Keys
CURRENCY_API_KEY=your-api-key-here
```

### Generating a Secure JWT_SECRET

```bash
# Using Node.js
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Using OpenSSL
openssl rand -hex 64
```

## Local Development

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/fintrackr.git
cd fintrackr
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Initialize Database

```bash
npm run db:init
```

### 4. Seed Demo Data (Optional)

```bash
npm run db:seed
```

This creates a demo account:
- Email: demo@fintrackr.com
- Password: demo123

### 5. Start Development Server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

## Production Deployment

### Option 1: Deploy to Render

Render is a modern cloud platform that makes deployment simple.

#### Steps:

1. **Create a Render Account**
   - Sign up at [render.com](https://render.com)

2. **Create a New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Configure:
     - Name: `fintrackr`
     - Environment: `Node`
     - Build Command: `npm install && npm run db:init`
     - Start Command: `npm start`
     - Plan: Free (or paid for production)

3. **Set Environment Variables**
   - Add all variables from `.env` file
   - **IMPORTANT:** Generate a strong `JWT_SECRET`
   - Set `NODE_ENV=production`
   - Set `COOKIE_SECURE=true`

4. **Add Persistent Disk (Important!)**
   - Add a disk mount for SQLite database
   - Mount path: `/opt/render/project/src/backend`
   - Size: 1 GB (or as needed)

5. **Deploy**
   - Render will automatically deploy on push to main branch

#### Render Configuration File

Create `render.yaml` in project root:

```yaml
services:
  - type: web
    name: fintrackr
    env: node
    buildCommand: npm install && npm run db:init
    startCommand: npm start
    envVars:
      - key: NODE_ENV
        value: production
      - key: JWT_SECRET
        generateValue: true
      - key: COOKIE_SECURE
        value: true
    disk:
      name: fintrackr-db
      mountPath: /opt/render/project/src/backend
      sizeGB: 1
```

---

### Option 2: Deploy to Heroku

#### Steps:

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create Heroku App**
   ```bash
   heroku create fintrackr-app
   ```

3. **Set Environment Variables**
   ```bash
   heroku config:set NODE_ENV=production
   heroku config:set JWT_SECRET=$(openssl rand -hex 64)
   heroku config:set COOKIE_SECURE=true
   ```

4. **Create Procfile**
   ```
   web: npm start
   release: npm run db:init
   ```

5. **Deploy**
   ```bash
   git push heroku main
   ```

6. **Seed Demo Data** (Optional)
   ```bash
   heroku run npm run db:seed
   ```

#### Database Persistence on Heroku

**Note:** Heroku's ephemeral filesystem means SQLite data is lost on dyno restart. For production on Heroku, consider:

1. **Use PostgreSQL addon:**
   ```bash
   heroku addons:create heroku-postgresql:mini
   ```
   Then adapt code to use PostgreSQL instead of SQLite.

2. **Use external storage** (S3, etc.) to persist SQLite file.

---

### Option 3: Deploy to VPS (Ubuntu/Debian)

For full control, deploy to your own Virtual Private Server.

#### Prerequisites on VPS:
- Ubuntu 20.04+ or Debian 10+
- Root or sudo access

#### Steps:

1. **Update System**
   ```bash
   sudo apt update && sudo apt upgrade -y
   ```

2. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   node --version
   npm --version
   ```

3. **Install Git**
   ```bash
   sudo apt install git -y
   ```

4. **Create App User**
   ```bash
   sudo useradd -m -s /bin/bash fintrackr
   sudo su - fintrackr
   ```

5. **Clone Repository**
   ```bash
   cd ~
   git clone https://github.com/your-username/fintrackr.git
   cd fintrackr
   ```

6. **Install Dependencies**
   ```bash
   npm install --production
   ```

7. **Create .env File**
   ```bash
   nano .env
   # Add all production environment variables
   ```

8. **Initialize Database**
   ```bash
   npm run db:init
   npm run db:seed  # Optional
   ```

9. **Install PM2** (Process Manager)
   ```bash
   sudo npm install -g pm2
   ```

10. **Start Application with PM2**
    ```bash
    pm2 start npm --name "fintrackr" -- start
    pm2 save
    pm2 startup
    ```

11. **Configure Nginx as Reverse Proxy**
    ```bash
    sudo apt install nginx -y
    sudo nano /etc/nginx/sites-available/fintrackr
    ```
    
    Add configuration:
    ```nginx
    server {
        listen 80;
        server_name your-domain.com;
        
        location / {
            proxy_pass http://localhost:3000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }
    }
    ```
    
    Enable site:
    ```bash
    sudo ln -s /etc/nginx/sites-available/fintrackr /etc/nginx/sites-enabled/
    sudo nginx -t
    sudo systemctl restart nginx
    ```

12. **Setup SSL with Let's Encrypt**
    ```bash
    sudo apt install certbot python3-certbot-nginx -y
    sudo certbot --nginx -d your-domain.com
    ```

13. **Configure Firewall**
    ```bash
    sudo ufw allow 'Nginx Full'
    sudo ufw allow OpenSSH
    sudo ufw enable
    ```

#### PM2 Commands

```bash
# View logs
pm2 logs fintrackr

# Restart app
pm2 restart fintrackr

# Stop app
pm2 stop fintrackr

# View status
pm2 status

# Monitor
pm2 monit
```

---

### Option 4: Docker Deployment

#### Dockerfile

Create `Dockerfile` in project root:

```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application
COPY . .

# Initialize database
RUN npm run db:init

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

#### docker-compose.yml

```yaml
version: '3.8'

services:
  fintrackr:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - JWT_SECRET=${JWT_SECRET}
      - COOKIE_SECURE=true
    volumes:
      - ./backend/fintrackr.db:/app/backend/fintrackr.db
    restart: unless-stopped
```

#### Deploy with Docker

```bash
# Build image
docker build -t fintrackr .

# Run container
docker run -d \
  -p 3000:3000 \
  -e NODE_ENV=production \
  -e JWT_SECRET=your-secret-here \
  -e COOKIE_SECURE=true \
  -v $(pwd)/backend/fintrackr.db:/app/backend/fintrackr.db \
  --name fintrackr \
  fintrackr

# Or use docker-compose
docker-compose up -d
```

---

## Post-Deployment Checklist

- [ ] JWT_SECRET is set and secure (not the default)
- [ ] NODE_ENV is set to `production`
- [ ] COOKIE_SECURE is set to `true`
- [ ] Database is initialized
- [ ] Application is accessible via HTTPS
- [ ] Logs are being captured
- [ ] Backups are configured
- [ ] Monitoring is setup
- [ ] Domain is configured correctly
- [ ] SSL certificate is valid
- [ ] Firewall rules are configured
- [ ] Error pages work (404, 500)

## Monitoring and Maintenance

### Health Check Endpoint

The application doesn't have a built-in health check yet. Consider adding:

```javascript
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
```

### Database Backups

#### Automated Backup Script

Create `scripts/backup-db.sh`:

```bash
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
DB_FILE="./backend/fintrackr.db"

mkdir -p $BACKUP_DIR
cp $DB_FILE "$BACKUP_DIR/fintrackr_$DATE.db"

# Keep only last 7 days of backups
find $BACKUP_DIR -name "fintrackr_*.db" -mtime +7 -delete

echo "Backup completed: fintrackr_$DATE.db"
```

#### Schedule with Cron

```bash
# Edit crontab
crontab -e

# Add daily backup at 2 AM
0 2 * * * /path/to/fintrackr/scripts/backup-db.sh >> /path/to/fintrackr/logs/backup.log 2>&1
```

### Log Management

```bash
# View application logs
pm2 logs fintrackr

# View last 100 lines
pm2 logs fintrackr --lines 100

# Clear logs
pm2 flush
```

### Performance Monitoring

Consider integrating:
- **New Relic** - APM monitoring
- **Datadog** - Infrastructure monitoring
- **Sentry** - Error tracking
- **PM2 Plus** - PM2 monitoring (if using PM2)

## Scaling Considerations

### Horizontal Scaling

For high traffic, consider:

1. **Load Balancer** - Nginx or cloud load balancer
2. **Multiple Instances** - Run multiple Node.js processes
3. **Session Management** - Use Redis for shared sessions
4. **Database** - Migrate to PostgreSQL for better concurrency

### Vertical Scaling

- Increase server resources (CPU, RAM)
- Optimize database queries
- Enable caching
- Use CDN for static assets

## Troubleshooting

### Application Won't Start

```bash
# Check Node.js version
node --version  # Should be >= 14.0.0

# Check for port conflicts
lsof -i :3000

# Check logs
pm2 logs fintrackr
# or
node backend/server.js
```

### Database Issues

```bash
# Reinitialize database
npm run db:init

# Check database file permissions
ls -l backend/fintrackr.db
chmod 644 backend/fintrackr.db
```

### JWT Errors

- Verify JWT_SECRET is set
- Check token expiration
- Clear browser cookies
- Regenerate tokens

### CORS Errors

- Check allowed origins in server configuration
- Verify HTTPS is properly configured
- Check proxy settings if behind reverse proxy

## Security Best Practices

1. **Never commit secrets** to version control
2. **Use environment variables** for all sensitive data
3. **Keep dependencies updated** - Run `npm audit` regularly
4. **Enable HTTPS** in production
5. **Use strong JWT_SECRET** - At least 64 random bytes
6. **Implement rate limiting** for API endpoints
7. **Sanitize user inputs** to prevent XSS and SQL injection
8. **Regular backups** of database
9. **Monitor logs** for suspicious activity
10. **Keep Node.js updated** to latest LTS version

## Updating the Application

### Pull Latest Changes

```bash
cd /path/to/fintrackr
git pull origin main
npm install
npm run db:init  # If schema changed
pm2 restart fintrackr
```

### Rolling Back

```bash
git log --oneline  # Find commit to rollback to
git checkout <commit-hash>
npm install
pm2 restart fintrackr
```

## Support and Resources

- **GitHub Issues:** Report bugs and request features
- **Documentation:** See `/docs` directory
- **API Documentation:** See `/docs/API.md`
- **Database Schema:** See `/docs/DATABASE.md`

## License

MIT License - See LICENSE file for details
