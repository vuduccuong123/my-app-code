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
        GITOPS_REPO    = 'github.com/vuduccuong123/my-app-gitops.git'
        
        NEXUS_CREDS    = 'nexus-credentials-id'
        // Đã đổi sang ID mới theo yêu cầu của bạn
        GITHUB_CREDS   = 'github-token-final' 
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
                    // Xóa sạch để tránh cache git cũ trong workspace
                    sh "rm -rf my-app-gitops || true"
                    
                    // Clone trực tiếp dùng Token mới
                    sh "git clone https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO}"
                    
                    dir('my-app-gitops') {
                        // Sửa file deployment.yaml
                        sh "sed -i 's|image:.*|image: ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}|g' deployment.yaml"
                        
                        sh """
                            git config user.email "jenkins@tudaolw.io.vn"
                            git config user.name "Jenkins-CI"
                            
                            # Xóa mọi cấu hình credential helper nếu có
                            git config --local --unset credential.helper || true
                            
                            git add deployment.yaml
                            git commit -m "Update image version ${BUILD_NUMBER}"
                            
                            # Push ép buộc sử dụng Token mới thông qua URL
                            git push https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO} main
                        """
                    }
                }
            }
        }
    }
}