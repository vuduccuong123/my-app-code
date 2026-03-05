pipeline {
    agent any
    environment {
        // 1. Khai báo thông tin Nexus
        NEXUS_REGISTRY = 'nexus.tudaolw.io.vn'
        REPO_NAME      = 'docker-hosted' 
        IMAGE_NAME     = 'my-node-app'
        
        // 2. Khai báo repo GitOps để Jenkins nhảy sang sửa file
        GITOPS_REPO    = 'github.com/vuduccuong123/my-app-gitops.git'
        
        // 3. ID các chìa khóa đã tạo trong Jenkins
        NEXUS_CREDS    = 'nexus-credentials-id'
        GITHUB_CREDS   = 'github-token-id'
    }
    stages {
        stage('Build Image') {
            steps {
                script {
                    // Lệnh tạo image từ Dockerfile
                    sh "docker build -t ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER} ."
                }
            }
        }
        stage('Push to Nexus') {
            steps {
                script {
                    // Lệnh login và đẩy lên kho Nexus
                    docker.withRegistry("https://${NEXUS_REGISTRY}", "${NEXUS_CREDS}") {
                        sh "docker push ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}"
                    }
                }
            }
        }
        stage('Update GitOps Repo') {
            steps {
                // Bước này Jenkins dùng Token để sửa file deployment.yaml bên repo GitOps
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CREDS}", passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
                    sh "rm -rf my-app-gitops"
                    sh "git clone https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO}"
                    dir('my-app-gitops') {
                        // Sửa tag image cũ thành tag mới vừa build
                        sh "sed -i 's|image:.*|image: ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}|g' deployment.yaml"
                        sh """
                            git config user.email "jenkins@tudaolw.io.vn"
                            git config user.name "Jenkins CI"
                            git add deployment.yaml
                            git commit -m 'Update image version to ${BUILD_NUMBER}'
                            git push origin main
                        """
                    }
                }
            }
        }
    }
}