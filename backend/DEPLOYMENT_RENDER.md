# Render Deployment Guide for ValueHunt Backend

Complete guide for deploying the ValueHunt backend to Render.com using Docker containers.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Local Docker Development](#local-docker-development)
- [Render Deployment Options](#render-deployment-options)
  - [Option 1: Blueprint Deployment (Recommended)](#option-1-blueprint-deployment-recommended)
  - [Option 2: Manual UI Deployment](#option-2-manual-ui-deployment)
- [Environment Variables Configuration](#environment-variables-configuration)
- [Monitoring & Logs](#monitoring--logs)
- [Scaling](#scaling)
- [Troubleshooting](#troubleshooting)
- [Cost Breakdown](#cost-breakdown)

---

## Overview

**Architecture:**
- **Render PostgreSQL** - Database (1GB storage, Starter plan)
- **Render Redis** - Cache & Celery broker (256MB, Starter plan)
- **3 Docker Services:**
  - `valuehunt-api` - FastAPI web service (port 8000)
  - `valuehunt-celery-worker` - Background task processor
  - `valuehunt-celery-beat` - Task scheduler (SINGLETON)

**Docker Workflow:**
```
Local Development → GitHub Push → Render Auto-Deploy
```

---

## Prerequisites

### 1. Accounts & Tools

- **Render Account**: Sign up at [render.com](https://render.com)
- **GitHub Account**: Repository connected to Render
- **Docker Desktop**: For local development
- **Git**: For version control

### 2. API Keys (Required)

- **DART API Key**: Get from [dart.fss.or.kr](https://opendart.fss.or.kr/)
- **Gemini API Key**: Get from [ai.google.dev](https://ai.google.dev/)
- **Optional**: OpenAI API Key, Anthropic API Key

---

## Local Docker Development

### Step 1: Clone Repository

```bash
cd d:/srcp/valuehunt
cd backend
```

### Step 2: Create .env File

```bash
# Copy example environment file
cp .env.example .env

# Edit .env and add your API keys
# DART_API_KEY=your_key_here
# GEMINI_API_KEY=your_key_here
```

### Step 3: Build and Run Docker Containers

```bash
# Build all images
docker-compose build

# Start all services (PostgreSQL, Redis, FastAPI, Celery Worker, Celery Beat, Flower)
docker-compose up

# Or run in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# View logs for specific service
docker-compose logs -f api
docker-compose logs -f celery_worker
docker-compose logs -f celery_beat
```

### Step 4: Verify Local Setup

#### Check Services

```bash
# Check running containers
docker-compose ps

# Should see 6 services:
# - valuehunt_db (PostgreSQL)
# - valuehunt_redis (Redis)
# - valuehunt_api (FastAPI)
# - valuehunt_celery_worker (Celery Worker)
# - valuehunt_celery_beat (Celery Beat)
# - valuehunt_flower (Flower monitoring)
```

#### Test API Endpoints

```bash
# Health check
curl http://localhost:8000/health

# API documentation
open http://localhost:8000/docs

# Flower monitoring (Celery)
open http://localhost:5555
```

#### Test Database Connection

```bash
# Access PostgreSQL container
docker-compose exec db psql -U valuehunt -d valuehunt

# Run SQL query
SELECT * FROM users LIMIT 5;

# Exit
\q
```

#### Test Redis Connection

```bash
# Access Redis container
docker-compose exec redis redis-cli

# Test Redis
ping  # Should return PONG
keys *
exit
```

### Step 5: Run Database Migrations

```bash
# Run migrations inside API container
docker-compose exec api alembic upgrade head

# Or if not running
docker-compose run api alembic upgrade head
```

### Step 6: Stop Services

```bash
# Stop all services
docker-compose down

# Stop and remove volumes (WARNING: deletes all data)
docker-compose down -v
```

---

## Render Deployment Options

### Option 1: Blueprint Deployment (Recommended)

**Easiest method using Infrastructure as Code**

#### Step 1: Prepare Repository

Ensure these files are in your repository:
- `backend/Dockerfile` ✅
- `backend/render.yaml` ✅ (just created)
- `backend/.dockerignore` ✅

#### Step 2: Connect GitHub to Render

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New +" → "Blueprint"
3. Connect your GitHub account (if not already connected)
4. Select repository: `valuehunt`
5. Render will detect `render.yaml` automatically

#### Step 3: Review Blueprint Configuration

Render will show preview of services to be created:
- ✅ `valuehunt-db` (PostgreSQL)
- ✅ `valuehunt-redis` (Redis)
- ✅ `valuehunt-api` (Web Service)
- ✅ `valuehunt-celery-worker` (Background Worker)
- ✅ `valuehunt-celery-beat` (Scheduler)

#### Step 4: Set Manual Environment Variables

Before deploying, set these in Render dashboard:

**For ALL 3 services (api, worker, beat):**
1. Click on service name
2. Go to "Environment" tab
3. Add:
   - `DART_API_KEY`: Your DART API key
   - `GEMINI_API_KEY`: Your Gemini API key
   - (Optional) `OPENAI_API_KEY`
   - (Optional) `ANTHROPIC_API_KEY`

**Note:** Other variables are auto-populated by `render.yaml`

#### Step 5: Deploy Blueprint

1. Click "Apply" button
2. Render will create all services and deploy
3. Wait 5-10 minutes for initial deployment
4. Monitor build logs for each service

#### Step 6: Verify Deployment

Once all services show "Live" (green status):

```bash
# Test API health check
curl https://valuehunt-api.onrender.com/health

# Should return: {"status": "ok"}
```

Visit API documentation:
```
https://valuehunt-api.onrender.com/docs
```

---

### Option 2: Manual UI Deployment

**Step-by-step manual creation (more control)**

#### Step 1: Create PostgreSQL Database

1. Render Dashboard → "New +" → "PostgreSQL"
2. Settings:
   - **Name**: `valuehunt-db`
   - **Database**: `valuehunt`
   - **User**: `valuehunt`
   - **Region**: Oregon (or your preferred region)
   - **Plan**: Starter ($7/month) or Free (90 days)
3. Click "Create Database"
4. Wait for provisioning (~2-3 minutes)
5. **Copy Internal Database URL** (starts with `postgresql://`)

#### Step 2: Create Redis Instance

1. Render Dashboard → "New +" → "Redis"
2. Settings:
   - **Name**: `valuehunt-redis`
   - **Region**: Oregon (same as database)
   - **Plan**: Starter ($10/month)
   - **Max Memory Policy**: allkeys-lru
3. Click "Create Redis"
4. **Copy Internal Redis URL** (starts with `redis://`)

#### Step 3: Create FastAPI Web Service

1. Render Dashboard → "New +" → "Web Service"
2. Connect GitHub repository: `valuehunt`
3. Settings:
   - **Name**: `valuehunt-api`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Build Context Directory**: `.`
   - **Plan**: Starter ($7/month) or Free (for testing)
   - **Health Check Path**: `/health`
   - **Auto-Deploy**: Yes

4. **Environment Variables**:
   ```env
   DATABASE_URL=<paste-internal-database-url>
   REDIS_URL=<paste-internal-redis-url>
   CELERY_BROKER_URL=<redis-url>/1
   CELERY_RESULT_BACKEND=<redis-url>/2
   ENVIRONMENT=production
   DEBUG=false
   PYTHON_VERSION=3.11
   SECRET_KEY=<generate-32-char-random-string>
   DART_API_KEY=<your-dart-api-key>
   GEMINI_API_KEY=<your-gemini-api-key>
   ```

5. Click "Create Web Service"

#### Step 4: Create Celery Worker

1. Render Dashboard → "New +" → "Background Worker"
2. Connect same GitHub repository
3. Settings:
   - **Name**: `valuehunt-celery-worker`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Command**: `celery -A app.celery_app worker --loglevel=info --concurrency=2`
   - **Plan**: Starter ($7/month)
   - **Auto-Deploy**: Yes

4. **Environment Variables**: (same as API service above)

5. Click "Create Background Worker"

#### Step 5: Create Celery Beat Scheduler

1. Render Dashboard → "New +" → "Background Worker"
2. Connect same GitHub repository
3. Settings:
   - **Name**: `valuehunt-celery-beat`
   - **Region**: Oregon
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: Docker
   - **Dockerfile Path**: `./Dockerfile`
   - **Docker Command**: `celery -A app.celery_app beat --loglevel=info --scheduler django_celery_beat.schedulers:DatabaseScheduler`
   - **Plan**: Starter ($7/month)
   - **Instances**: 1 (CRITICAL: Only ONE instance)
   - **Auto-Deploy**: Yes

4. **Environment Variables**: (same as API service above)

5. Click "Create Background Worker"

#### Step 6: Run Database Migrations

Once API service is deployed:

```bash
# Using Render Shell (recommended)
# Go to valuehunt-api service → Shell tab
alembic upgrade head

# Or using Render CLI
render run valuehunt-api alembic upgrade head
```

---

## Environment Variables Configuration

### Auto-Populated Variables (from render.yaml)

These are automatically set if using Blueprint deployment:

| Variable | Source | Description |
|----------|--------|-------------|
| `DATABASE_URL` | Render PostgreSQL | Connection string |
| `REDIS_URL` | Render Redis | Connection string |
| `CELERY_BROKER_URL` | Derived from REDIS_URL | Redis DB 1 |
| `CELERY_RESULT_BACKEND` | Derived from REDIS_URL | Redis DB 2 |
| `ENVIRONMENT` | render.yaml | `production` |
| `DEBUG` | render.yaml | `false` |
| `PYTHON_VERSION` | render.yaml | `3.11` |
| `SECRET_KEY` | Auto-generated | 32+ char string |

### Manual Variables (YOU MUST SET)

Set these in Render Dashboard → Service → Environment:

| Variable | Required | Description |
|----------|----------|-------------|
| `DART_API_KEY` | **YES** | Korean financial data API |
| `GEMINI_API_KEY` | **YES** | Primary AI service (Google) |
| `OPENAI_API_KEY` | No | Alternative AI service |
| `ANTHROPIC_API_KEY` | No | Alternative AI service |
| `SENDGRID_API_KEY` | No | Email notifications |

### How to Update Environment Variables

1. Go to Render Dashboard
2. Select service (e.g., `valuehunt-api`)
3. Click "Environment" tab
4. Click "Add Environment Variable"
5. Enter key and value
6. Click "Save Changes"
7. Render will automatically redeploy

---

## Monitoring & Logs

### View Logs

#### Render Dashboard

1. Go to service (e.g., `valuehunt-api`)
2. Click "Logs" tab
3. View real-time logs
4. Filter by log level (info, error, etc.)

#### Render CLI

```bash
# Install Render CLI
npm install -g render-cli

# Login
render login

# View logs
render logs valuehunt-api
render logs valuehunt-celery-worker
render logs valuehunt-celery-beat

# Follow logs (tail -f)
render logs valuehunt-api --follow
```

### Monitor Metrics

Render Dashboard shows:
- **CPU Usage** - Real-time CPU percentage
- **Memory Usage** - RAM consumption
- **Response Time** - API latency (p50, p95, p99)
- **Request Rate** - Requests per second
- **Error Rate** - 4xx and 5xx errors

### Health Checks

Configure in Render Dashboard → Service → Settings:

- **Health Check Path**: `/health`
- **Interval**: 30 seconds
- **Timeout**: 10 seconds
- **Unhealthy Threshold**: 3 failures

### External Monitoring (Optional)

Set up **UptimeRobot** (free tier):

1. Go to [uptimerobot.com](https://uptimerobot.com)
2. Add new monitor:
   - **Type**: HTTP(s)
   - **URL**: `https://valuehunt-api.onrender.com/health`
   - **Interval**: 5 minutes
3. Configure email alerts

---

## Scaling

### Horizontal Scaling (Add More Instances)

#### API Service (Web)

Render Dashboard → `valuehunt-api` → Settings:

- Change **Instance Count**: 1 → 2 or 3
- Each instance: $7/month (Starter plan)
- Load balancing automatic

#### Celery Worker

Render Dashboard → `valuehunt-celery-worker` → Settings:

- Change **Instance Count**: 1 → 2, 3, or 5
- Each instance: $7/month
- Tasks distributed automatically

#### Celery Beat (DO NOT SCALE)

**CRITICAL**: Keep **Instance Count = 1** always

Scaling Celery Beat causes duplicate scheduled tasks!

### Vertical Scaling (Increase Resources)

Change **Instance Type**:

| Plan | RAM | CPU | Price |
|------|-----|-----|-------|
| Free | 512MB | 0.1 CPU | $0/month |
| Starter | 512MB | 0.5 CPU | $7/month |
| Standard | 2GB | 1 CPU | $25/month |
| Pro | 4GB | 2 CPU | $85/month |

### Database Scaling

Render Dashboard → `valuehunt-db` → Settings:

| Plan | Storage | RAM | Price |
|------|---------|-----|-------|
| Free | 1GB | 256MB | $0 (90 days) |
| Starter | 1GB | 256MB | $7/month |
| Standard | 10GB | 1GB | $20/month |
| Pro | 100GB | 4GB | $90/month |

### Auto-Scaling

Render does not support auto-scaling yet. Manual scaling required.

---

## Troubleshooting

### Issue 1: Service Not Starting

**Symptom:** Service shows "Deploy failed" or stuck on "Building"

**Solutions:**

1. **Check build logs**:
   - Render Dashboard → Service → Logs
   - Look for errors during Docker build

2. **Common causes**:
   - Missing `Dockerfile` in backend directory
   - Python dependency conflicts in `requirements.txt`
   - Out of memory during build

3. **Fix**:
   ```bash
   # Test locally first
   docker build -t valuehunt-test .

   # If successful, push to GitHub
   git push origin main
   ```

### Issue 2: Database Connection Error

**Symptom:** `OperationalError: could not connect to server`

**Solutions:**

1. **Check DATABASE_URL**:
   - Render Dashboard → Service → Environment
   - Verify `DATABASE_URL` is set correctly
   - Should start with `postgresql://`

2. **Check database status**:
   - Render Dashboard → `valuehunt-db`
   - Status should be "Available" (green)

3. **Test connection**:
   ```bash
   # From service shell
   psql $DATABASE_URL -c "SELECT 1"
   ```

### Issue 3: Redis Connection Error

**Symptom:** `ConnectionError: Error connecting to Redis`

**Solutions:**

1. **Check REDIS_URL**:
   - Verify `REDIS_URL` is set
   - Should start with `redis://`

2. **Check Redis status**:
   - Render Dashboard → `valuehunt-redis`
   - Status should be "Available"

3. **Test connection**:
   ```bash
   redis-cli -u $REDIS_URL ping
   # Should return: PONG
   ```

### Issue 4: Celery Tasks Not Running

**Symptom:** Scheduled tasks don't execute

**Solutions:**

1. **Check Celery Beat logs**:
   ```bash
   render logs valuehunt-celery-beat --follow
   ```
   - Look for "Scheduler: Sending due task"
   - Verify tasks are being scheduled

2. **Check Celery Worker logs**:
   ```bash
   render logs valuehunt-celery-worker --follow
   ```
   - Look for "Task received"
   - Verify tasks are being processed

3. **Verify Beat singleton**:
   - Render Dashboard → `valuehunt-celery-beat` → Settings
   - **Instance Count MUST be 1**

4. **Check timezone**:
   - Tasks scheduled in Asia/Seoul timezone
   - Verify current time: `date +%Z`

### Issue 5: API Returns 503 Service Unavailable

**Symptom:** Health check failing, API unreachable

**Solutions:**

1. **Check health check endpoint**:
   ```bash
   curl https://valuehunt-api.onrender.com/health
   ```

2. **Verify FastAPI started**:
   - Check logs for "Uvicorn running on"
   - Look for startup errors

3. **Check dependencies**:
   - Database available?
   - Redis available?

4. **Restart service**:
   - Render Dashboard → Service → Manual Deploy → "Clear build cache & deploy"

### Issue 6: Duplicate Scheduled Tasks

**Symptom:** Same task runs multiple times

**Solutions:**

1. **Check Celery Beat instance count**:
   - Render Dashboard → `valuehunt-celery-beat` → Settings
   - **MUST be 1 instance only**

2. **Stop other beat processes**:
   - Ensure only ONE beat service running
   - Delete any duplicate beat services

3. **Implement task idempotency**:
   - Add database locks
   - Check task execution status before running

### Issue 7: Slow Docker Builds

**Symptom:** Builds take >10 minutes

**Solutions:**

1. **Use .dockerignore**:
   - Ensure `.dockerignore` excludes unnecessary files
   - Check: `__pycache__`, `.venv`, `node_modules`

2. **Optimize Dockerfile**:
   - Cache Python dependencies separately
   - Use multi-stage builds

3. **Clear build cache**:
   - Render Dashboard → Service → "Clear build cache & deploy"

---

## Cost Breakdown

### Hobby/MVP Tier (~$38/month)

| Resource | Plan | Price |
|----------|------|-------|
| PostgreSQL | Starter (1GB) | $7/month |
| Redis | Starter (256MB) | $10/month |
| API Service | Starter (512MB RAM) | $7/month |
| Celery Worker | Starter (512MB RAM) | $7/month |
| Celery Beat | Starter (512MB RAM) | $7/month |
| **Total** | | **$38/month** |

### Free Tier (Testing)

| Resource | Plan | Price | Notes |
|----------|------|-------|-------|
| PostgreSQL | Free (1GB) | $0 | 90 days only |
| Redis | - | No free tier | Need paid plan |
| API Service | Free | $0 | Spins down after inactivity |
| Celery Worker | Free | $0 | Spins down after inactivity |
| Celery Beat | Free | $0 | Spins down after inactivity |
| **Total** | | **$10/month** | (Redis only) |

**Note:** Free tier web services spin down after 15 minutes of inactivity.

### Production Tier (~$100-150/month)

| Resource | Plan | Count | Price |
|----------|------|-------|-------|
| PostgreSQL | Standard (10GB) | 1 | $20/month |
| Redis | Standard (1GB) | 1 | $30/month |
| API Service | Standard (2GB RAM) | 2 | $50/month |
| Celery Worker | Standard (2GB RAM) | 2 | $50/month |
| Celery Beat | Standard (2GB RAM) | 1 | $25/month |
| **Total** | | | **$175/month** |

---

## Next Steps

### After Successful Deployment

1. ✅ **Verify all services running**
   - Check Render Dashboard - all services "Live"

2. ✅ **Test API endpoints**
   - Health check: `/health`
   - Database: `/health/db`
   - Redis: `/health/redis`

3. ✅ **Monitor Celery tasks**
   - Check logs for scheduled task execution
   - Verify DART API integration

4. ✅ **Set up monitoring**
   - UptimeRobot for external monitoring
   - Sentry for error tracking (optional)

5. ✅ **Configure auto-deploy**
   - Verify GitHub auto-deploy enabled
   - Test: Push to main branch → auto-deploy

6. ✅ **Document URLs**
   - API URL: `https://valuehunt-api.onrender.com`
   - Database URL: (internal only)
   - Redis URL: (internal only)

### Recommended: Add Flower (Celery Monitoring)

See [OPERATIONS_PLAYBOOK.md](../docs/deployment/OPERATIONS_PLAYBOOK.md) for adding Flower monitoring service.

---

## Support & Resources

- **Render Documentation**: [render.com/docs](https://render.com/docs)
- **Render Community**: [community.render.com](https://community.render.com)
- **Render Status**: [status.render.com](https://status.render.com)
- **Render CLI**: [github.com/render-oss/render-cli](https://github.com/render-oss/render-cli)

---

## Related Documentation

- [DOCKER_DEVELOPMENT.md](./DOCKER_DEVELOPMENT.md) - Local Docker development guide
- [DEPLOYMENT_AWS.md](./DEPLOYMENT_AWS.md) - AWS migration guide
- [OPERATIONS_PLAYBOOK.md](../docs/deployment/OPERATIONS_PLAYBOOK.md) - Common operations
- [DISASTER_RECOVERY_RUNBOOK.md](../docs/deployment/DISASTER_RECOVERY_RUNBOOK.md) - Backup and restore
- [SECURITY_CHECKLIST.md](../docs/deployment/SECURITY_CHECKLIST.md) - Security review

---

**Last Updated:** 2026-01-19
**Version:** 1.0.0
**Status:** Production Ready ✅
