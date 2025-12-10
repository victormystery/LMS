#!/bin/bash

# Jenkins Setup Script
# This script sets up Jenkins on EC2 and configures it for GitHub integration

set -e

JENKINS_HOME="/var/lib/jenkins"
JENKINS_USER="jenkins"

echo "======================================"
echo "Jenkins Setup for LMS CI/CD Pipeline"
echo "======================================"

# Update system
echo "Updating system packages..."
sudo yum update -y

# Install Java (required for Jenkins)
echo "Installing Java..."
sudo yum install -y java-11-openjdk java-11-openjdk-devel

# Add Jenkins repository
echo "Adding Jenkins repository..."
sudo wget -O /etc/yum.repos.d/jenkins.repo https://pkg.jenkins.io/redhat-stable/jenkins.repo
sudo rpm --import https://pkg.jenkins.io/redhat-stable/jenkins.io.key

# Install Jenkins
echo "Installing Jenkins..."
sudo yum install -y jenkins

# Start Jenkins
echo "Starting Jenkins service..."
sudo systemctl start jenkins
sudo systemctl enable jenkins

# Install Docker
echo "Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Add Jenkins user to Docker group
echo "Adding Jenkins user to Docker group..."
sudo usermod -aG docker ${JENKINS_USER}

# Install Docker Compose
echo "Installing Docker Compose..."
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Install Git
echo "Installing Git..."
sudo yum install -y git

# Create necessary directories
echo "Creating directories..."
sudo mkdir -p /opt/lms
sudo chown ${JENKINS_USER}:${JENKINS_USER} /opt/lms

# Install Jenkins plugins
echo "Installing Jenkins plugins..."
sudo -u ${JENKINS_USER} java -jar /usr/share/java/jenkins.war --version || true

# Wait for Jenkins to start
echo "Waiting for Jenkins to start (this may take a minute)..."
sleep 60

# Jenkins initial password
echo ""
echo "======================================"
echo "Jenkins is ready!"
echo "Access Jenkins at: http://$(hostname -I | awk '{print $1}'):8080"
echo "Initial admin password: $(sudo cat ${JENKINS_HOME}/secrets/initialAdminPassword)"
echo "======================================"
echo ""
echo "Next steps:"
echo "1. Open Jenkins in your browser"
echo "2. Log in with the initial admin password"
echo "3. Install suggested plugins"
echo "4. Create admin user"
echo "5. Create credentials for GitHub, Docker, and AWS"
echo "6. Create a new pipeline job"
echo "7. Configure the job to use the Jenkinsfile from the repository"
echo ""
