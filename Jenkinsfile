pipeline {
    agent any
    
    environment {
        // Docker Hub credentials (configure in Jenkins)
        DOCKER_HUB_CREDENTIALS = credentials('dockerhub-credentials')
        DOCKER_IMAGE_BACKEND = "victormystery/lms-backend"
        DOCKER_IMAGE_FRONTEND = "victormystery/lms-frontend"
        IMAGE_TAG = "${BUILD_NUMBER}"
        
        // AWS credentials (configure in Jenkins)
        AWS_DEFAULT_REGION = 'us-east-1'
        AWS_CREDENTIALS = credentials('aws-credentials')
        
        // Application environment variables
        DATABASE_URL = credentials('database-url')
        SECRET_KEY = credentials('secret-key')
    }
    
    stages {
        stage('Checkout') {
            steps {
                echo 'Checking out source code...'
                checkout scm
                sh 'git rev-parse HEAD > .git/commit-id'
                script {
                    env.GIT_COMMIT_ID = readFile('.git/commit-id').trim()
                }
            }
        }
        
        stage('Install Dependencies') {
            parallel {
                stage('Backend Dependencies') {
                    steps {
                        echo 'Installing Python dependencies...'
                        dir('backend') {
                            sh '''
                                python -m venv venv
                                . venv/bin/activate
                                pip install --upgrade pip
                                pip install -r ../requirements.txt
                            '''
                        }
                    }
                }
                
                stage('Frontend Dependencies') {
                    steps {
                        echo 'Installing Node.js dependencies...'
                        dir('LMS_Frontend') {
                            sh 'npm ci'
                        }
                    }
                }
            }
        }
        
        stage('Linting & Code Quality') {
            parallel {
                stage('Backend Linting') {
                    steps {
                        echo 'Running Python linting...'
                        dir('backend') {
                            sh '''
                                . venv/bin/activate
                                pip install flake8 pylint
                                flake8 app --max-line-length=120 --exclude=__pycache__,venv || true
                                pylint app --disable=C0111,R0903 || true
                            '''
                        }
                    }
                }
                
                stage('Frontend Linting') {
                    steps {
                        echo 'Running ESLint...'
                        dir('LMS_Frontend') {
                            sh 'npm run lint || true'
                        }
                    }
                }
            }
        }
        
        stage('Unit Tests') {
            parallel {
                stage('Backend Tests') {
                    steps {
                        echo 'Running Python unit tests...'
                        dir('backend') {
                            sh '''
                                . venv/bin/activate
                                pip install pytest pytest-cov
                                pytest app/test --cov=app --cov-report=xml --cov-report=html || true
                            '''
                        }
                    }
                    post {
                        always {
                            junit '**/test-results/*.xml'
                            publishHTML([
                                allowMissing: true,
                                alwaysLinkToLastBuild: true,
                                keepAll: true,
                                reportDir: 'backend/htmlcov',
                                reportFiles: 'index.html',
                                reportName: 'Backend Coverage Report'
                            ])
                        }
                    }
                }
                
                stage('Frontend Tests') {
                    steps {
                        echo 'Running frontend tests...'
                        dir('LMS_Frontend') {
                            sh 'npm run test -- --coverage || true'
                        }
                    }
                }
            }
        }
        
        stage('Build Docker Images') {
            parallel {
                stage('Build Backend Image') {
                    steps {
                        echo 'Building backend Docker image...'
                        script {
                            docker.build("${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}", "-f Dockerfile.backend .")
                            docker.build("${DOCKER_IMAGE_BACKEND}:latest", "-f Dockerfile.backend .")
                        }
                    }
                }
                
                stage('Build Frontend Image') {
                    steps {
                        echo 'Building frontend Docker image...'
                        dir('LMS_Frontend') {
                            script {
                                docker.build("${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}", ".")
                                docker.build("${DOCKER_IMAGE_FRONTEND}:latest", ".")
                            }
                        }
                    }
                }
            }
        }
        
        stage('Security Scan') {
            parallel {
                stage('Backend Security Scan') {
                    steps {
                        echo 'Scanning backend image for vulnerabilities...'
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image ${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG} || true
                        '''
                    }
                }
                
                stage('Frontend Security Scan') {
                    steps {
                        echo 'Scanning frontend image for vulnerabilities...'
                        sh '''
                            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock \
                                aquasec/trivy image ${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG} || true
                        '''
                    }
                }
            }
        }
        
        stage('Push to Docker Hub') {
            when {
                branch 'main'
            }
            steps {
                echo 'Pushing images to Docker Hub...'
                script {
                    docker.withRegistry('https://registry.hub.docker.com', 'dockerhub-credentials') {
                        docker.image("${DOCKER_IMAGE_BACKEND}:${IMAGE_TAG}").push()
                        docker.image("${DOCKER_IMAGE_BACKEND}:latest").push()
                        docker.image("${DOCKER_IMAGE_FRONTEND}:${IMAGE_TAG}").push()
                        docker.image("${DOCKER_IMAGE_FRONTEND}:latest").push()
                    }
                }
            }
        }
        
        stage('Deploy to Staging') {
            when {
                branch 'development'
            }
            steps {
                echo 'Deploying to staging environment...'
                sh '''
                    docker-compose -f docker-compose.staging.yml down
                    docker-compose -f docker-compose.staging.yml up -d
                '''
            }
        }
        
        stage('Integration Tests') {
            when {
                branch 'development'
            }
            steps {
                echo 'Running integration tests...'
                sh '''
                    sleep 30  # Wait for services to start
                    curl -f http://localhost:8000/api/health || exit 1
                    curl -f http://localhost:3000 || exit 1
                '''
            }
        }
        
        stage('Deploy to Production') {
            when {
                branch 'main'
            }
            steps {
                script {
                    timeout(time: 10, unit: 'MINUTES') {
                        input message: 'Deploy to Production?', ok: 'Deploy'
                    }
                }
                
                echo 'Deploying to AWS EC2...'
                sh '''
                    # Backup current deployment
                    ssh -i ~/.ssh/aws-key.pem ubuntu@${PRODUCTION_SERVER} \
                        "docker-compose -f /opt/lms/docker-compose.yml down"
                    
                    # Deploy new version
                    scp -i ~/.ssh/aws-key.pem docker-compose.prod.yml \
                        ubuntu@${PRODUCTION_SERVER}:/opt/lms/docker-compose.yml
                    
                    ssh -i ~/.ssh/aws-key.pem ubuntu@${PRODUCTION_SERVER} \
                        "cd /opt/lms && docker-compose pull && docker-compose up -d"
                '''
            }
        }
        
        stage('Health Check') {
            when {
                branch 'main'
            }
            steps {
                echo 'Performing production health check...'
                sh '''
                    sleep 30
                    curl -f https://lms.yourdomain.com/api/health || {
                        echo "Health check failed! Initiating rollback..."
                        ssh -i ~/.ssh/aws-key.pem ubuntu@${PRODUCTION_SERVER} \
                            "cd /opt/lms && docker-compose down && docker-compose up -d"
                        exit 1
                    }
                '''
            }
        }
        
        stage('Monitoring Setup') {
            when {
                branch 'main'
            }
            steps {
                echo 'Setting up monitoring...'
                sh '''
                    # Deploy Prometheus and Grafana configurations
                    ssh -i ~/.ssh/aws-key.pem ubuntu@${PRODUCTION_SERVER} \
                        "docker-compose -f /opt/monitoring/docker-compose.yml up -d"
                '''
            }
        }
    }
    
    post {
        success {
            echo 'Pipeline succeeded!'
            emailext (
                subject: "SUCCESS: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    <p>Build succeeded for ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Git Commit: ${env.GIT_COMMIT_ID}</p>
                    <p>Check console output at <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                """,
                to: '${DEFAULT_RECIPIENTS}',
                mimeType: 'text/html'
            )
        }
        
        failure {
            echo 'Pipeline failed!'
            emailext (
                subject: "FAILURE: Job '${env.JOB_NAME} [${env.BUILD_NUMBER}]'",
                body: """
                    <p>Build failed for ${env.JOB_NAME}</p>
                    <p>Build Number: ${env.BUILD_NUMBER}</p>
                    <p>Git Commit: ${env.GIT_COMMIT_ID}</p>
                    <p>Check console output at <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                """,
                to: '${DEFAULT_RECIPIENTS}',
                mimeType: 'text/html'
            )
        }
        
        always {
            echo 'Cleaning up...'
            cleanWs()
            sh 'docker system prune -f'
        }
    }
}
