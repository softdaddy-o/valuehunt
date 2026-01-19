# ValueHunt Backend Setup Guide

This guide explains how to set up and run the ValueHunt backend services on any machine.

## Prerequisites

- **Python 3.9+** - Download from https://www.python.org/downloads/
- **PostgreSQL** or **SQLite** - For database
- **Redis** - For Celery broker and caching
- **Git** - For version control

### Windows Setup
1. Download and install Python 3.9+ (check "Add Python to PATH")
2. Download and install PostgreSQL or use SQLite
3. Download and install Redis (Windows version or WSL2)
4. Download and install Git

### macOS Setup
```bash
# Using Homebrew
brew install python@3.9
brew install postgresql
brew install redis
brew install git
```

### Linux Setup (Ubuntu/Debian)
```bash
sudo apt update
sudo apt install -y python3.9 python3.9-venv python3-pip
sudo apt install -y postgresql postgresql-contrib
sudo apt install -y redis-server
sudo apt install -y git
```

---

## Installation Steps

### 1. Clone or Extract the Repository

```bash
# If cloning from git
git clone https://github.com/your-repo/valuehunt.git
cd valuehunt/backend

# Or extract the zip file
unzip valuehunt-backend.zip
cd valuehunt-backend
```

### 2. Configure Environment Variables

Copy the example environment file and configure it:

```bash
cp .env.example .env
```

Edit `.env` file and set these critical variables:

```ini
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/valuehunt
# or for SQLite:
# DATABASE_URL=sqlite:///./valuehunt.db

# Redis
REDIS_URL=redis://localhost:6379/0

# JWT Secret (generate a new one for production)
SECRET_KEY=your-secret-key-here-min-32-chars

# DART API (required for financial data)
DART_API_KEY=your-dart-api-key-here

# Optional AI APIs
GEMINI_API_KEY=your-gemini-api-key
OPENAI_API_KEY=your-openai-api-key
ANTHROPIC_API_KEY=your-anthropic-api-key

# CORS Origins (for frontend)
CORS_ORIGINS=["http://localhost:5173","http://localhost:3000"]

# Environment
ENVIRONMENT=development
DEBUG=true
```

### 3. Get API Keys

**DART API Key** (Required):
- Visit https://opendart.fss.or.kr/
- Register for a free account
- Generate an API key
- Add to `.env` as `DART_API_KEY`

**Gemini AI Key** (Optional):
- Visit https://ai.google.dev/
- Sign up and create an API key
- Add to `.env` as `GEMINI_API_KEY`

### 4. Start Services

#### Option A: Using Startup Scripts (Recommended)

**Windows:**
```cmd
# Double-click or run from command prompt
scripts\start_services.bat

# To stop services, run
scripts\stop_services.bat
```

**macOS/Linux:**
```bash
# Make scripts executable
chmod +x scripts/start_services.sh
chmod +x scripts/stop_services.sh

# Start services
./scripts/start_services.sh

# To stop services in another terminal
./scripts/stop_services.sh
```

#### Option B: Manual Startup

**Create virtual environment:**
```bash
python -m venv venv

# Activate it
# Windows:
venv\Scripts\activate

# macOS/Linux:
source venv/bin/activate
```

**Install dependencies:**
```bash
pip install -r requirements.txt
```

**Start services in separate terminals:**

Terminal 1 - FastAPI:
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Terminal 2 - Celery Worker:
```bash
celery -A app.celery_app worker --loglevel=info
```

Terminal 3 - Celery Beat (Scheduler):
```bash
celery -A app.celery_app beat --loglevel=info
```

---

## Verification

### Check Services

1. **FastAPI Server:**
   - Open http://localhost:8000
   - API docs: http://localhost:8000/docs
   - Should see Swagger UI documentation

2. **Database:**
   ```bash
   # Check PostgreSQL connection
   psql -h localhost -U user -d valuehunt

   # Or for SQLite
   sqlite3 valuehunt.db ".tables"
   ```

