# Deployment Guide

This guide covers how to deploy the Currency Exchange API to various platforms.

## Local Development

### Prerequisites
- Node.js 18+
- PostgreSQL 12+

### Setup
```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Edit .env with your database credentials

# Build TypeScript
npm run build

# Run the server
npm start
```

The API will be running at `http://localhost:3000`

## Docker Deployment

### Using Docker Compose
```bash
docker-compose up --build
```

This will start both the PostgreSQL database and the Node.js application.

### Using Docker Image
```bash
docker build -t currency-api .
docker run -p 3000:3000 -e DB_HOST=postgres currency-api
```

## Cloud Deployment Options

### Option 1: Render.com (Recommended - Free Tier Available)

1. **Push to GitHub**
   ```bash
   git remote add origin https://github.com/yourusername/currency-exchange-api.git
   git branch -M main
   git push -u origin main
   ```

2. **Create Render Account**
   - Go to https://render.com
   - Sign up with GitHub

3. **Create New Web Service**
   - Click "New +"
   - Select "Web Service"
   - Connect GitHub repository
   - Select the currency-exchange-api repo

4. **Configure Service**
   - Name: `currency-exchange-api`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Plan: Free (or Starter)

5. **Add Environment Variables**
   In the Environment section, add:
   - `NODE_ENV`: production
   - `PORT`: 3000

6. **Create PostgreSQL Database**
   - Click "New +"
   - Select "PostgreSQL"
   - Name: `currency-db`
   - Database Name: `currency_db`
   - User: `postgres`

7. **Link Database**
   - In web service settings, add database connection
   - Render will automatically set DB_* environment variables

8. **Deploy**
   - Click "Create Web Service"
   - Render will automatically deploy on push to main

Your API will be available at: `https://currency-exchange-api.onrender.com`

### Option 2: Railway.app

1. **Push to GitHub** (same as above)

2. **Create Railway Account**
   - Go to https://railway.app
   - Sign up with GitHub

3. **Create New Project**
   - Click "Create New"
   - Select "Deploy from GitHub"
   - Select repository

4. **Add PostgreSQL**
   - In the canvas, click "Add +"
   - Select "PostgreSQL"
   - Railway auto-sets database env variables

5. **Configure Node.js Service**
   - Railway auto-detects Node.js
   - Set variables:
     - `NODE_ENV`: production
     - `PORT`: 3000

6. **Deploy**
   - Railway automatically deploys on git push

Your API will be available at the assigned Railway domain.

### Option 3: Heroku (Paid only now)

1. **Install Heroku CLI**
   ```bash
   npm install -g heroku
   heroku login
   ```

2. **Create App**
   ```bash
   heroku create currency-exchange-api
   ```

3. **Add PostgreSQL**
   ```bash
   heroku addons:create heroku-postgresql:hobby-dev
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

## Environment Variables

Required for all deployments:

| Variable | Example | Required |
|----------|---------|----------|
| NODE_ENV | production | Yes |
| PORT | 3000 | Yes |
| DB_HOST | localhost | Yes |
| DB_PORT | 5432 | Yes |
| DB_NAME | currency_db | Yes |
| DB_USER | postgres | Yes |
| DB_PASSWORD | secure_password | Yes |
| LOG_LEVEL | info | No |

## Health Checks

After deployment, verify the API is running:

```bash
curl https://your-api-url/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:45.123Z"
}
```

## Testing Endpoints

```bash
# Get ARS quotes
curl https://your-api-url/quotes?currency=ARS

# Get BRL average
curl https://your-api-url/average?currency=BRL

# Get slippage data
curl https://your-api-url/slippage?currency=ARS
```

## Monitoring

### Render.com
- View logs in the Dashboard
- Monitor resource usage
- Set up alerts for failures

### Railway.app
- View logs in the canvas
- Monitor metrics
- Integration with GitHub for auto-deploy

## Troubleshooting

### Database Connection Error
- Verify DB credentials in environment variables
- Check database is running and accessible
- Ensure database user has correct permissions

### Scraper Failures
- The API gracefully degrades if some sources fail
- At least 1 source should work per currency
- Check logs for specific scraper errors

### Memory Issues
- Reduce cache TTL if needed
- Monitor database query performance
- Consider upgrading plan on cloud platforms

## Production Checklist

- [ ] Database credentials in environment variables
- [ ] NODE_ENV set to production
- [ ] Health check endpoint responds correctly
- [ ] CORS properly configured for frontend
- [ ] Database backups enabled
- [ ] Monitoring/alerting configured
- [ ] SSL/TLS certificate valid
- [ ] Rate limiting in place (if needed)
- [ ] Logs being captured
