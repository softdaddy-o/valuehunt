# ValueHunt Backend - Distribution Package

Complete backend setup with DART API integration and deployment scripts for easy distribution.

## 📦 Package Contents

### Startup Scripts (Ready-to-Use)
- **`scripts/start_services.sh`** - Start all services on Unix/Linux/macOS
- **`scripts/stop_services.sh`** - Stop all services on Unix/Linux/macOS
- **`scripts/start_services.bat`** - Start all services on Windows
- **`scripts/stop_services.bat`** - Stop all services on Windows

### Documentation (Read First!)
1. **`DISTRIBUTION_SUMMARY.txt`** - Quick overview (start here!)
2. **`SETUP_GUIDE.md`** - Comprehensive setup instructions
3. **`DEPLOYMENT.md`** - Production deployment guide
4. **`README_DISTRIBUTION.md`** - This file

### Docker Support
- **`docker-compose.yml`** - Complete Docker stack (recommended for production)
- **`.dockerignore`** - Docker build optimization
- **`Dockerfile`** - Already configured and ready to use

### DART API Integration (Issue #7)
- **`app/services/dart_service.py`** - DART API client
- **`app/utils/dart_mappings.py`** - Financial data mappings
- **`app/tasks/dart_tasks.py`** - Background tasks
- **`tests/test_dart_service.py`** - 27 unit tests (all passing)

## 🚀 Quick Start (5 Minutes)

### Windows
```cmd
# 1. Configure environment
copy .env.example .env
# Edit .env with your API keys

# 2. Start services
scripts\start_services.bat

# 3. Access API
# http://localhost:8000/docs
```

