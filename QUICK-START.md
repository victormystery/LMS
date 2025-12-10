# Quick Start Guide - LMS CI/CD Pipeline Setup

## ⚡ 5-Minute Quick Start

### Prerequisites
- AWS EC2 instance running (t3.medium or larger)
- GitHub account with repository access
- Docker Hub account

### Step 1: SSH to EC2 Instance
```bash
ssh -i your-key.pem ec2-user@your-ec2-ip
```

### Step 2: Run Jenkins Setup
```bash
# Clone or download the setup script
curl -o setup-jenkins.sh https://raw.githubusercontent.com/victormystery/LMS/development/scripts/setup-jenkins.sh

# Make it executable
chmod +x setup-jenkins.sh

# Run setup
./setup-jenkins.sh

# Note the Jenkins initial password when setup completes
```

### Step 3: Access Jenkins
1. Open browser: `http://your-ec2-ip:8080`
2. Enter initial password from Step 2
3. Click "Install suggested plugins"
4. Create admin user

### Step 4: Configure Credentials (Jenkins UI)
**Go to: Manage Jenkins → Manage Credentials → Global Credentials**

Create these credentials:
1. **GitHub**
   - Type: Username with password
   - ID: `github-credentials`
   - Username: your GitHub username
   - Password: GitHub Personal Access Token

2. **Docker Hub**
   - Type: Username with password
   - ID: `docker-username`
   - ID: `docker-password`

3. **EC2**
   - Type: Secret text
   - ID: `ec2-host`
   - Secret: your EC2 public IP
   
   - Type: SSH key
   - ID: `ec2-ssh-key`
   - Private key: content of your .pem file

### Step 5: Create Jenkins Pipeline
1. Click "New Item"
2. Name: `LMS-Pipeline`
3. Select "Pipeline"
4. Configure:
   ```
   Build Triggers: ☑ GitHub hook trigger
   
   Pipeline:
   - Definition: Pipeline script from SCM
   - SCM: Git
   - Repository: https://github.com/victormystery/LMS.git
   - Credentials: github-credentials
   - Branch: */development
   - Script Path: Jenkinsfile
   ```
5. Save

### Step 6: Configure GitHub Webhook
1. Go to GitHub repository
2. Settings → Webhooks → Add webhook
3. Payload URL: `http://your-jenkins-ip:8080/github-webhook/`
4. Content type: application/json
5. Click Add webhook

### Step 7: Test Pipeline
```bash
# Push a commit to development branch to trigger pipeline
git push origin development

# Or manually trigger in Jenkins UI
# Click "Build Now" on LMS-Pipeline job
```

## 📊 What Gets Deployed?

When you push code to `development` branch:

1. ✅ Code is checked out
2. 🔍 Code quality analyzed (Python & JavaScript)
3. 🧪 Automated tests run
4. 🐳 Docker images built
5. 📤 Images pushed to Docker Hub
6. 🚀 Deployed to EC2 in Docker containers
7. 🔥 Smoke tests validate deployment
8. 📊 Health checks started

## 🐛 Troubleshooting

### Jenkins won't start?
```bash
# Check Java installation
java -version

# Check Jenkins service
sudo systemctl status jenkins

# View logs
sudo tail -f /var/log/jenkins/jenkins.log
```

### Docker permission denied?
```bash
# Jenkins user needs Docker access
sudo usermod -aG docker jenkins
sudo systemctl restart jenkins
```

### GitHub webhook not triggering?
1. Check Jenkins can be reached from internet: `curl http://your-jenkins-ip:8080`
2. Verify webhook in GitHub (Settings → Webhooks → Recent Deliveries)
3. Check Jenkins logs for errors: `sudo tail -f /var/log/jenkins/jenkins.log`

### Application not deploying?
```bash
# SSH to EC2 and check:
ssh -i your-key.pem ec2-user@your-ec2-ip

# Check Docker containers
docker ps -a

# View logs
docker logs lms-backend
docker logs lms-frontend

# Check disk space
df -h

# Manually deploy
/opt/lms/scripts/deploy.sh deploy
```

## 📋 Useful Jenkins Pipeline Commands

### Trigger Build Manually
```bash
curl -X POST http://jenkins-ip:8080/job/LMS-Pipeline/build \
  --user admin:token
```

### View Build Logs
```bash
# In Jenkins UI: Click job → Click build number → Console Output
```

### Access Application
- **Frontend**: http://your-ec2-ip:3000
- **Backend API**: http://your-ec2-ip:8000/api
- **Nginx (if configured)**: http://your-ec2-ip

## 🔄 Deployment Flow

```
1. Developer commits code to GitHub
        ↓
2. GitHub sends webhook to Jenkins
        ↓
3. Jenkins triggers pipeline:
   - Clones code from GitHub
   - Runs tests and quality checks
   - Builds Docker images
   - Pushes to Docker Hub
   - Deploys to EC2
   - Runs health checks
        ↓
4. Application is live in Docker containers
        ↓
5. Health monitoring continuously checks status
```

## 🚀 Next Steps

1. **Monitor Pipeline**: Go to Jenkins → LMS-Pipeline → Dashboard
2. **Check Deployment**: Visit http://your-ec2-ip:3000
3. **View Logs**: Run `/opt/lms/scripts/deploy.sh logs`
4. **Monitor Health**: Run `/opt/lms/scripts/health-check.sh`

## 📚 Full Documentation

For detailed information, see: `CI-CD-DOCUMENTATION.md`

## ❓ Need Help?

### Common Issues & Solutions

| Issue | Solution |
|-------|----------|
| Pipeline stuck | Check Jenkins logs: `sudo tail -f /var/log/jenkins/jenkins.log` |
| Deployment fails | SSH to EC2 and check: `docker ps -a` and `docker logs` |
| Webhook not triggering | Verify GitHub webhook delivery in repo settings |
| Out of disk space | SSH to EC2 and run: `docker system prune -a` |
| Cannot connect to Jenkins | Check security group allows port 8080 |

## ✅ Verification Checklist

- [ ] Jenkins is running (`http://ec2-ip:8080`)
- [ ] GitHub webhook is configured
- [ ] Docker is installed on EC2
- [ ] Docker Compose is installed on EC2
- [ ] All credentials are created in Jenkins
- [ ] Pipeline job is created and configured
- [ ] First build runs successfully
- [ ] Application is accessible
- [ ] Health monitoring is running

---

**Happy Deploying! 🎉**
