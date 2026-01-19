@echo off
REM ValueHunt Backend Services Startup Script (Windows)
REM This script starts all necessary services for the ValueHunt application

setlocal enabledelayedexpansion

REM Colors (Windows 10+)
for /F %%a in ('echo prompt $H ^| cmd') do set "BS=%%a"
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "NC=[0m"

REM Get the script directory
set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR:~0,-9%"

echo.
echo %YELLOW%================================%NC%
echo %YELLOW%ValueHunt Backend Services%NC%
echo %YELLOW%================================%NC%
echo.

REM Check if .env file exists
if not exist "%PROJECT_ROOT%.env" (
    echo %RED%Error: .env file not found at %PROJECT_ROOT%.env%NC%
    echo Please copy .env.example to .env and configure it first
    exit /b 1
)

REM Check if virtual environment exists
if not exist "%PROJECT_ROOT%venv" (
    echo %YELLOW%Creating virtual environment...%NC%
    python -m venv "%PROJECT_ROOT%venv"
)

REM Activate virtual environment
echo %YELLOW%Activating virtual environment...%NC%
call "%PROJECT_ROOT%venv\Scripts\activate.bat"

REM Install/upgrade dependencies
echo %YELLOW%Installing dependencies...%NC%
pip install -q -r "%PROJECT_ROOT%requirements.txt"

echo.
echo %YELLOW%Checking configuration...%NC%

REM Check for .env configuration
findstr /C:"DATABASE_URL=" "%PROJECT_ROOT%.env" >nul
if errorlevel 1 echo %RED%Warning: DATABASE_URL not configured%NC%

findstr /C:"REDIS_URL=" "%PROJECT_ROOT%.env" >nul
if errorlevel 1 echo %RED%Warning: REDIS_URL not configured%NC%

findstr /C:"SECRET_KEY=" "%PROJECT_ROOT%.env" >nul
if errorlevel 1 echo %RED%Warning: SECRET_KEY not configured%NC%

findstr /C:"DART_API_KEY=" "%PROJECT_ROOT%.env" >nul
if errorlevel 1 echo %YELLOW%Note: DART API will be disabled%NC%

echo.
echo %YELLOW%Starting services...%NC%
echo.

REM Create log directory
if not exist "%PROJECT_ROOT%logs" mkdir "%PROJECT_ROOT%logs"

REM Start FastAPI server in new window
echo %GREEN%Starting FastAPI server on port 8000...%NC%
start "ValueHunt FastAPI" cmd /k "cd /d %PROJECT_ROOT% && uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload"

REM Wait a moment for FastAPI to start
timeout /t 2 /nobreak

REM Start Celery worker in new window
echo %GREEN%Starting Celery worker...%NC%
start "ValueHunt Celery Worker" cmd /k "cd /d %PROJECT_ROOT% && celery -A app.celery_app worker --loglevel=info"

REM Wait a moment for Celery to start
timeout /t 2 /nobreak

REM Start Celery beat scheduler in new window
echo %GREEN%Starting Celery beat scheduler...%NC%
start "ValueHunt Celery Beat" cmd /k "cd /d %PROJECT_ROOT% && celery -A app.celery_app beat --loglevel=info"

echo.
echo %GREEN%================================%NC%
echo %GREEN%All services started successfully%NC%
echo %GREEN%================================%NC%
echo.
echo FastAPI will be available at: http://localhost:8000
echo API docs at: http://localhost:8000/docs
echo.
echo Services are running in separate command windows
echo Close each window to stop the corresponding service
echo.

pause
