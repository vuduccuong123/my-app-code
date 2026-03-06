pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:latest
    command:
    - cat
    tty: true
    volumeMounts:
    - mountPath: /var/run/docker.sock
      name: docker-sock
  volumes:
  - name: docker-sock
    hostPath:
      path: /var/run/docker.sock
'''
        }
    }
    
    environment {
        NEXUS_REGISTRY = 'nexus.tudaolw.io.vn'
        REPO_NAME      = 'docker-hosted' 
        IMAGE_NAME     = 'my-node-app'
        // Không dùng https:// ở đây vì sẽ cộng chuỗi ở dưới
        GITOPS_REPO    = 'github.com/vuduccuong123/my-app-gitops.git'
        
        NEXUS_CREDS    = 'nexus-credentials-id'
        GITHUB_CREDS   = 'github-token-id'
    }

    stages {
        stage('Build & Push Image') {
            steps {
                container('docker') {
                    script {
                        def fullImage = "${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}"
                        
                        sh "docker build -t ${fullImage} ."
                        
                        withCredentials([usernamePassword(credentialsId: "${NEXUS_CREDS}", passwordVariable: 'NEXUS_PASS', usernameVariable: 'NEXUS_USER')]) {
                            sh "docker login https://${NEXUS_REGISTRY} -u ${NEXUS_USER} -p ${NEXUS_PASS}"
                            sh "docker push ${fullImage}"
                        }
                    }
                }
            }
        }
        
        stage('Update GitOps Repo') {
            steps {
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CREDS}", passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
                    // Xóa thư mục cũ để clone mới hoàn toàn
                    sh "rm -rf my-app-gitops || true"
                    
                    // 1. Clone sử dụng Token trực tiếp trong URL
                    sh "git clone https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO}"
                    
                    dir('my-app-gitops') {
                        // 2. Sửa file deployment.yaml
                        sh "sed -i 's|image:.*|image: ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}|g' deployment.yaml"
                        
                        // 3. Cấu hình User và Push dùng Token xác thực
                        sh """
                            git config user.email 'jenkins@tudaolw.io.vn'
                            git config user.name 'Jenkins-CI'
                            git add deployment.yaml
                            git commit -m 'Update image version ${BUILD_NUMBER}'
                            
                            # QUAN TRỌNG: Push trực tiếp bằng URL chứa Token để tránh lỗi 403
                            git push https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO} main
                        """
                    }
                }
            }
        }
    }
}