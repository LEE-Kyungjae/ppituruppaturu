# PittuRu 배포 가이드

이 문서는 PittuRu 프로젝트의 완전한 배포 프로세스를 안내합니다.

## 🚀 배포 개요

현재 인프라는 다음과 같이 현대화되었습니다:
- **Terraform**: 모듈화된 인프라 구성
- **Docker**: 멀티스테이지 빌드 및 헬스체크
- **Kubernetes**: 컨테이너 오케스트레이션
- **CI/CD**: GitHub Actions 자동화
- **모니터링**: Prometheus + Grafana

## 📋 사전 준비사항

### 1. 필수 계정 및 서비스
- [ ] Oracle Cloud Infrastructure (OCI) 계정
- [ ] GitHub 계정 및 저장소
- [ ] Slack 워크스페이스 (알림용)
- [ ] 도메인 이름 (선택사항)

### 2. 로컬 개발 환경
```bash
# 필수 도구 설치
brew install terraform
brew install kubectl
brew install docker
brew install git
```

### 3. OCI CLI 설정
```bash
# OCI CLI 설치
brew install oci-cli

# OCI 설정
oci setup config
```

## 🏗️ 단계별 배포 프로세스

### Phase 1: GitHub Secrets 설정

1. `GITHUB_SECRETS_SETUP.md` 가이드를 따라 모든 필수 Secrets 설정
2. GitHub Actions 권한 확인

### Phase 2: 인프라 배포

#### 자동 배포 (권장)
```bash
# 1. Infrastructure workflow 실행
# GitHub Actions → Infrastructure Management workflow
# Input: action=apply, environment=dev

# 2. 배포 상태 확인
# GitHub Actions에서 로그 확인
```

#### 수동 배포 (디버깅용)
```bash
cd pp-infrastructure/terraform

# Terraform 초기화
terraform init

# 배포 계획 확인
terraform plan \
  -var="tenancy_ocid=$OCI_TENANCY_OCID" \
  -var="user_ocid=$OCI_USER_OCID" \
  -var="fingerprint=$OCI_FINGERPRINT" \
  -var="private_key_path=~/.oci/private_key.pem" \
  -var="compartment_id=$OCI_COMPARTMENT_OCID" \
  -var="ssh_public_key=$SSH_PUBLIC_KEY" \
  -var="environment=dev"

# 인프라 배포
terraform apply
```

### Phase 3: 애플리케이션 배포

#### Development 환경
```bash
# 1. 환경 변수 설정
cp pp-infrastructure/.env.dev pp-infrastructure/.env

# 2. Docker Compose로 로컬 실행
cd pp-infrastructure
docker-compose --profile dev up -d

# 3. 서비스 상태 확인
docker-compose ps
curl http://localhost:8080/health
curl http://localhost:3000/api/health
```

#### Production 환경
```bash
# GitHub Actions에서 Deploy Application workflow 실행
# 또는 수동으로:

# 1. 프로덕션 서버 접속
ssh -i ~/.ssh/your-key ubuntu@YOUR_INSTANCE_IP

# 2. 애플리케이션 배포
cd /opt/pitturu
git pull origin main
docker-compose --profile prod down
docker-compose --profile prod up -d

# 3. 서비스 확인
docker-compose ps
curl http://localhost:8080/health
```

### Phase 4: 모니터링 설정

```bash
# 모니터링 스택 실행
docker-compose --profile monitoring up -d

# 접속 확인
# Prometheus: http://your-ip:9090
# Grafana: http://your-ip:3001 (admin/pitturu2024)
```

## 🔍 배포 후 검증

### 1. 인프라 검증
```bash
# Terraform outputs 확인
terraform output

# 인스턴스 상태 확인
oci compute instance list --compartment-id $COMPARTMENT_ID
```