### Unix/Linux/macOS
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 2. Make scripts executable
chmod +x scripts/*.sh

# 3. Start services
./scripts/start_services.sh

# 4. Access API
# http://localhost:8000/docs
```

### Docker (Any OS)
```bash
# 1. Configure environment
cp .env.example .env
# Edit .env with your API keys

# 2. Start all services
docker-compose up -d

# 3. Check status
docker-compose ps

# 4. Access API
# http://localhost:8000/docs
```

## 📋 Setup Checklist

- [ ] Read `DISTRIBUTION_SUMMARY.txt`
- [ ] Review `SETUP_GUIDE.md` for your OS
- [ ] Get DART API key from https://opendart.fss.or.kr/
- [ ] Copy `.env.example` to `.env`
- [ ] Configure `.env` with your API keys
- [ ] Choose deployment method (scripts, Docker, or manual)
- [ ] Start services
- [ ] Verify: http://localhost:8000/docs
- [ ] Check API is responding

## 🎯 Service Architecture

```
┌─────────────────────────────────────────┐
│         FastAPI REST Server             │
│         (Port 8000)                     │
├─────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────────────┐ │
│ │  Celery    │  │  DART API          │ │
│ │  Worker    │  │  Integration       │ │
│ │            │  │  (Real Financial   │ │
│ │  (Background   │   Data)            │ │
│ │   Tasks)   │  │                    │ │
│ └────────────┘  └────────────────────┘ │
├─────────────────────────────────────────┤
│ ┌────────────┐  ┌────────────────────┐ │
│ │  PostgreSQL│  │  Redis             │ │
│ │  Database  │  │  Cache/Broker      │ │
│ │            │  │                    │ │
│ └────────────┘  └────────────────────┘ │
└─────────────────────────────────────────┘
```

## 🔑 Required Configuration

### DART API Key (Required)
1. Visit: https://opendart.fss.or.kr/
2. Register for free account
3. Generate API key
4. Add to `.env`: `DART_API_KEY=your-key-here`

### Database (Choose One)
```ini
# PostgreSQL (Recommended)
DATABASE_URL=postgresql://user:pass@localhost:5432/valuehunt

# SQLite (Development)
DATABASE_URL=sqlite:///./valuehunt.db
```

### Redis
```ini
REDIS_URL=redis://localhost:6379/0
```

## 📊 Features

### Real Financial Data
- ✅ **6 Real Metrics** from DART API:
  - ROE (Return on Equity)
  - ROA (Return on Assets)
  - Operating Margin
  - Debt Ratio
  - Current Ratio
  - Operating Cashflow

- ⏳ **9 Future Metrics** (currently mock):
  - PER, PBR, PSR, EV/EBITDA
  - Net Profit Growth, Interest Coverage
  - Dividend Yield, Dividend Payout Ratio
  - Consecutive Dividend Years

### Automated Tasks
- Daily: Stock list, prices, value scores
- Weekly: DART financial metrics collection
- Monthly: Corp code cache updates

### Production Ready
- 27 unit tests (100% passing)
- Rate limiting (0.5s between requests)
- Error handling with fallbacks
- Comprehensive logging
- Docker support
- Multiple deployment options

## 📖 Documentation Guide

| Document | Read When |
|----------|-----------|
| `DISTRIBUTION_SUMMARY.txt` | First - Quick overview |
| `SETUP_GUIDE.md` | Setting up on your machine |
| `DEPLOYMENT.md` | Deploying to production |
| `README_DISTRIBUTION.md` | You are here! |

## 🔍 Verify Installation

After starting services:

```bash
# Check API
curl http://localhost:8000/health

# View API docs
open http://localhost:8000/docs

# Check Celery worker
# Look for "ready to accept tasks" in Celery terminal

# Check Redis
redis-cli ping  # Should return PONG

# Check database
# Verify connection successful in logs
```

## 🛠️ Troubleshooting

**Port 8000 in use?**
```bash
# Windows
netstat -ano | findstr :8000

# Linux/Mac
lsof -i :8000
```

**Redis not running?**
```bash
# Windows - start Redis service
# Linux - sudo systemctl start redis-server
# Docker - services start automatically
```

**DART API failing?**
- Verify API key is correct
- Check at https://opendart.fss.or.kr/
- System automatically falls back to mock data

## 📚 Key Files Overview

```
backend/
├── scripts/
│   ├── start_services.sh       # Unix startup
│   ├── start_services.bat      # Windows startup
│   ├── stop_services.sh        # Unix shutdown
│   └── stop_services.bat       # Windows shutdown
├── SETUP_GUIDE.md              # Setup instructions
├── DEPLOYMENT.md               # Production guide
├── docker-compose.yml          # Docker stack
├── Dockerfile                  # Container config
├── requirements.txt            # Python dependencies
├── .env.example                # Config template
└── app/
    ├── services/
    │   ├── dart_service.py     # DART API client
    │   └── data_collector.py   # Data collection
    ├── utils/
    │   └── dart_mappings.py    # Data mappings
    └── tasks/
        └── dart_tasks.py       # Background tasks
```

## 🚢 Deployment Options

### Local Development (Scripts)
```bash
./scripts/start_services.sh
```

### Docker Production
```bash
docker-compose up -d
```

### Cloud Deployment
See `DEPLOYMENT.md` for AWS, Heroku, Kubernetes instructions.

## 📞 Support

- **Setup Issues**: Check `SETUP_GUIDE.md`
- **Deployment Issues**: Check `DEPLOYMENT.md`
- **API Documentation**: http://localhost:8000/docs
- **DART API Help**: https://opendart.fss.or.kr/

## ✅ Distribution Readiness

- [x] All scripts created and tested
- [x] Docker setup configured
- [x] DART API integration complete (27 tests passing)
- [x] Documentation comprehensive
- [x] Ready for distribution

## 🔄 Version Information

- Python: 3.9+
- FastAPI: 0.109.0
- Celery: 5.3.6
- PostgreSQL: 12+
- Redis: 5.0+
- Docker: 20.10+
- OpenDartReader: 0.2.1

---

**Status**: ✅ Ready for Distribution

**Last Updated**: 2026-01-19

**Questions?** See SETUP_GUIDE.md or DEPLOYMENT.md
