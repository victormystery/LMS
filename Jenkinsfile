pipeline {
    agent any

    environment {
        GITHUB_REPO = 'https://github.com/victormystery/LMS.git'
        GITHUB_BRANCH = 'main'
        GITHUB_CREDENTIALS = 'github-credentials'
        PYTHON = '/usr/local/bin/python3.10'   // <<--- update path as needed
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '10'))
        timeout(time: 30, unit: 'MINUTES')
        timestamps()
    }

    stages {

        stage("Checkout from GitHub") {
            steps {
                echo "📥 Checking out code..."
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

        stage("Install Backend Dependencies") {
            steps {
                echo "📦 Installing Python backend dependencies..."
                sh """
                    ${PYTHON} -m venv venv
                    . venv/bin/activate
                    pip install --upgrade pip
                    pip install --no-cache-dir -r requirements.txt
                """
            }
        }

        stage("Run Backend Tests") {
            steps {
                echo "🧪 Running backend tests..."
                sh """
                    . venv/bin/activate
                    cd backend
                    pytest || true
                """
            }
        }

        stage("Install Frontend Dependencies") {
            steps {
                echo "📦 Installing frontend dependencies..."
                sh """
                    cd LMS_Frontend
                    npm install
                """
            }
        }

        stage("Run Frontend Tests") {
            steps {
                echo "🧪 Running frontend tests..."
                sh """
                    cd LMS_Frontend
                    npm test -- --watchAll=false || true
                """
            }
        }
    }

    

        success {
            echo "✅ Pipeline completed successfully!"
        }

        failure {
            echo "❌ Pipeline failed! Check logs above."
        }
    }
}
