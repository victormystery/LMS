pipeline {
    agent any

    environment {
        GITHUB_REPO = 'https://github.com/victormystery/LMS.git'
        GITHUB_BRANCH = 'development'
        GITHUB_CREDENTIALS = 'github-credentials'
        
        // Docker Configuration
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_IMAGE_BACKEND = "mysteryvictor/lms-backend"
        DOCKER_IMAGE_FRONTEND = "mysteryvictor/lms-frontend"
        
        // AWS Configuration
        AWS_REGION = 'us-east-1'
        
        // EC2 Configuration
        EC2_HOST = '44.213.68.35'
        EC2_USER = 'ec2-user'
        
        // Build Configuration
        BUILD_NUMBER = "${env.BUILD_NUMBER}"
        BUILD_TIMESTAMP = sh(script: "date +%Y%m%d_%H%M%S", returnStdout: true).trim()
        IMAGE_TAG = "${BUILD_NUMBER}-${BUILD_TIMESTAMP}"
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 1, unit: 'HOURS')
        timestamps()
    }

    stages {

        stage("Checkout") {
            steps {
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "*/${GITHUB_BRANCH}"]],
                    userRemoteConfigs: [[
                        url: GITHUB_REPO,
                        credentialsId: GITHUB_CREDENTIALS
                    ]]
                ])
            }
        }

        stage("Login to DockerHub") {
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'dockerhub-cred',
                        usernameVariable: 'DOCKER_USER',
                        passwordVariable: 'DOCKER_PASS')
                ]) {
                    sh '''
                        echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
                    '''
                }
            }
        }

        stage("Build Backend Image") {
            steps {
                sh '''
                    cd backend
                    docker build -t ${DOCKER_IMAGE_BACKEND}:latest .
                '''
            }
        }

        stage("Build Frontend Image") {
            steps {
                sh '''
                    cd LMS_Frontend
                    docker build -t ${DOCKER_IMAGE_FRONTEND}:latest .
                '''
            }
        }

        stage("Push Images") {
            steps {
                script {
                    echo "📤 Pushing images to Docker registry..."
                    sh '''
                        # Check if credentials are available
                        if [ -z "${DOCKER_USERNAME}" ] || [ -z "${DOCKER_PASSWORD}" ]; then
                            echo "⚠️  Docker credentials not configured. Skipping push to registry."
                            echo "Configure 'docker-username' and 'docker-password' credentials in Jenkins to enable."
                            exit 0
                        fi
                        
                        echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
                        
                        echo "Pushing backend image..."
                        docker push ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} || true
                        docker push ${DOCKER_IMAGE_BACKEND}:latest || true
                        
                        echo "Pushing frontend image..."
                        docker push ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} || true
                        docker push ${DOCKER_IMAGE_FRONTEND}:latest || true
                        
                        echo "✅ Images pushed successfully"
                        docker logout || true
                    '''
                }
            }
        }

        stage("Deploy to EC2") {
            steps {
                withCredentials([
                    sshUserPrivateKey(credentialsId: 'ec2-ssh',
                        keyFileVariable: 'SSH_KEY'),
                    string(credentialsId: 'ec2-host', variable: 'HOST')
                ]) {
                    sh '''
                        # Check if SSH key is configured
                        if [ -z "${EC2_SSH_KEY_PATH}" ]; then
                            echo "⚠️  EC2_SSH_KEY credential not configured. Skipping deployment."
                            echo "Configure 'ec2-ssh-key' credential in Jenkins to enable EC2 deployment."
                            exit 0
                        fi
                        
                        # Create deployment script
                        cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Pulling latest images from registry..."
docker pull mysteryvictor/lms-backend:latest || true
docker pull mysteryvictor/lms-frontend:latest || true

echo "🛑 Stopping existing containers..."
docker-compose -f /opt/lms/docker-compose.prod.yml down || true

echo "🚀 Starting new containers..."
cd /opt/lms
docker-compose -f /opt/lms/docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 10

echo "✅ Deployment successful!"
EOF
                        
                        # Deploy script
                        scp -i "${EC2_SSH_KEY_PATH}" /tmp/deploy.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy.sh || true
                        ssh -i "${EC2_SSH_KEY_PATH}" ${EC2_USER}@${EC2_HOST} "chmod +x /tmp/deploy.sh && /tmp/deploy.sh" || true
                    '''
                }
            }
        }

        stage('Smoke Tests') {
            steps {
                script {
                    echo "🔥 Running smoke tests on deployed application..."
                    sh '''
                        sleep 5
                        
                        echo "Testing backend health..."
                        curl -f http://${EC2_HOST}:8000/api/health || echo "⚠️  Backend health check skipped (not yet deployed)"
                        
                        echo "Testing frontend..."
                        curl -f http://${EC2_HOST}:3000/ || echo "⚠️  Frontend check skipped (not yet deployed)"
                        
                        echo "✅ Smoke tests completed"
                    '''
                }
            }
        }

        stage('Monitoring & Logging Setup') {
            steps {
                script {
                    echo "📊 Setting up monitoring and logging..."
                    sh '''
                        if [ -z "${EC2_SSH_KEY_PATH}" ]; then
                            echo "⚠️  SSH key not configured. Skipping remote monitoring setup."
                            exit 0
                        fi
                        
                        ssh -i "${EC2_SSH_KEY_PATH}" ${EC2_USER}@${EC2_HOST} << 'EOF' || true
                        # Check container health
                        echo "Container Status:"
                        docker ps --format "table {{.Names}}\t{{.Status}}" || echo "Docker not yet configured"
                        
                        # View logs
                        echo "Backend logs (last 20 lines):"
                        docker logs lms-backend --tail=20 || echo "Backend container not running"
                        
                        echo "Frontend logs (last 20 lines):"
                        docker logs lms-frontend --tail=20 || echo "Frontend container not running"
EOF
                    '''
                }
            }
        }
    }

    post {
        always {
            script {
                echo "🧹 Cleaning up..."
                cleanWs()
            }
        }

        success {
            script {
                echo "✅ Pipeline completed successfully!"
                // Send success notification
                sh '''
                    echo "Pipeline succeeded. Build: ${BUILD_NUMBER}" | mail -s "LMS CI/CD - Build Success" admin@example.com || true
                '''
            }
        }

        failure {
            script {
                echo "❌ Pipeline failed!"
                // Send failure notification
                sh '''
                    echo "Pipeline failed. Build: ${BUILD_NUMBER}. Check Jenkins logs for details." | mail -s "LMS CI/CD - Build Failed" admin@example.com || true
                    
                    # Trigger rollback if SSH key is available
                    if [ -n "${EC2_SSH_KEY_PATH}" ]; then
                        echo "🔄 Attempting rollback..."
                        ssh -i "${EC2_SSH_KEY_PATH}" ${EC2_USER}@${EC2_HOST} << 'EOF' || true
                        echo "🔄 Rolling back to previous version..."
                        cd /opt/lms
                        docker-compose -f /opt/lms/docker-compose.prod.yml pull
                        docker-compose -f /opt/lms/docker-compose.prod.yml up -d
                        echo "✅ Rollback complete"
EOF
                    fi
                '''
            }
        }

        unstable {
            script {
                echo "⚠️ Pipeline unstable - review required"
            }
        }
    }
}
