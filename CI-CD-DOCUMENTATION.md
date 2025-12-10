# LMS CI/CD Pipeline Documentation

## Overview

This document describes the complete CI/CD pipeline for the Library Management System (LMS) using Jenkins, GitHub, Docker, and AWS EC2.

## Architecture

```
GitHub (Source Code)
    ↓
Jenkins (CI/CD Orchestration)
    ├─→ Code Quality Analysis (pylint, flake8, ESLint)
    ├─→ Automated Testing (pytest, Jest)
    ├─→ Docker Image Build (Backend & Frontend)
    ├─→ Docker Registry Push (Docker Hub)
    └─→ EC2 Deployment (Docker Compose)
        ├─→ Health Checks
        ├─→ Database Migrations
        └─→ Monitoring & Logging
```

## Prerequisites

### Required Tools
- Jenkins 2.350+
- Docker 20.10+
- Docker Compose 1.29+
- Git 2.30+
- GitHub Account with repository access

### Required Accounts
- Docker Hub account
- AWS Account (for EC2 instance)
- GitHub account with SSH key configured

### EC2 Instance Requirements
- **OS**: Amazon Linux 2 or Ubuntu 20.04+
- **Instance Type**: t3.medium or larger
- **Storage**: 30GB EBS volume
- **Security Groups**: Allow ports 80, 443, 8000, 3000

## Setup Instructions

### 1. Prepare EC2 Instance

```bash
# Connect to your EC2 instance
ssh -i your-key.pem ec2-user@your-ec2-ip

# Run the Jenkins setup script
curl -o setup-jenkins.sh https://raw.githubusercontent.com/victormystery/LMS/development/scripts/setup-jenkins.sh
chmod +x setup-jenkins.sh
./setup-jenkins.sh

# Create LMS directory
sudo mkdir -p /opt/lms
sudo chown ec2-user:ec2-user /opt/lms
```

### 2. Configure Jenkins

1. **Access Jenkins**
   - Open `http://your-ec2-ip:8080` in your browser
   - Use the initial admin password from the setup script

2. **Install Plugins**
   - Go to Manage Jenkins → Manage Plugins
   - Install these plugins:
     - GitHub Integration
     - Docker Pipeline
     - Docker Commons
     - Pipeline: Aggregated Log
     - Email Extension Plugin

3. **Create Credentials**
   ```
   Manage Jenkins → Manage Credentials → Add Credentials
   ```
   
   **GitHub Credentials**
   - Type: Username with password
   - Username: your-github-username
   - Password: your-github-personal-access-token (with repo scope)
   - ID: github-credentials
   
   **Docker Credentials**
   - Type: Username with password
   - Username: your-docker-username
   - Password: your-docker-password
   - ID: docker-username & docker-password
   
   **EC2 Credentials**
   - Type: SSH Username with private key
   - Username: ec2-user
   - Private key: content of your EC2 key pair
   - ID: ec2-ssh-key
   
   **EC2 Host**
   - Type: Secret text
   - Secret: your-ec2-public-ip
   - ID: ec2-host
   
   **AWS Account ID**
   - Type: Secret text
   - Secret: your-aws-account-id
   - ID: aws-account-id

4. **Configure GitHub Webhook**
   - Go to your GitHub repository → Settings → Webhooks
   - Add webhook:
     - Payload URL: `http://your-jenkins-ip:8080/github-webhook/`
     - Content type: application/json
     - Events: Push events

### 3. Create Jenkins Pipeline Job

1. **Create New Item**
   - Click "New Item"
   - Enter name: "LMS-Pipeline"
   - Select "Pipeline"
   - Click OK

2. **Configure Pipeline**
   ```
   Build Triggers:
   ☑ GitHub hook trigger for GITScm polling
   
   Pipeline:
   Definition: Pipeline script from SCM
   SCM: Git
   Repository URL: https://github.com/victormystery/LMS.git
   Credentials: github-credentials
   Branch Specifier: */development
   Script Path: Jenkinsfile
   ```

3. **Save and Build**

## Pipeline Stages Explained

### Stage 1: Checkout
- Clones the repository from GitHub
- Checks out the specified branch (development)

### Stage 2: Code Quality Analysis
- **Backend**: Runs pylint, flake8, and bandit
- **Frontend**: Runs ESLint with warnings limit
- Identifies code smells and security issues

### Stage 3: Testing
- **Backend**: Runs pytest with coverage report
- **Frontend**: Runs Jest tests
- Generates coverage reports

### Stage 4: Docker Build
- Builds Docker images for backend and frontend
- Tags with build number and timestamp
- Uses multi-stage builds for optimization

### Stage 5: Docker Push
- Authenticates with Docker Registry
- Pushes images with multiple tags
- Updates "latest" tag

### Stage 6: Deploy to EC2
- SSHs to EC2 instance
- Pulls latest Docker images
- Stops old containers
- Starts new containers with docker-compose

### Stage 7: Smoke Tests
- Tests backend health endpoint
- Tests frontend availability
- Validates deployment success

### Stage 8: Monitoring Setup
- Displays container status
- Collects and displays logs
- Generates health report

## Deployment Process

