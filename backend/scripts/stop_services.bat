@echo off
REM ValueHunt Backend Services Shutdown Script (Windows)
REM This script stops all services

setlocal enabledelayedexpansion

REM Colors (Windows 10+)
for /F %%a in ('echo prompt $H ^| cmd') do set "BS=%%a"
set "RED=[91m"
set "GREEN=[92m"
set "YELLOW=[93m"
set "NC=[0m"

echo.
echo %YELLOW%================================%NC%
echo %YELLOW%Stopping ValueHunt Services%NC%
echo %YELLOW%================================%NC%
echo.

REM Kill FastAPI (port 8000)
echo %YELLOW%Stopping FastAPI server...%NC%
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :8000') do (
    taskkill /F /PID %%a 2>nul
)
if errorlevel 0 (
    echo %GREEN%FastAPI stopped%NC%
) else (
    echo %YELLOW%FastAPI not running%NC%
)

REM Kill Celery worker
echo %YELLOW%Stopping Celery worker...%NC%
taskkill /F /IM celery.exe 2>nul
if errorlevel 0 (
    echo %GREEN%Celery worker stopped%NC%
) else (
    echo %YELLOW%Celery worker not running%NC%
)

REM Kill Celery beat
echo %YELLOW%Stopping Celery beat...%NC%
taskkill /F /IM celery.exe 2>nul

echo.
echo %GREEN%================================%NC%
echo %GREEN%All services stopped%NC%
echo %GREEN%================================%NC%
echo.

pause
