@echo off
REM ValueHunt Backend Docker Test Script

echo ========================================
echo ValueHunt Backend - Docker Test
echo ========================================
echo.

REM Check if Docker is running
echo [1/7] Checking Docker...
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Docker Desktop is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)
echo OK - Docker is running
echo.

REM Check Docker Compose version
echo [2/7] Checking Docker Compose...
docker-compose --version
echo.

REM Copy environment file
echo [3/7] Preparing environment...
copy /Y .env.docker .env >nul 2>&1
echo OK - Environment file ready
echo.

REM Build Docker images
echo [4/7] Building Docker images...
echo This may take 5-10 minutes on first build
docker-compose build
if %errorlevel% neq 0 (
    echo ERROR: Docker build failed
    pause
    exit /b 1
)
echo OK - Images built successfully
echo.

REM Start services
echo [5/7] Starting services...
docker-compose up -d
if %errorlevel% neq 0 (
    echo ERROR: Failed to start services
    pause
    exit /b 1
)
echo OK - Services started
echo.

REM Wait for services
echo [6/7] Waiting 30 seconds for services to initialize...
timeout /t 30 /nobreak >nul
echo.

REM Check status
echo [7/7] Checking service status...
docker-compose ps
echo.

echo ========================================
echo Test Complete!
echo ========================================
echo.
echo Testing API health endpoint...
timeout /t 3 /nobreak >nul
curl http://localhost:8000/health
echo.
echo.

echo ========================================
echo Useful Commands:
echo ========================================
echo View logs:        docker-compose logs -f
echo View API logs:    docker-compose logs -f api
echo Stop services:    docker-compose down
echo API docs:         http://localhost:8000/docs
echo Flower monitor:   http://localhost:5555
echo.

pause
