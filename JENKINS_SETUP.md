# Jenkins CI/CD Pipeline Setup Guide for Library Management System

## Prerequisites

### 1. Jenkins Server Setup
- Jenkins 2.x or higher
- Docker installed on Jenkins server
- Docker Compose installed
- Git installed

### 2. Required Jenkins Plugins
Install the following plugins via Jenkins > Manage Jenkins > Manage Plugins:

```
- Git Plugin
- Docker Plugin
- Docker Pipeline Plugin
- Pipeline Plugin
- Blue Ocean (optional, for better UI)
- Email Extension Plugin
- HTML Publisher Plugin
- JUnit Plugin
- Credentials Binding Plugin
```

## Step 1: Configure Jenkins Credentials

### 1.1 Docker Hub Credentials
1. Go to Jenkins > Manage Jenkins > Manage Credentials
2. Click on "Global" domain
3. Click "Add Credentials"
4. Select "Username with password"
   - **ID**: `dockerhub-credentials`
   - **Username**: Your Docker Hub username
   - **Password**: Your Docker Hub password/token

### 1.2 AWS Credentials
1. Add new credentials
2. Select "Secret text" or "AWS Credentials"
   - **ID**: `aws-credentials`
   - **Access Key ID**: Your AWS Access Key
   - **Secret Access Key**: Your AWS Secret Key

### 1.3 Database URL
1. Add new credentials
2. Select "Secret text"
   - **ID**: `database-url`
   - **Secret**: `postgresql://user:password@host:5432/dbname`

### 1.4 Secret Key
1. Add new credentials
2. Select "Secret text"
   - **ID**: `secret-key`
   - **Secret**: Your application secret key

### 1.5 SSH Key for EC2
1. Add new credentials
2. Select "SSH Username with private key"
   - **ID**: `ec2-ssh-key`
   - **Username**: `ubuntu`
   - **Private Key**: Paste your AWS EC2 private key

## Step 2: Create Jenkins Pipeline Job

### 2.1 New Pipeline Job
1. Click "New Item" in Jenkins
2. Enter name: `LMS-CI-CD-Pipeline`
3. Select "Pipeline"
4. Click "OK"

### 2.2 Configure Pipeline
1. **General Tab**:
   - ✅ GitHub project: `https://github.com/victormystery/LMS`
   - ✅ Discard old builds: Keep last 10 builds

2. **Build Triggers**:
   - ✅ GitHub hook trigger for GITScm polling
   - ✅ Poll SCM: `H/5 * * * *` (every 5 minutes)

3. **Pipeline Tab**:
   - **Definition**: Pipeline script from SCM
   - **SCM**: Git
   - **Repository URL**: `https://github.com/victormystery/LMS.git`
   - **Credentials**: Add GitHub credentials
   - **Branches to build**: `*/development` and `*/main`
   - **Script Path**: `Jenkinsfile`

4. Click "Save"

## Step 3: Configure GitHub Webhook

### 3.1 GitHub Repository Settings
1. Go to your GitHub repository
2. Click "Settings" > "Webhooks" > "Add webhook"
3. **Payload URL**: `http://your-jenkins-server:8080/github-webhook/`
4. **Content type**: `application/json`
5. **Events**: Select "Just the push event"
6. Click "Add webhook"

## Step 4: Configure Email Notifications

### 4.1 Jenkins Email Configuration
1. Go to Jenkins > Manage Jenkins > Configure System
2. Scroll to "Extended E-mail Notification"
3. Configure SMTP server settings:
   ```
   SMTP server: smtp.gmail.com
   SMTP port: 587
   Use SSL: No
   Use TLS: Yes
   Credentials: Add Gmail credentials
   Default Recipients: your-email@example.com
   ```

## Step 5: Set Environment Variables

### 5.1 Jenkins Global Properties
1. Go to Jenkins > Manage Jenkins > Configure System
2. Scroll to "Global properties"
3. Check "Environment variables"
4. Add the following:
   ```
   PRODUCTION_SERVER=your-ec2-ip-or-domain
   DEFAULT_RECIPIENTS=your-email@example.com
   AWS_DEFAULT_REGION=us-east-1
   ```

## Step 6: AWS EC2 Setup

### 6.1 Launch EC2 Instance
```bash
# Instance type: t2.medium or larger
# AMI: Ubuntu 22.04 LTS
# Security Group Rules:
- Port 22 (SSH) - Your IP
- Port 80 (HTTP) - 0.0.0.0/0
- Port 443 (HTTPS) - 0.0.0.0/0
- Port 8000 (Backend) - 0.0.0.0/0
- Port 3001 (Grafana) - Your IP
- Port 9090 (Prometheus) - Your IP
```

