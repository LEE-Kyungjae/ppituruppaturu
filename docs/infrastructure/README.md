# Infrastructure - Oracle Cloud

Oracle Cloud 기반 인프라스트럭처 및 DevOps

## 🚀 Quick Start

```bash
# Terraform 초기화
terraform init

# 인프라 계획 확인
terraform plan

# 인프라 배포
terraform apply
```

## 🏗️ 아키텍처

### 클라우드 인프라
- **Provider**: Oracle Cloud Infrastructure (OCI)
- **Container**: Docker + Oracle Container Engine (OKE)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Storage**: Oracle Object Storage

### 배포 구조
```
GitHub → Actions → OCI Registry → OKE → Load Balancer → Users
```

## 🔧 주요 구성요소

### Kubernetes (OKE)
- Frontend: Next.js 앱
- Backend: Go API 서버  
- Database: PostgreSQL
- Cache: Redis

### 모니터링
- **Metrics**: Prometheus 수집
- **Dashboard**: Grafana 시각화
- **Logs**: OCI Logging
- **Alerts**: 장애 알림

### 보안
- **SSL/TLS**: Let's Encrypt 자동 인증서
- **WAF**: Web Application Firewall
- **Secrets**: OCI Vault 비밀 관리
- **Network**: 방화벽 및 보안 그룹

## 📦 배포 프로세스

### CI/CD Pipeline
1. **Code Push** → GitHub Repository
2. **Build** → GitHub Actions
3. **Test** → 자동화 테스트 실행
4. **Deploy** → OCI Container Registry
5. **Update** → Kubernetes 롤링 업데이트

### 환경 분리
- **Development**: 개발 환경
- **Staging**: 스테이징 환경  
- **Production**: 운영 환경

## 🔍 모니터링 & 운영

### 주요 메트릭
- **서버 상태**: CPU, Memory, Disk
- **애플리케이션**: 응답시간, 에러율
- **비즈니스**: 사용자 활동, 결제

### 장애 대응
- **자동 복구**: Health Check 기반 재시작
- **알림**: Slack/이메일 장애 알림
- **백업**: 데이터베이스 정기 백업

## 🛡️ 보안 설정

### 인증서 관리
```bash
# Let's Encrypt 인증서 자동 갱신
certbot renew --nginx
```

### 방화벽 규칙
- **HTTP/HTTPS**: 80, 443 포트만 공개
- **SSH**: 특정 IP에서만 접근 허용
- **Database**: 내부 네트워크에서만 접근

## 📞 지원 & 문의

- **인프라 이슈**: Oracle Cloud Console
- **모니터링**: Grafana Dashboard
- **로그**: OCI Logging Service