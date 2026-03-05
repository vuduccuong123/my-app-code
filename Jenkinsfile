pipeline {
    agent {
        kubernetes {
            yaml '''
apiVersion: v1
kind: Pod
spec:
  containers:
  - name: docker
    image: docker:24.0.6-dind-alpine
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
        GITHUB_CREDS   = 'github-token-id'
    }

    stages {
        stage('Build & Push') {
            steps {
                // Bắt buộc phải bọc trong container('docker') để dùng được lệnh docker
                container('docker') {
                    script {
                        def fullImage = "${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}"
                        sh "docker build -t ${fullImage} ."
                        
                        docker.withRegistry("https://${NEXUS_REGISTRY}", "${NEXUS_CREDS}") {
                            sh "docker push ${fullImage}"
                        }
                    }
                }
            }
        }
        stage('Update GitOps') {
            steps {
                // Bước này không cần docker, chạy ở container mặc định cũng được
                withCredentials([usernamePassword(credentialsId: "${GITHUB_CREDS}", passwordVariable: 'GIT_PASS', usernameVariable: 'GIT_USER')]) {
                    sh "rm -rf my-app-gitops || true"
                    sh "git clone https://${GIT_USER}:${GIT_PASS}@${GITOPS_REPO}"
                    dir('my-app-gitops') {
                        sh "sed -i 's|image:.*|image: ${NEXUS_REGISTRY}/${REPO_NAME}/${IMAGE_NAME}:${BUILD_NUMBER}|g' deployment.yaml"
                        sh """
                            git config user.email "jenkins@tudaolw.io.vn"
                            git config user.name "Jenkins-CI"
                            git add deployment.yaml
                            git commit -m "Update image version ${BUILD_NUMBER}"
                            git push origin main
                        """
                    }
                }
            }
        }
    }
}