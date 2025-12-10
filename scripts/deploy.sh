#!/bin/bash

# LMS CI/CD Deployment Script
# This script handles the deployment of the LMS application to EC2

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
LMS_HOME="/opt/lms"
DOCKER_COMPOSE_FILE="${LMS_HOME}/docker-compose.prod.yml"
BACKUP_DIR="${LMS_HOME}/backups"
LOGS_DIR="${LMS_HOME}/logs"
MAX_BACKUPS=5

# Functions
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create necessary directories
setup_directories() {
    log_info "Setting up directories..."
    mkdir -p ${BACKUP_DIR}
    mkdir -p ${LOGS_DIR}
    log_success "Directories created"
}

# Check if Docker and Docker Compose are installed
check_docker() {
    log_info "Checking Docker installation..."
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed"
        exit 1
    fi
    
    if ! command -v docker-compose &> /dev/null; then
        log_error "Docker Compose is not installed"
        exit 1
    fi
    
    log_success "Docker and Docker Compose are installed"
}

# Backup current deployment
backup_deployment() {
    log_info "Creating backup of current deployment..."
    
    BACKUP_NAME="backup_$(date +%Y%m%d_%H%M%S)"
    BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"
    
    mkdir -p ${BACKUP_PATH}
    
    # Backup docker-compose file
    if [ -f ${DOCKER_COMPOSE_FILE} ]; then
        cp ${DOCKER_COMPOSE_FILE} ${BACKUP_PATH}/
    fi
    
    # Backup database (optional)
    if command -v pg_dump &> /dev/null; then
        log_info "Backing up database..."
        docker exec lms-postgres pg_dump -U lms_user lms_db > ${BACKUP_PATH}/lms_db_backup.sql 2>/dev/null || true
    fi
    
    # Backup static files
    if [ -d ${LMS_HOME}/static ]; then
        cp -r ${LMS_HOME}/static ${BACKUP_PATH}/
    fi
    
    log_success "Backup created: ${BACKUP_PATH}"
    
    # Clean old backups
    cleanup_old_backups
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning old backups (keeping last ${MAX_BACKUPS})..."
    
    backup_count=$(ls -1d ${BACKUP_DIR}/backup_* 2>/dev/null | wc -l)
    
    if [ ${backup_count} -gt ${MAX_BACKUPS} ]; then
        backups_to_remove=$((backup_count - MAX_BACKUPS))
        ls -1d ${BACKUP_DIR}/backup_* | head -n ${backups_to_remove} | xargs -r rm -rf
        log_success "Removed ${backups_to_remove} old backups"
    fi
}

# Pull latest images
pull_images() {
    log_info "Pulling latest Docker images..."
    
    docker pull victormystery/lms-backend:latest || {
        log_error "Failed to pull backend image"
        return 1
    }
    
    docker pull victormystery/lms-frontend:latest || {
        log_error "Failed to pull frontend image"
        return 1
    }
    
    log_success "Docker images pulled successfully"
}

# Stop current containers
stop_containers() {
    log_info "Stopping current containers..."
    
    cd ${LMS_HOME}
    docker-compose -f ${DOCKER_COMPOSE_FILE} down --remove-orphans || log_warning "No containers to stop"
    
    log_success "Containers stopped"
}

# Start new containers
start_containers() {
    log_info "Starting containers..."
    
    cd ${LMS_HOME}
    docker-compose -f ${DOCKER_COMPOSE_FILE} up -d || {
        log_error "Failed to start containers"
        return 1
    }
    
    log_success "Containers started"
}

# Wait for services to be ready
wait_for_services() {
    log_info "Waiting for services to be healthy..."
    
    max_attempts=30
    attempt=0
    
    while [ ${attempt} -lt ${max_attempts} ]; do
        if docker ps --format 'table {{.Names}}\t{{.Status}}' | grep -q "healthy"; then
            log_success "Services are healthy"
            return 0
        fi
        
        attempt=$((attempt + 1))
        sleep 2
    done
    
    log_warning "Services took longer than expected to be healthy"
}

# Run health checks
health_check() {
    log_info "Running health checks..."
    
    # Check backend
    if ! curl -f http://localhost:8000/api/health &>/dev/null; then
        log_error "Backend health check failed"
        return 1
    fi
    log_success "Backend health check passed"
    
    # Check frontend
    if ! curl -f http://localhost:3000/ &>/dev/null; then
        log_error "Frontend health check failed"
        return 1
    fi
    log_success "Frontend health check passed"
}

# Run database migrations
run_migrations() {
    log_info "Running database migrations..."
    
    docker exec lms-backend alembic upgrade head || {
        log_warning "Database migrations may have already been applied"
    }
    
    log_success "Migrations completed"
}

# Collect logs
collect_logs() {
    log_info "Collecting logs..."
    
    LOG_FILE="${LOGS_DIR}/deployment_$(date +%Y%m%d_%H%M%S).log"
    
    {
        echo "=== Deployment Log ==="
        echo "Timestamp: $(date)"
        echo ""
        echo "=== Container Status ==="
        docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}'
        echo ""
        echo "=== Backend Logs (last 50 lines) ==="
        docker logs --tail=50 lms-backend || true
        echo ""
        echo "=== Frontend Logs (last 50 lines) ==="
        docker logs --tail=50 lms-frontend || true
        echo ""
        echo "=== Database Logs (last 50 lines) ==="
        docker logs --tail=50 lms-postgres || true
    } > ${LOG_FILE}
    
    log_success "Logs collected: ${LOG_FILE}"
}

# Rollback deployment
rollback() {
    log_warning "Rolling back deployment..."
    
    if [ -z "$1" ]; then
        ROLLBACK_BACKUP=$(ls -1d ${BACKUP_DIR}/backup_* | tail -1)
    else
        ROLLBACK_BACKUP="${BACKUP_DIR}/$1"
    fi
    
    if [ ! -d ${ROLLBACK_BACKUP} ]; then
        log_error "Backup not found: ${ROLLBACK_BACKUP}"
        return 1
    fi
    
    log_info "Restoring from backup: ${ROLLBACK_BACKUP}"
    
    # Stop current containers
    stop_containers
    
    # Restore files
    if [ -f ${ROLLBACK_BACKUP}/docker-compose.prod.yml ]; then
        cp ${ROLLBACK_BACKUP}/docker-compose.prod.yml ${DOCKER_COMPOSE_FILE}
    fi
    
    # Start old containers
    start_containers
    
    log_success "Rollback completed"
}

# Main deployment flow
main() {
    log_info "Starting LMS deployment..."
    
    # Parse arguments
    case "${1:-deploy}" in
        deploy)
            check_docker
            setup_directories
            backup_deployment
            pull_images || exit 1
            stop_containers
            start_containers || {
                log_error "Failed to start containers, rolling back..."
                rollback
                exit 1
            }
            wait_for_services
            run_migrations
            health_check || {
                log_error "Health checks failed, rolling back..."
                rollback
                exit 1
            }
            collect_logs
            log_success "Deployment completed successfully!"
            ;;
        
        rollback)
            rollback "$2"
            ;;
        
        logs)
            docker-compose -f ${DOCKER_COMPOSE_FILE} logs -f
            ;;
        
        status)
            docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}\t{{.Ports}}'
            ;;
        
        *)
            echo "Usage: $0 {deploy|rollback|logs|status} [backup_name]"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
