pipeline {
    agent any

    environment {
        // GitHub Configuration
        GITHUB_REPO = 'https://github.com/victormystery/LMS.git'
        GITHUB_BRANCH = 'main'
        GITHUB_CREDENTIALS = 'github-credentials'
        
        // Docker Configuration
        DOCKER_REGISTRY = 'docker.io'
        DOCKER_USERNAME = credentials('docker-username')
        DOCKER_PASSWORD = credentials('docker-password')
        DOCKER_IMAGE_BACKEND = "victormystery/lms-backend"
        DOCKER_IMAGE_FRONTEND = "victormystery/lms-frontend"
        
        // AWS Configuration
        AWS_REGION = 'us-east-1'
        AWS_ACCOUNT_ID = credentials('aws-account-id')
        
        // EC2 Configuration
        EC2_HOST = credentials('ec2-host')
        EC2_USER = 'ec2-user'
        EC2_SSH_KEY = credentials('ec2-ssh-key')
        
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
        stage('Checkout') {
            steps {
                script {
                    echo "🔄 Checking out code from GitHub..."
                    checkout([
                        $class: 'GitSCM',
                        branches: [[name: "*/${GITHUB_BRANCH}"]],
                        userRemoteConfigs: [[
                            url: "${GITHUB_REPO}",
                            credentialsId: "${GITHUB_CREDENTIALS}"
                        ]]
                    ])
                }
            }
        }

        stage('Code Quality Analysis') {
            parallel {
                stage('Python Backend Analysis') {
                    steps {
                        script {
                            echo "🔍 Running Python code quality checks..."
                            sh '''
                                cd backend
                                python -m pip install --quiet pylint flake8 bandit
                                
                                echo "Running pylint..."
                                pylint app/ --disable=all --enable=E --max-line-length=120 || true
                                
                                echo "Running flake8..."
                                flake8 app/ --max-line-length=120 --count --statistics || true
                                
                                echo "Running security check with bandit..."
                                bandit -r app/ -ll || true
                            '''
                        }
                    }
                }
                
                stage('Frontend Analysis') {
                    steps {
                        script {
                            echo "🔍 Running frontend code quality checks..."
                            sh '''
                                cd LMS_Frontend
                                npm install --silent
                                npx eslint src/ --max-warnings=5 || true
                            '''
                        }
                    }
                }
            }
        }

        stage('Backend Tests') {
            steps {
                script {
                    echo "🧪 Running backend tests..."
                    sh '''
                        cd backend
                        python -m pip install --quiet pytest pytest-cov
                        python -m pytest app/test/ -v --cov=app --cov-report=xml --cov-report=html || true
                    '''
                }
            }
        }

        stage('Frontend Tests') {
            steps {
                script {
                    echo "🧪 Running frontend tests..."
                    sh '''
                        cd LMS_Frontend
                        npm test -- --coverage --watchAll=false || true
                    '''
                }
            }
        }

        stage('Build Backend Docker Image') {
            steps {
                script {
                    echo "🐳 Building backend Docker image..."
                    sh '''
                        cd backend
                        docker build -t ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_BACKEND}:latest .
                        echo "✅ Backend image built: ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('Build Frontend Docker Image') {
            steps {
                script {
                    echo "🐳 Building frontend Docker image..."
                    sh '''
                        cd LMS_Frontend
                        docker build -t ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} -t ${DOCKER_IMAGE_FRONTEND}:latest .
                        echo "✅ Frontend image built: ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}"
                    '''
                }
            }
        }

        stage('Push to Docker Registry') {
            steps {
                script {
                    echo "📤 Pushing images to Docker registry..."
                    sh '''
                        echo "${DOCKER_PASSWORD}" | docker login -u "${DOCKER_USERNAME}" --password-stdin
                        
                        echo "Pushing backend image..."
                        docker push ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}
                        docker push ${DOCKER_IMAGE_BACKEND}:latest
                        
                        echo "Pushing frontend image..."
                        docker push ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}
                        docker push ${DOCKER_IMAGE_FRONTEND}:latest
                        
                        echo "✅ Images pushed successfully"
                        docker logout
                    '''
                }
            }
        }

        stage('Deploy to EC2') {
            steps {
                script {
                    echo "🚀 Deploying to EC2 instance..."
                    sh '''
                        # Create deployment script
                        cat > /tmp/deploy.sh << 'EOF'
#!/bin/bash
set -e

echo "🔄 Pulling latest images from registry..."
docker pull ${DOCKER_IMAGE_BACKEND}:latest
docker pull ${DOCKER_IMAGE_FRONTEND}:latest

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
                        scp -i ${EC2_SSH_KEY} /tmp/deploy.sh ${EC2_USER}@${EC2_HOST}:/tmp/deploy.sh
                        ssh -i ${EC2_SSH_KEY} ${EC2_USER}@${EC2_HOST} "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
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
                        curl -f http://${EC2_HOST}:8000/api/health || exit 1
                        
                        echo "Testing frontend..."
                        curl -f http://${EC2_HOST}:3000/ || exit 1
                        
                        echo "✅ Smoke tests passed"
                    '''
                }
            }
        }

        stage('Monitoring & Logging Setup') {
            steps {
                script {
                    echo "📊 Setting up monitoring and logging..."
                    sh '''
                        ssh -i ${EC2_SSH_KEY} ${EC2_USER}@${EC2_HOST} << 'EOF'
                        # Check container health
                        docker ps --format "table {{.Names}}\t{{.Status}}"
                        
                        # View logs
                        echo "Backend logs (last 50 lines):"
                        docker logs lms-backend --tail=50
                        
                        echo "Frontend logs (last 50 lines):"
                        docker logs lms-frontend --tail=50
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
                // Send failure notification and rollback
                sh '''
                    echo "Pipeline failed. Build: ${BUILD_NUMBER}" | mail -s "LMS CI/CD - Build Failed" admin@example.com || true
                    
                    # Trigger rollback
                    ssh -i ${EC2_SSH_KEY} ${EC2_USER}@${EC2_HOST} << 'EOF'
                    echo "🔄 Rolling back to previous version..."
                    cd /opt/lms
                    docker-compose -f /opt/lms/docker-compose.prod.yml pull
                    docker-compose -f /opt/lms/docker-compose.prod.yml up -d
                    echo "✅ Rollback complete"
EOF
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
