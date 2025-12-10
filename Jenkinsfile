pipeline {
    agent any

    environment {
        GITHUB_REPO = 'https://github.com/victormystery/LMS.git'
        GITHUB_BRANCH = 'main'
        GITHUB_CREDENTIALS = 'github-credentials'

        DOCKER_IMAGE_BACKEND = "victormystery/lms-backend"
        DOCKER_IMAGE_FRONTEND = "victormystery/lms-frontend"

        AWS_REGION = 'us-east-1'
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
                sh '''
                    docker push ${DOCKER_IMAGE_BACKEND}:latest
                    docker push ${DOCKER_IMAGE_FRONTEND}:latest
                '''
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
                        scp -o StrictHostKeyChecking=no -i $SSH_KEY deploy.sh ec2-user@$HOST:/tmp/deploy.sh
                        ssh -o StrictHostKeyChecking=no -i $SSH_KEY ec2-user@$HOST "chmod +x /tmp/deploy.sh && /tmp/deploy.sh"
                    '''
                }
            }
        }
    }
}
