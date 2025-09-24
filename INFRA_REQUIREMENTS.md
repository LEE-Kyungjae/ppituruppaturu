# pp-infra에서 설치해야 할 필수 도구들

## Docker & Container Runtime

### Docker Engine
```bash
# Docker 최신 버전 설치
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 사용자를 docker 그룹에 추가
sudo usermod -aG docker $USER

# Docker 서비스 활성화
sudo systemctl enable docker
sudo systemctl start docker
```

### Docker Compose
```bash
# Docker Compose v2 설치 (최신 버전)
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 또는 Docker Compose v2 (plugin 방식)
sudo apt-get update
sudo apt-get install docker-compose-plugin
```

### Docker Buildx (멀티플랫폼 빌드용)
```bash
# Buildx는 최신 Docker에 기본 포함
# 확인: docker buildx version

# 만약 없다면:
docker buildx create --name multiarch --driver docker-container --use
docker buildx inspect --bootstrap
```

## 시스템 유틸리티

### 기본 도구들
```bash
# 네트워크 & 모니터링 도구
sudo apt-get install -y \
  curl \
  wget \
  git \
  unzip \
  htop \
  tree \
  jq \
  net-tools \
  lsof \
  nc \
  telnet
```

### 로그 관리
```bash
# Logrotate 설정 (Docker 로그 관리용)
sudo apt-get install -y logrotate

# Docker 로그 크기 제한 설정
sudo tee /etc/docker/daemon.json <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker
```

## 보안 도구

### Fail2Ban (SSH 보안)
```bash
sudo apt-get install -y fail2ban

# 기본 설정
sudo tee /etc/fail2ban/jail.local <<EOF
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
EOF

sudo systemctl enable fail2ban
sudo systemctl start fail2ban
```

### UFW 방화벽
```bash
sudo ufw --force enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# SSH 포트 (22)
sudo ufw allow ssh

# HTTP/HTTPS (Nginx에서 프록시)
sudo ufw allow 80
sudo ufw allow 443

# 애플리케이션 포트 (내부 전용)
sudo ufw allow from 10.0.0.0/8 to any port 3000  # Frontend
sudo ufw allow from 10.0.0.0/8 to any port 8080  # Backend API
sudo ufw allow from 10.0.0.0/8 to any port 8082  # WebSocket
sudo ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis

sudo ufw reload
```

## 웹 서버 (Reverse Proxy)

### Nginx
```bash
sudo apt-get install -y nginx

# Nginx 자동 시작 설정
sudo systemctl enable nginx
sudo systemctl start nginx
```

### Let's Encrypt (SSL 인증서)
```bash
sudo apt-get install -y certbot python3-certbot-nginx

# SSL 인증서 발급 (도메인 설정 후)
# sudo certbot --nginx -d ppituruppaturu.com -d www.ppituruppaturu.com
```

## 모니터링 & 로깅

### 시스템 모니터링
```bash
# htop, iostat 등 기본 도구들
sudo apt-get install -y sysstat iotop

# Docker 모니터링을 위한 ctop (선택사항)
sudo wget https://github.com/bcicen/ctop/releases/download/v0.7.7/ctop-0.7.7-linux-amd64 -O /usr/local/bin/ctop
sudo chmod +x /usr/local/bin/ctop
```

## 디렉토리 구조

### 애플리케이션 디렉토리
```bash
# 배포 디렉토리 생성
sudo mkdir -p /opt/ppituru
sudo chown ubuntu:ubuntu /opt/ppituru

# 로그 디렉토리
sudo mkdir -p /var/log/ppituru
sudo chown ubuntu:ubuntu /var/log/ppituru

# 백업 디렉토리
sudo mkdir -p /opt/backups
sudo chown ubuntu:ubuntu /opt/backups
```

### Docker 데이터 볼륨 위치
```bash
# Docker 볼륨 데이터 확인
sudo mkdir -p /var/lib/docker/volumes
```

## 백업 스크립트

### 데이터베이스 백업
```bash
# /opt/backups/backup-db.sh
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/opt/backups"

# PostgreSQL 백업
docker exec ppituru_postgres pg_dump -U postgres ppituru_db > $BACKUP_DIR/db_backup_$DATE.sql

# 7일 이상 된 백업 삭제
find $BACKUP_DIR -name "db_backup_*.sql" -mtime +7 -delete

echo "Database backup completed: db_backup_$DATE.sql"
```

### Cron 설정
```bash
# 매일 새벽 2시 백업
sudo crontab -e
# 추가: 0 2 * * * /opt/backups/backup-db.sh >> /var/log/ppituru/backup.log 2>&1
```

## SSH 키 설정

### GitHub Actions용 SSH 키
```bash
# 배포용 SSH 키 생성 (pp-infra에서 실행)
ssh-keygen -t ed25519 -f ~/.ssh/ppituru_deploy -N ""

# 공개키를 서버에 추가
cat ~/.ssh/ppituru_deploy.pub >> ~/.ssh/authorized_keys

# 개인키는 GitHub Secrets에 등록: DEPLOY_SSH_KEY
cat ~/.ssh/ppituru_deploy
```

## 성능 최적화

### 스왑 설정
```bash
# 2GB 스왑 생성 (Oracle Cloud Free Tier용)
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# 부팅시 자동 마운트
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
```

### 시스템 한계 설정
```bash
# 파일 디스크립터 한계 증가
echo "* soft nofile 65535" | sudo tee -a /etc/security/limits.conf
echo "* hard nofile 65535" | sudo tee -a /etc/security/limits.conf
```

---

## pp-infra Ansible Playbook에서 해야 할 일

1. **위 모든 도구들을 자동 설치**
2. **Nginx 리버스 프록시 설정**
3. **SSL 인증서 자동 갱신 설정**
4. **백업 스크립트 배포 및 cron 등록**
5. **방화벽 규칙 적용**
6. **SSH 키 교환**

이렇게 환경이 준비되면 우리 GitHub Actions에서는 **단순히 Docker 이미지만 배포**하면 됩니다!