#!/bin/bash

# ValueHunt Backend Services Startup Script
# This script starts all necessary services for the ValueHunt application

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$(dirname "$(dirname "$SCRIPT_DIR")")"

echo -e "${YELLOW}================================${NC}"
echo -e "${YELLOW}ValueHunt Backend Services${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f "$PROJECT_ROOT/.env" ]; then
    echo -e "${RED}Error: .env file not found at $PROJECT_ROOT/.env${NC}"
    echo "Please copy .env.example to .env and configure it first"
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "$PROJECT_ROOT/venv" ]; then
    echo -e "${YELLOW}Creating virtual environment...${NC}"
    python -m venv "$PROJECT_ROOT/venv"
fi

# Activate virtual environment
echo -e "${YELLOW}Activating virtual environment...${NC}"
source "$PROJECT_ROOT/venv/bin/activate"

# Install/upgrade dependencies
echo -e "${YELLOW}Installing dependencies...${NC}"
pip install -q -r "$PROJECT_ROOT/requirements.txt"

# Check for required environment variables
check_env_var() {
    if [ -z "$(grep "^$1=" "$PROJECT_ROOT/.env" | cut -d= -f2)" ]; then
        echo -e "${RED}Warning: $1 is not configured in .env${NC}"
        return 1
    fi
    return 0
}

echo ""
echo -e "${YELLOW}Checking configuration...${NC}"

# Check critical environment variables
check_env_var "DATABASE_URL" || true
check_env_var "REDIS_URL" || true
check_env_var "SECRET_KEY" || true
check_env_var "DART_API_KEY" || echo -e "${YELLOW}Note: DART API will be disabled${NC}"

echo ""
echo -e "${YELLOW}Starting services...${NC}"
echo ""

# Create log directory
mkdir -p "$PROJECT_ROOT/logs"

# Start FastAPI server
echo -e "${GREEN}Starting FastAPI server on port 8000...${NC}"
cd "$PROJECT_ROOT"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
API_PID=$!
echo "FastAPI PID: $API_PID"

# Start Celery worker (in another terminal)
echo -e "${GREEN}Starting Celery worker...${NC}"
celery -A app.celery_app worker --loglevel=info &
CELERY_PID=$!
echo "Celery worker PID: $CELERY_PID"

# Start Celery beat scheduler (in another terminal)
echo -e "${GREEN}Starting Celery beat scheduler...${NC}"
celery -A app.celery_app beat --loglevel=info &
BEAT_PID=$!
echo "Celery beat PID: $BEAT_PID"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}All services started successfully${NC}"
echo -e "${GREEN}================================${NC}"
echo ""
echo "Service PIDs:"
echo "  FastAPI:      $API_PID"
echo "  Celery:       $CELERY_PID"
echo "  Celery Beat:  $BEAT_PID"
echo ""
echo "FastAPI will be available at: http://localhost:8000"
echo "API docs at: http://localhost:8000/docs"
echo ""
echo "To stop services, run: stop_services.sh"
echo ""

# Save PIDs to file for shutdown script
echo "$API_PID" > "$PROJECT_ROOT/.pids_api"
echo "$CELERY_PID" > "$PROJECT_ROOT/.pids_celery"
echo "$BEAT_PID" > "$PROJECT_ROOT/.pids_beat"

# Wait for all processes
wait $API_PID $CELERY_PID $BEAT_PID
