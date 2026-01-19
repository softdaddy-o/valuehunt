# ValueHunt Backend Deployment Guide

This document describes how to deploy the ValueHunt backend to different environments.

## Table of Contents

1. [Local Development](#local-development)
2. [Docker Deployment](#docker-deployment)
3. [Production Deployment](#production-deployment)
4. [Monitoring & Troubleshooting](#monitoring--troubleshooting)

---

## Local Development

### Quick Start

1. **Setup:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

2. **Configure Environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start Services (Unix/Linux/macOS):**
   ```bash
   chmod +x scripts/start_services.sh
   ./scripts/start_services.sh
   ```

   Or on **Windows:**
   ```cmd
   scripts\start_services.bat
   ```

4. **Access Services:**
   - API: http://localhost:8000
   - API Docs: http://localhost:8000/docs
   - Flower (Celery monitoring): http://localhost:5555

---

## Docker Deployment

### Prerequisites

- Docker 20.10+
- Docker Compose 2.0+

### Quick Start with Docker Compose

```bash
# Copy example env file
cp .env.example .env

# Edit .env with your settings
nano .env

# Start all services
docker-compose up -d

# Check services status
docker-compose ps

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Access Services in Docker

- **API**: http://localhost:8000
- **API Docs**: http://localhost:8000/docs
- **Flower**: http://localhost:5555
- **Database**: postgresql://valuehunt:password@localhost:5432/valuehunt
- **Redis**: redis://localhost:6379

### Docker-Only Commands

```bash
# Rebuild images
docker-compose build

# Run migrations
docker-compose exec api alembic upgrade head

# Run tests
docker-compose exec api pytest tests/

# Interactive shell
docker-compose exec api python

# View worker logs
docker-compose logs celery_worker -f

# Scale workers
docker-compose up -d --scale celery_worker=3
```

### Docker Deployment with Custom Registry

```bash
# Build image
docker build -t valuehunt-api:1.0.0 .

# Tag for registry
docker tag valuehunt-api:1.0.0 registry.example.com/valuehunt-api:1.0.0

# Push to registry
docker push registry.example.com/valuehunt-api:1.0.0

# Pull and run
docker pull registry.example.com/valuehunt-api:1.0.0
docker run -e DATABASE_URL=... -p 8000:8000 registry.example.com/valuehunt-api:1.0.0
```

---

## Production Deployment

### Pre-Deployment Checklist

- [ ] Update `.env` with production values
- [ ] Set `ENVIRONMENT=production` and `DEBUG=false`
- [ ] Generate strong `SECRET_KEY`
- [ ] Configure HTTPS/SSL
- [ ] Set up database backups
- [ ] Configure logging and monitoring
- [ ] Set resource limits
- [ ] Test disaster recovery

### Deployment on AWS EC2

```bash
# SSH into EC2 instance
ssh -i your-key.pem ec2-user@your-instance-ip

# Install Docker
sudo yum update -y
sudo yum install -y docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Clone repository
git clone https://github.com/your-repo/valuehunt.git
cd valuehunt/backend

# Configure environment
cp .env.example .env
# Edit .env with production settings

# Start services
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Check status
docker-compose ps
```

### Deployment on Heroku

```bash
# Install Heroku CLI
curl https://cli-assets.heroku.com/install.sh | sh

# Login to Heroku
heroku login

# Create app
heroku create valuehunt-api

# Set environment variables
heroku config:set ENVIRONMENT=production
heroku config:set DEBUG=false
heroku config:set DART_API_KEY=your-key
heroku config:set SECRET_KEY=your-secret

# Add PostgreSQL
heroku addons:create heroku-postgresql:standard-0

# Add Redis
heroku addons:create heroku-redis:premium-0

# Deploy
git push heroku main

# Check logs
heroku logs -t

# Run shell
heroku run python
```

### Deployment on Kubernetes

```bash
# Build and push image
docker build -t valuehunt-api:1.0.0 .
docker tag valuehunt-api:1.0.0 your-registry/valuehunt-api:1.0.0
docker push your-registry/valuehunt-api:1.0.0

# Create namespace
kubectl create namespace valuehunt

# Create secrets
kubectl create secret generic valuehunt-secrets \
  --from-literal=database-url="postgresql://..." \
  --from-literal=dart-api-key="..." \
  --from-literal=secret-key="..." \
  -n valuehunt

# Deploy with Helm or kubectl
kubectl apply -f k8s/deployment.yaml -n valuehunt

# Check deployment
kubectl get pods -n valuehunt
kubectl logs -f deployment/valuehunt-api -n valuehunt
```

### Using systemd on Linux Server

Create `/etc/systemd/system/valuehunt.service`:

```ini
[Unit]
Description=ValueHunt Backend
After=network.target docker.service
Requires=docker.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/opt/valuehunt/backend
ExecStart=docker-compose up
ExecStop=docker-compose down
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

Enable and start:
```bash
sudo systemctl daemon-reload
sudo systemctl enable valuehunt
sudo systemctl start valuehunt
sudo systemctl status valuehunt
```

---

## Monitoring & Troubleshooting

### Health Checks

```bash
# Check API health
curl http://localhost:8000/health

# Check database connection
docker-compose exec api python -c "from app.db.database import engine; engine.connect()"

# Check Redis connection
docker-compose exec redis redis-cli ping

# Check Celery workers
docker-compose exec api celery -A app.celery_app inspect active
```

### Logging

```bash
# View all logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f api
docker-compose logs -f celery_worker

# View logs with timestamps
docker-compose logs --timestamps

# Save logs to file
docker-compose logs > deployment.log 2>&1
```

### Performance Monitoring

```bash
# Monitor resource usage
docker stats

# View process information
docker top valuehunt_api

# Celery worker monitoring
docker-compose exec api celery -A app.celery_app inspect stats

# Database connections
docker-compose exec db psql -U valuehunt -d valuehunt -c "SELECT * FROM pg_stat_activity;"
```

### Scaling

```bash
# Scale Celery workers
docker-compose up -d --scale celery_worker=5

# Monitor Flower
# Visit http://localhost:5555

# Check task queue
docker-compose exec api celery -A app.celery_app inspect reserved
docker-compose exec api celery -A app.celery_app inspect active_queues
```

### Backup & Restore

```bash
# Backup database
docker-compose exec db pg_dump -U valuehunt valuehunt > backup.sql

# Restore database
docker-compose exec -T db psql -U valuehunt valuehunt < backup.sql

# Backup volumes
docker-compose exec -T db tar czf - -C /var/lib/postgresql data | tar xzf - -C ./backups/

# Test backup restoration
docker-compose down
docker volume rm valuehunt_postgres_data
docker-compose up -d
# Restore from backup
```

### Common Issues

**Port Already in Use:**
```bash
# Find process using port 8000
lsof -i :8000
# Kill process
kill -9 PID
```

**Docker Out of Space:**
```bash
# Clean unused images
docker image prune -a

# Clean unused volumes
docker volume prune

# Clean unused networks
docker network prune
```

**Celery Worker Not Starting:**
```bash
# Check Redis connection
docker-compose logs redis

# Check broker URL
docker-compose exec api python -c "from app.core.config import settings; print(settings.CELERY_BROKER_URL)"

# Test connection
docker-compose exec api redis-cli -h redis ping
```

---

## Environment Variables

### Required
```ini
DATABASE_URL=postgresql://user:pass@host:5432/dbname
REDIS_URL=redis://host:6379/0
SECRET_KEY=generate-a-strong-key
DART_API_KEY=your-api-key
```

### Optional
```ini
GEMINI_API_KEY=optional
OPENAI_API_KEY=optional
SENDGRID_API_KEY=optional
ENVIRONMENT=production
DEBUG=false
CORS_ORIGINS=["https://example.com"]
```

---

## Security Considerations

1. **Environment Variables:**
   - Never commit `.env` files
   - Use secrets management (AWS Secrets Manager, HashiCorp Vault)
   - Rotate keys regularly

2. **Database:**
   - Use strong passwords
   - Enable SSL/TLS connections
   - Regular backups
   - Restrict network access

3. **API:**
   - Enable HTTPS/TLS
   - Use rate limiting
   - Implement authentication
   - Regular security updates

4. **Docker:**
   - Use minimal base images
   - Run as non-root user
   - Scan images for vulnerabilities
   - Keep Docker updated

---

## Support

For issues and questions:
- Check logs: `docker-compose logs`
- Review documentation: See SETUP_GUIDE.md
- Report issues: GitHub Issues
- API Documentation: http://localhost:8000/docs