3. **Redis:**
   ```bash
   redis-cli ping
   # Should return: PONG
   ```

4. **Celery Worker:**
   - Check the Celery terminal, should show "ready to accept tasks"

### Test Data Collection

Start collecting real financial data:

```bash
# Optional: In Python interactive shell
python

# Then run:
from app.db.database import SessionLocal
from app.services.data_collector import DataCollector

db = SessionLocal()
collector = DataCollector(db)

# Collect stock list
collector.collect_stock_list()

# Collect prices
collector.collect_all_stock_prices(limit=10)

# Collect financial metrics (will use DART API)
collector.collect_all_financial_metrics(limit=10)

db.close()
```

Or trigger Celery tasks:

```bash
python -c "from app.tasks.dart_tasks import fetch_all_dart_financial_metrics_task; fetch_all_dart_financial_metrics_task.delay(limit=20)"
```

---

## Scheduled Tasks

The application automatically runs these tasks:

### Daily Tasks (Weekdays)
- **6:00 AM** - Collect stock list
- **4:00 PM** - Update stock prices (after market close)
- **7:00 PM** - Calculate value scores

### Weekly Tasks
- **Monday 2:00 AM** - Collect DART financial metrics for all stocks

### Monthly Tasks
- **1st of month 1:00 AM** - Update corp code cache

---

## Troubleshooting

### Port Already in Use

**Windows:**
```cmd
# Find process using port 8000
netstat -ano | findstr :8000

# Kill the process (replace PID)
taskkill /PID PID_NUMBER /F
```

**macOS/Linux:**
```bash
# Find and kill process
lsof -ti:8000 | xargs kill -9
```

### Redis Connection Error

Make sure Redis is running:

```bash
# Windows - start from installed location
redis-server

# macOS
brew services start redis

# Linux
sudo systemctl start redis-server
```

### PostgreSQL Connection Error

Check connection string and credentials:
```bash
psql -h localhost -U username -d databasename
```

### DART API Key Invalid

1. Check `.env` file has correct key
2. Verify key at https://opendart.fss.or.kr/
3. Check API usage limits
4. System will automatically fallback to mock data if DART fails

### Celery Worker Not Starting

```bash
# Check Redis is running
redis-cli ping

# Check Celery configuration
celery -A app.celery_app inspect active

# View logs
celery -A app.celery_app worker --loglevel=debug
```

---

## Production Deployment

For production environments:

1. **Update `.env`:**
   - Set `ENVIRONMENT=production`
   - Set `DEBUG=false`
   - Use strong `SECRET_KEY`
   - Configure production database
   - Update `CORS_ORIGINS`

2. **Use WSGI Server:**
   ```bash
   pip install gunicorn
   gunicorn app.main:app --workers 4 --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:8000
   ```

3. **Use Supervisor or Systemd:**
   - Create systemd service files for auto-start
   - Use supervisor for process management

4. **Enable HTTPS:**
   - Use nginx as reverse proxy
   - Configure SSL certificates

---

## Support & Documentation

- **API Documentation**: http://localhost:8000/docs
- **DART API Docs**: https://engopendart.fss.or.kr/guide/main.do
- **FastAPI Docs**: https://fastapi.tiangolo.com/
- **Celery Docs**: https://docs.celeryproject.io/

---

## Quick Reference

| Command | Purpose |
|---------|---------|
| `./start_services.sh` | Start all services (macOS/Linux) |
| `start_services.bat` | Start all services (Windows) |
| `uvicorn app.main:app --reload` | Start FastAPI only |
| `celery -A app.celery_app worker` | Start Celery worker |
| `celery -A app.celery_app beat` | Start Celery scheduler |
| `pytest tests/` | Run tests |
| `flask db upgrade` | Run database migrations |

---

## Version Info

- **Python**: 3.9+
- **FastAPI**: 0.109.0
- **SQLAlchemy**: 2.0.25
- **Celery**: 5.3.6
- **Redis**: 5.0.1+
- **PostgreSQL**: 12+