### 2. 애플리케이션 검증
```bash
# Health check
curl -f http://YOUR_IP:8080/health
curl -f http://YOUR_IP:3000/api/health

# Database 연결 확인
curl -f http://YOUR_IP:8080/api/health/database

# Metrics 확인
curl http://YOUR_IP:8080/metrics
curl http://YOUR_IP:3000/api/metrics
```

### 3. 모니터링 검증
```bash
# Prometheus targets 확인
curl http://YOUR_IP:9090/api/v1/targets

# Grafana 접속 확인
curl http://YOUR_IP:3001/api/health
```

## 🚨 문제 해결

### 일반적인 문제들

#### 1. Terraform 배포 실패
```bash
# 에러 로그 확인
terraform plan -detailed-exitcode

# State 초기화 (주의!)
terraform destroy
terraform init
```

#### 2. Docker 빌드 실패
```bash
# 캐시 없이 빌드
docker-compose build --no-cache

# 이미지 정리
docker system prune -a
```

#### 3. 애플리케이션 시작 실패
```bash
# 로그 확인
docker-compose logs backend
docker-compose logs frontend

# 개별 컨테이너 디버깅
docker exec -it pitturu-backend /bin/sh
```

#### 4. 네트워크 연결 문제
```bash
# 포트 확인
ss -tlnp | grep :8080

# 방화벽 확인
sudo ufw status
```

### 로그 위치
- **애플리케이션 로그**: `pp-infrastructure/logs/`
- **Docker 로그**: `docker-compose logs [service]`
- **시스템 로그**: `/var/log/syslog`
- **Nginx 로그**: `pp-infrastructure/logs/nginx/`

## 🔄 업데이트 및 롤백

### 애플리케이션 업데이트
```bash
# 1. GitHub에 코드 푸시
git push origin main

# 2. GitHub Actions가 자동으로 배포 (CI/CD)
# 또는 수동으로:

# 3. 서버에서 업데이트
ssh ubuntu@YOUR_IP
cd /opt/pitturu
git pull origin main
docker-compose --profile prod down
docker-compose --profile prod up -d
```

### 긴급 롤백
```bash
# 1. 이전 버전으로 롤백
git log --oneline -10
git checkout PREVIOUS_COMMIT_HASH

# 2. 서비스 재시작
docker-compose --profile prod restart backend frontend

# 3. 상태 확인
curl http://localhost:8080/health
```

## 📊 모니터링 및 알림

### Grafana 대시보드
1. http://YOUR_IP:3001 접속
2. admin/pitturu2024로 로그인
3. 사전 구성된 대시보드 확인

### Slack 알림
GitHub Actions가 자동으로 다음 상황에 알림:
- 배포 성공/실패
- Health check 실패
- SSL 인증서 만료 임박

### 주요 메트릭
- **Response Time**: 95th percentile < 2초
- **Error Rate**: < 5%
- **CPU Usage**: < 80%
- **Memory Usage**: < 85%
- **Disk Usage**: > 10% 여유 공간

## 🔐 보안 체크리스트

- [ ] SSH 키 인증만 허용 (패스워드 로그인 비활성화)
- [ ] 방화벽 규칙 적용
- [ ] SSL 인증서 설정 (프로덕션)
- [ ] 보안 헤더 설정
- [ ] 정기적인 보안 업데이트
- [ ] Secrets 로테이션 (3-6개월)

## 📚 추가 리소스

- [Terraform 모듈 문서](pp-infrastructure/terraform/modules/)
- [Docker Compose 설정](pp-infrastructure/docker-compose.yml)
- [Kubernetes 매니페스트](pp-infrastructure/kubernetes/)
- [모니터링 설정](pp-infrastructure/monitoring/)
- [CI/CD 파이프라인](.github/workflows/)

---

**🎉 축하합니다!** 

PittuRu가 현대적인 DevOps 인프라와 함께 성공적으로 배포되었습니다. 
모든 서비스가 정상 작동하고 모니터링이 활성화되어 있습니다.