### Normal Deployment Flow
```
1. Developer pushes to GitHub (development branch)
2. GitHub webhook triggers Jenkins
3. Jenkins executes pipeline:
   - Pull code
   - Run quality checks
   - Run tests
   - Build Docker images
   - Push to Docker Hub
   - Deploy to EC2
   - Run smoke tests
4. Application is live
```

### Rollback Process
If deployment fails:
1. Automatic rollback is triggered
2. Previous stable version is restored
3. Alert email is sent to admin
4. Manual rollback available via script

## Health Monitoring

### Automated Health Checks
```bash
# Start health monitoring
sudo /opt/lms/scripts/health-check.sh &

# Or as a systemd service
sudo systemctl start lms-health-check
```

### Health Check Parameters
- **Interval**: 60 seconds
- **Failure Threshold**: 3 consecutive failures
- **Monitored Services**:
  - Backend API (/api/health)
  - Frontend (port 3000)
  - Database (PostgreSQL)
  - Docker containers
  - Disk space
  - Memory usage

### Alerts
Alerts are sent via email when:
- Service becomes unavailable
- Health checks fail 3+ times
- Disk usage exceeds 90%
- Memory usage exceeds 80%

## Scaling and Performance

### Horizontal Scaling
```bash
# Run multiple backend instances
cd /opt/lms
docker-compose -f docker-compose.prod.yml up -d --scale backend=3
```

### Load Balancing
Nginx automatically distributes traffic:
- Rate limiting: 10 req/s general, 30 req/s API
- Connection pooling: 32 keepalive connections
- Gzip compression for faster delivery

### Performance Monitoring
```bash
# View container stats
docker stats

# View Nginx metrics
curl http://localhost/stats

# Check application logs
docker logs -f lms-backend
docker logs -f lms-frontend
```

## Security

### Security Features Implemented
1. **SSL/TLS**: HTTPS with TLS 1.2+
2. **Authentication**: JWT-based API authentication
3. **Authorization**: Role-based access control
4. **Container Security**: Non-root user execution
5. **Network**: Docker custom network isolation
6. **Secrets**: Environment variable management
7. **Scanning**: Bandit security scanning in pipeline

### Security Best Practices
- Store secrets in Jenkins credentials
- Use SSH keys for EC2 access
- Enable Docker Content Trust
- Regular security updates
- Monitor access logs

## Troubleshooting

### Jenkins Connection Issues
```bash
# Check Jenkins logs
tail -f /var/log/jenkins/jenkins.log

# Restart Jenkins
sudo systemctl restart jenkins

# Check Jenkins process
ps aux | grep jenkins
```

### Docker Issues
```bash
# View Docker logs
docker logs <container-name>

# Inspect container
docker inspect <container-name>

# Clean up
docker system prune -a
```

### Network Issues
```bash
# Test backend connectivity
curl -v http://localhost:8000/api/health

# Test frontend connectivity
curl -v http://localhost:3000

# Check network
docker network inspect lms-network
```

### Database Connection Issues
```bash
# Connect to database
docker exec -it lms-postgres psql -U lms_user -d lms_db

# View database logs
docker logs lms-postgres

# Backup database
docker exec lms-postgres pg_dump -U lms_user lms_db > backup.sql
```

## Maintenance

### Regular Tasks
- **Daily**: Monitor logs and alerts
- **Weekly**: Review pipeline execution reports
- **Monthly**: Update dependencies and security patches
- **Quarterly**: Capacity planning and performance review

### Backup Strategy
- Automatic backups before each deployment
- Database backups stored in `/opt/lms/backups`
- Static files backed up with deployment
- Retention: 5 most recent backups

### Cleanup
```bash
# Remove old backups
find /opt/lms/backups -mtime +30 -delete

# Clean Docker images
docker image prune -a

# Clean Docker volumes
docker volume prune
```

## Cost Optimization

### AWS Cost Saving Tips
1. **Instance Right-Sizing**: Use t3.medium for typical loads
2. **Auto-Scaling**: Scale down during off-peak hours
3. **Storage**: Use EBS gp3 for better price/performance
4. **Data Transfer**: Minimize inter-region traffic
5. **Reserved Instances**: For predictable workloads

### Pipeline Optimization
- Cache Docker layers for faster builds
- Parallel test execution
- Smart notification (only on failure)

## Support and Resources

### Documentation
- [Jenkins Documentation](https://www.jenkins.io/doc/)
- [Docker Documentation](https://docs.docker.com/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)

### Getting Help
- GitHub Issues: Report bugs and feature requests
- Jenkins Community: Jenkins-users mailing list
- Docker Community: Docker Community Forums

## Appendix

### Environment Variables
```bash
DATABASE_URL=postgresql://lms_user:lms_password@postgres:5432/lms_db
SECRET_KEY=your-secret-key-change-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
ENVIRONMENT=production
VITE_API_URL=http://backend:8000/api
```

### Useful Commands
```bash
# Deploy
/opt/lms/scripts/deploy.sh deploy

# Rollback
/opt/lms/scripts/deploy.sh rollback backup_20231215_143022

# View logs
/opt/lms/scripts/deploy.sh logs

# Check status
/opt/lms/scripts/deploy.sh status

# Health check
/opt/lms/scripts/health-check.sh
```

---

**Last Updated**: December 2024
**Version**: 1.0
**Maintained By**: DevOps Team