### 6.2 SSH into EC2 and Install Dependencies
```bash
# Update system
sudo apt-get update && sudo apt-get upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker ubuntu

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Create application directory
sudo mkdir -p /opt/lms
sudo chown -R ubuntu:ubuntu /opt/lms
```

### 6.3 Copy SSH Key to Jenkins
```bash
# On your local machine
cat ~/.ssh/aws-key.pem

# Copy the content and add to Jenkins credentials (ec2-ssh-key)
```

## Step 7: Test Pipeline

### 7.1 Manual Build
1. Go to your pipeline job
2. Click "Build Now"
3. Watch the build progress in Blue Ocean or Console Output

### 7.2 Verify Stages
The pipeline will execute these stages:
1. ✅ Checkout - Pull code from GitHub
2. ✅ Install Dependencies - Backend and Frontend
3. ✅ Linting & Code Quality - Flake8, Pylint, ESLint
4. ✅ Unit Tests - pytest and npm test
5. ✅ Build Docker Images - Backend and Frontend
6. ✅ Security Scan - Trivy vulnerability scanning
7. ✅ Push to Docker Hub - On main branch only
8. ✅ Deploy to Staging - On development branch
9. ✅ Integration Tests - API health checks
10. ✅ Deploy to Production - Manual approval on main branch
11. ✅ Health Check - Verify deployment
12. ✅ Monitoring Setup - Prometheus and Grafana

## Step 8: Monitoring Setup

### 8.1 Access Grafana
```
URL: http://your-ec2-ip:3001
Username: admin
Password: admin (change on first login)
```

### 8.2 Import Dashboard
1. Login to Grafana
2. Click "+" > "Import"
3. Enter dashboard ID: `1860` (Node Exporter Full)
4. Select Prometheus data source
5. Click "Import"

### 8.3 Access Prometheus
```
URL: http://your-ec2-ip:9090
```

## Step 9: Deployment Process

### 9.1 Development Branch (Auto-Deploy to Staging)
```bash
git checkout development
git add .
git commit -m "Feature: Add new functionality"
git push origin development
# Jenkins automatically deploys to staging
```

### 9.2 Production Branch (Manual Approval)
```bash
git checkout main
git merge development
git push origin main
# Jenkins builds and waits for manual approval
# Click "Deploy" in Jenkins UI
# Deployment proceeds after approval
```

## Step 10: Rollback Process

### 10.1 Manual Rollback via Jenkins
1. Go to previous successful build
2. Click "Replay"
3. Or use the deployment script:

```bash
ssh -i ~/.ssh/aws-key.pem ubuntu@your-ec2-ip
cd /opt/lms
./deploy-ec2.sh rollback
```

### 10.2 Automatic Rollback
- If health check fails after deployment, pipeline automatically rolls back
- Previous version is restored from backup
- Email notification sent

## Troubleshooting

### Common Issues

**1. Docker permission denied**
```bash
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

**2. GitHub webhook not triggering**
- Check webhook delivery in GitHub Settings
- Verify Jenkins URL is accessible from internet
- Check firewall rules

**3. Build failing on tests**
- Review test output in Jenkins console
- Run tests locally: `pytest backend/app/test`
- Check test coverage reports

**4. Docker image push fails**
- Verify Docker Hub credentials
- Check network connectivity
- Ensure enough disk space

**5. EC2 deployment fails**
- Verify SSH key permissions: `chmod 400 ~/.ssh/aws-key.pem`
- Check EC2 security group rules
- Verify Docker is running on EC2

## Maintenance

### Daily Tasks
- Monitor build status
- Check Grafana dashboards
- Review error logs

### Weekly Tasks
- Clean up old Docker images
- Review and optimize pipeline
- Update dependencies

### Monthly Tasks
- Security updates
- Performance optimization
- Backup verification

## Security Best Practices

1. **Credentials Management**
   - Never commit credentials to Git
   - Use Jenkins credentials store
   - Rotate credentials regularly

2. **Docker Images**
   - Scan for vulnerabilities with Trivy
   - Use official base images
   - Keep images updated

3. **EC2 Security**
   - Use Security Groups properly
   - Enable CloudWatch monitoring
   - Regular security patches

4. **Pipeline Security**
   - Limit pipeline permissions
   - Use separate staging/production environments
   - Implement approval gates

## Performance Optimization

1. **Pipeline Speed**
   - Use Docker layer caching
   - Parallelize independent stages
   - Optimize test execution

2. **Resource Usage**
   - Monitor Jenkins memory usage
   - Clean up workspace after builds
   - Use ephemeral agents when possible

## Support and Resources

- Jenkins Documentation: https://www.jenkins.io/doc/
- Docker Documentation: https://docs.docker.com/
- AWS EC2 Documentation: https://docs.aws.amazon.com/ec2/
- Pipeline Syntax: https://www.jenkins.io/doc/book/pipeline/syntax/

---

**Last Updated**: December 2025
**Version**: 1.0
