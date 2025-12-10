#!/bin/bash

# Health Check Monitoring Script
# Monitors the deployed application and sends alerts if issues are detected

set -e

# Configuration
LOG_FILE="/var/log/lms-health-check.log"
ALERT_EMAIL="admin@example.com"
BACKEND_URL="http://localhost:8000/api/health"
FRONTEND_URL="http://localhost:3000"
CHECK_INTERVAL=60  # seconds
FAILURE_THRESHOLD=3  # number of consecutive failures before alerting

# State
BACKEND_FAILURES=0
FRONTEND_FAILURES=0
POSTGRES_FAILURES=0

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" >> ${LOG_FILE}
}

log_console() {
    echo -e "$1"
    log "$1"
}

check_backend() {
    if curl -sf ${BACKEND_URL} &>/dev/null; then
        if [ ${BACKEND_FAILURES} -gt 0 ]; then
            log_console "${GREEN}✓ Backend is healthy${NC}"
        fi
        BACKEND_FAILURES=0
    else
        BACKEND_FAILURES=$((BACKEND_FAILURES + 1))
        log_console "${RED}✗ Backend health check failed (${BACKEND_FAILURES}/${FAILURE_THRESHOLD})${NC}"
        
        if [ ${BACKEND_FAILURES} -ge ${FAILURE_THRESHOLD} ]; then
            send_alert "Backend service is down" "Backend failed ${FAILURE_THRESHOLD} consecutive health checks"
        fi
    fi
}

check_frontend() {
    if curl -sf ${FRONTEND_URL} &>/dev/null; then
        if [ ${FRONTEND_FAILURES} -gt 0 ]; then
            log_console "${GREEN}✓ Frontend is healthy${NC}"
        fi
        FRONTEND_FAILURES=0
    else
        FRONTEND_FAILURES=$((FRONTEND_FAILURES + 1))
        log_console "${RED}✗ Frontend health check failed (${FRONTEND_FAILURES}/${FAILURE_THRESHOLD})${NC}"
        
        if [ ${FRONTEND_FAILURES} -ge ${FAILURE_THRESHOLD} ]; then
            send_alert "Frontend service is down" "Frontend failed ${FAILURE_THRESHOLD} consecutive health checks"
        fi
    fi
}

check_database() {
    if docker exec lms-postgres pg_isready -U lms_user &>/dev/null; then
        if [ ${POSTGRES_FAILURES} -gt 0 ]; then
            log_console "${GREEN}✓ Database is healthy${NC}"
        fi
        POSTGRES_FAILURES=0
    else
        POSTGRES_FAILURES=$((POSTGRES_FAILURES + 1))
        log_console "${RED}✗ Database health check failed (${POSTGRES_FAILURES}/${FAILURE_THRESHOLD})${NC}"
        
        if [ ${POSTGRES_FAILURES} -ge ${FAILURE_THRESHOLD} ]; then
            send_alert "Database service is down" "Database failed ${FAILURE_THRESHOLD} consecutive health checks"
        fi
    fi
}

check_disk_space() {
    DISK_USAGE=$(df /opt/lms | awk 'NR==2 {print $5}' | sed 's/%//')
    
    if [ ${DISK_USAGE} -gt 90 ]; then
        send_alert "Disk space warning" "Disk usage at ${DISK_USAGE}%"
    fi
}

check_container_status() {
    local container=$1
    
    if ! docker ps --filter "name=${container}" --filter "status=running" | grep -q ${container}; then
        send_alert "Container down" "${container} container is not running"
    fi
}

check_memory_usage() {
    MEMORY_USAGE=$(docker stats --no-stream --format "{{.MemPerc}}" | grep -oP '\d+' | head -1)
    
    if [ ${MEMORY_USAGE} -gt 80 ]; then
        send_alert "Memory warning" "Memory usage at ${MEMORY_USAGE}%"
    fi
}

send_alert() {
    local subject=$1
    local message=$2
    
    log_console "${YELLOW}⚠ Alert: ${subject}${NC}"
    
    # Send email alert
    echo "${message}" | mail -s "[LMS Alert] ${subject}" ${ALERT_EMAIL} 2>/dev/null || true
    
    # Optional: Send to monitoring system
    # curl -X POST "http://monitoring-system/api/alerts" \
    #     -H "Content-Type: application/json" \
    #     -d "{\"title\": \"${subject}\", \"message\": \"${message}\"}" || true
}

generate_report() {
    log "========== Health Check Report =========="
    log "Timestamp: $(date)"
    log "Backend Status: $(docker ps --filter 'name=lms-backend' --filter 'status=running' -q | grep -q . && echo 'Running' || echo 'Stopped')"
    log "Frontend Status: $(docker ps --filter 'name=lms-frontend' --filter 'status=running' -q | grep -q . && echo 'Running' || echo 'Stopped')"
    log "Database Status: $(docker ps --filter 'name=lms-postgres' --filter 'status=running' -q | grep -q . && echo 'Running' || echo 'Stopped')"
    log "Disk Usage: $(df /opt/lms | awk 'NR==2 {print $5}')"
    log "Container Count: $(docker ps -q | wc -l)"
    log "========================================"
}

main() {
    log_console "${BLUE}Starting health check monitoring...${NC}"
    log "Health check started"
    
    while true; do
        log_console "\n${BLUE}Checking system health...${NC}"
        
        check_backend
        check_frontend
        check_database
        check_disk_space
        check_container_status "lms-backend"
        check_container_status "lms-frontend"
        check_container_status "lms-postgres"
        check_memory_usage
        
        generate_report
        
        sleep ${CHECK_INTERVAL}
    done
}

# Handle signals
trap 'log_console "Health check monitoring stopped"; exit 0' SIGTERM SIGINT

# Create log file if it doesn't exist
mkdir -p $(dirname ${LOG_FILE})
touch ${LOG_FILE}

# Run main function
main
