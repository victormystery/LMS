#!/bin/bash

# AWS EC2 Deployment Script for LMS
# This script automates the deployment of the Library Management System on AWS EC2

set -e  # Exit on error

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
EC2_USER="ubuntu"
EC2_HOST="${EC2_HOST:-your-ec2-instance.amazonaws.com}"
SSH_KEY="${SSH_KEY:-~/.ssh/aws-key.pem}"
APP_DIR="/opt/lms"
BACKUP_DIR="/opt/lms-backups"

# Function to print colored messages
print_message() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

# Function to execute SSH commands
ssh_exec() {
    ssh -i "$SSH_KEY" "$EC2_USER@$EC2_HOST" "$1"
}

# Function to copy files to EC2
scp_copy() {
    scp -i "$SSH_KEY" "$1" "$EC2_USER@$EC2_HOST:$2"
}

# Step 1: Check prerequisites
check_prerequisites() {
    print_message "Checking prerequisites..."
    
    if [ ! -f "$SSH_KEY" ]; then
        print_error "SSH key not found at $SSH_KEY"
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker not found locally. Please install Docker."
        exit 1
    fi
    
    print_message "Prerequisites check passed!"
}

# Step 2: Setup EC2 instance
setup_ec2() {
    print_message "Setting up EC2 instance..."
    
    ssh_exec "sudo apt-get update && sudo apt-get upgrade -y"
    
    # Install Docker
    ssh_exec "curl -fsSL https://get.docker.com -o get-docker.sh && sudo sh get-docker.sh"
    ssh_exec "sudo usermod -aG docker $EC2_USER"
    
    # Install Docker Compose
    ssh_exec "sudo curl -L 'https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)' -o /usr/local/bin/docker-compose"
    ssh_exec "sudo chmod +x /usr/local/bin/docker-compose"
    
    # Create application directory
    ssh_exec "sudo mkdir -p $APP_DIR"
    ssh_exec "sudo chown -R $EC2_USER:$EC2_USER $APP_DIR"
    
    print_message "EC2 instance setup complete!"
}

# Step 3: Create backup
create_backup() {
    print_message "Creating backup of current deployment..."
    
    ssh_exec "mkdir -p $BACKUP_DIR"
    
    BACKUP_NAME="lms-backup-$(date +%Y%m%d-%H%M%S)"
    
    ssh_exec "if [ -d $APP_DIR ]; then sudo tar -czf $BACKUP_DIR/$BACKUP_NAME.tar.gz -C $APP_DIR .; fi"
    
    print_message "Backup created: $BACKUP_NAME.tar.gz"
}

# Step 4: Deploy application
deploy_application() {
    print_message "Deploying application..."
    
    # Copy docker-compose file
    scp_copy "docker-compose.prod.yml" "$APP_DIR/docker-compose.yml"
    
    # Copy environment file
    if [ -f ".env.prod" ]; then
        scp_copy ".env.prod" "$APP_DIR/.env"
    fi
    
    # Copy nginx configuration
    scp_copy "nginx.conf" "$APP_DIR/nginx.conf"
    
    # Copy monitoring configurations
    ssh_exec "mkdir -p $APP_DIR/monitoring"
    scp_copy "monitoring/prometheus.yml" "$APP_DIR/monitoring/"
    scp_copy "monitoring/alerts.yml" "$APP_DIR/monitoring/"
    
    # Pull latest images
    ssh_exec "cd $APP_DIR && docker-compose pull"
    
    print_message "Application files deployed!"
}

# Step 5: Start services
start_services() {
    print_message "Starting services..."
    
    # Stop existing services
    ssh_exec "cd $APP_DIR && docker-compose down || true"
    
    # Start new services
    ssh_exec "cd $APP_DIR && docker-compose up -d"
    
    print_message "Services started!"
}

# Step 6: Health check
health_check() {
    print_message "Performing health check..."
    
    sleep 30  # Wait for services to start
    
    # Check backend health
    if ssh_exec "curl -f http://localhost:8000/api/health"; then
        print_message "Backend health check passed!"
    else
        print_error "Backend health check failed!"
        rollback
        exit 1
    fi
    
    # Check frontend health
    if ssh_exec "curl -f http://localhost"; then
        print_message "Frontend health check passed!"
    else
        print_error "Frontend health check failed!"
        rollback
        exit 1
    fi
}

# Step 7: Rollback function
rollback() {
    print_warning "Rolling back to previous version..."
    
    # Get latest backup
    LATEST_BACKUP=$(ssh_exec "ls -t $BACKUP_DIR/*.tar.gz | head -1")
    
    if [ -n "$LATEST_BACKUP" ]; then
        ssh_exec "sudo tar -xzf $LATEST_BACKUP -C $APP_DIR"
        ssh_exec "cd $APP_DIR && docker-compose down && docker-compose up -d"
        print_warning "Rollback complete!"
    else
        print_error "No backup found for rollback!"
    fi
}

# Step 8: Cleanup old backups
cleanup_backups() {
    print_message "Cleaning up old backups..."
    
    # Keep only last 5 backups
    ssh_exec "cd $BACKUP_DIR && ls -t *.tar.gz | tail -n +6 | xargs -r rm"
    
    # Clean up old Docker images
    ssh_exec "docker image prune -af"
    
    print_message "Cleanup complete!"
}

# Step 9: Configure monitoring
setup_monitoring() {
    print_message "Setting up monitoring..."
    
    # Start Prometheus and Grafana
    ssh_exec "cd $APP_DIR && docker-compose -f docker-compose.yml up -d prometheus grafana"
    
    print_message "Monitoring setup complete!"
    print_message "Grafana available at: http://$EC2_HOST:3001"
    print_message "Prometheus available at: http://$EC2_HOST:9090"
}

# Step 10: Display deployment info
display_info() {
    echo ""
    echo "========================================="
    echo "  Deployment Summary"
    echo "========================================="
    echo "Application URL: http://$EC2_HOST"
    echo "API URL: http://$EC2_HOST:8000"
    echo "Grafana URL: http://$EC2_HOST:3001"
    echo "Prometheus URL: http://$EC2_HOST:9090"
    echo "========================================="
    echo ""
}

# Main deployment flow
main() {
    print_message "Starting deployment to AWS EC2..."
    
    check_prerequisites
    setup_ec2
    create_backup
    deploy_application
    start_services
    health_check
    cleanup_backups
    setup_monitoring
    display_info
    
    print_message "Deployment completed successfully!"
}

# Parse command line arguments
case "${1:-deploy}" in
    deploy)
        main
        ;;
    rollback)
        rollback
        ;;
    health)
        health_check
        ;;
    *)
        echo "Usage: $0 {deploy|rollback|health}"
        exit 1
        ;;
esac
