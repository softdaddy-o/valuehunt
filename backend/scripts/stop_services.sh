#!/bin/bash

# ValueHunt Backend Services Shutdown Script
# This script gracefully stops all services

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
echo -e "${YELLOW}Stopping ValueHunt Services${NC}"
echo -e "${YELLOW}================================${NC}"
echo ""

# Function to kill process gracefully
kill_process() {
    local pid_file=$1
    local name=$2

    if [ -f "$pid_file" ]; then
        PID=$(cat "$pid_file")
        if ps -p $PID > /dev/null 2>&1; then
            echo -e "${YELLOW}Stopping $name (PID: $PID)...${NC}"
            kill -TERM $PID

            # Wait for graceful shutdown (max 10 seconds)
            for i in {1..10}; do
                if ! ps -p $PID > /dev/null 2>&1; then
                    echo -e "${GREEN}$name stopped${NC}"
                    rm -f "$pid_file"
                    return 0
                fi
                sleep 1
            done

            # Force kill if not stopped
            echo -e "${RED}Force killing $name${NC}"
            kill -9 $PID
            rm -f "$pid_file"
            return 0
        else
            echo -e "${YELLOW}$name (PID: $PID) not running${NC}"
            rm -f "$pid_file"
        fi
    else
        echo -e "${YELLOW}No PID file for $name${NC}"
    fi
}

# Kill services in reverse order
kill_process "$PROJECT_ROOT/.pids_beat" "Celery Beat"
kill_process "$PROJECT_ROOT/.pids_celery" "Celery Worker"
kill_process "$PROJECT_ROOT/.pids_api" "FastAPI"

echo ""
echo -e "${GREEN}================================${NC}"
echo -e "${GREEN}All services stopped${NC}"
echo -e "${GREEN}================================${NC}"
echo ""

# Kill any remaining processes using the ports
echo -e "${YELLOW}Checking for processes on port 8000...${NC}"
if command -v lsof &> /dev/null; then
    if lsof -Pi :8000 -sTCP:LISTEN -t &> /dev/null; then
        echo -e "${YELLOW}Found process on port 8000, killing...${NC}"
        kill -9 $(lsof -t -i :8000) 2>/dev/null || true
    fi
fi

echo -e "${GREEN}Shutdown complete${NC}"
