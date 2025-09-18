# GitHub Secrets Configuration Guide

이 가이드는 PittuRu 프로젝트의 GitHub Actions CI/CD 파이프라인에 필요한 Secrets를 설정하는 방법을 안내합니다.

## 📋 필수 Secrets 목록

### 🏗️ Infrastructure (OCI) Secrets
```
OCI_TENANCY_OCID=ocid1.tenancy.oc1..your_tenancy_id
OCI_USER_OCID=ocid1.user.oc1..your_user_id
OCI_FINGERPRINT=your_key_fingerprint
OCI_COMPARTMENT_OCID=ocid1.compartment.oc1..your_compartment_id
OCI_CONFIG=# OCI config file content (base64 encoded)
OCI_PRIVATE_KEY=# OCI private key content (base64 encoded)
OCI_INSTANCE_IP=your_instance_public_ip
```

### 🔐 Application Secrets
```
JWT_SECRET=super_secret_jwt_key_for_production
REFRESH_SECRET=super_secret_refresh_key_for_production
POSTGRES_PASSWORD=secure_postgres_password
REDIS_PASSWORD=secure_redis_password
```

### 🎯 OAuth & Payment Secrets
```
KAKAO_CLIENT_ID=your_kakao_client_id
KAKAO_CLIENT_SECRET=your_kakao_client_secret
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
PORTONE_API_KEY=your_portone_api_key
PORTONE_SECRET=your_portone_secret
```

### 📊 Monitoring & Notifications
```
GRAFANA_PASSWORD=secure_grafana_password
SLACK_WEBHOOK=https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK
INFRACOST_API_KEY=your_infracost_api_key
```

### 🔑 SSH & Access
```
SSH_PUBLIC_KEY=ssh-rsa AAAAB3NzaC1yc2E...your_public_key
DEV_INSTANCE_IP=your_dev_instance_ip
STAGING_INSTANCE_IP=your_staging_instance_ip
```

## 🛠️ GitHub Secrets 설정 방법

### 1. GitHub Repository 설정

1. GitHub Repository로 이동
2. `Settings` 탭 클릭
3. 좌측 메뉴에서 `Secrets and variables` → `Actions` 클릭
4. `New repository secret` 버튼 클릭

### 2. OCI 설정 가이드

#### OCI Config 파일 생성
```bash
# ~/.oci/config 파일 내용을 base64로 인코딩
cat ~/.oci/config | base64 -w 0
```

#### OCI Private Key 생성
```bash
# Private key를 base64로 인코딩
cat ~/.oci/private_key.pem | base64 -w 0
```

### 3. SSH Key 생성
```bash
# SSH Key 생성
ssh-keygen -t rsa -b 4096 -C "pitturu-deployment@example.com"

# Public key 내용 복사
cat ~/.ssh/id_rsa.pub
```

### 4. 랜덤 시크릿 생성
```bash
# JWT Secret (32자 이상)
openssl rand -hex 32

# Refresh Secret (32자 이상)
openssl rand -hex 32

# Database Password (16자 이상)
openssl rand -base64 24

# Redis Password
openssl rand -base64 16
```

## 🎯 환경별 Secrets 구성

### Development Environment
```
DEV_POSTGRES_PASSWORD=pitturu_dev_2024
DEV_REDIS_PASSWORD=pitturu_dev_2024
DEV_JWT_SECRET=dev_jwt_secret_not_for_production
DEV_REFRESH_SECRET=dev_refresh_secret_not_for_production
```

### Staging Environment
```
STAGING_POSTGRES_PASSWORD=secure_staging_password
STAGING_REDIS_PASSWORD=secure_staging_redis_password
STAGING_JWT_SECRET=staging_jwt_secret_32_chars_min
STAGING_REFRESH_SECRET=staging_refresh_secret_32_chars_min
```

### Production Environment
```
PROD_POSTGRES_PASSWORD=ultra_secure_prod_password
PROD_REDIS_PASSWORD=ultra_secure_redis_password
PROD_JWT_SECRET=production_jwt_secret_64_chars_minimum
PROD_REFRESH_SECRET=production_refresh_secret_64_chars_minimum
```

## 🔒 보안 모범 사례

### 1. Password 요구사항
- 최소 16자 이상
- 대소문자, 숫자, 특수문자 포함
- 사전에 없는 단어 사용

### 2. JWT Secret 요구사항
- 최소 32자 (프로덕션에서는 64자 권장)
- 랜덤 생성된 값 사용
- 환경별로 다른 값 사용

### 3. API Key 관리
- 정기적 로테이션 (3-6개월)
- 최소 권한 원칙 적용
- 테스트용과 프로덕션용 분리

## 📝 Secrets 검증 체크리스트

- [ ] OCI 인증 정보가 올바르게 설정됨
- [ ] SSH 키가 대상 서버에 등록됨
- [ ] 모든 패스워드가 보안 요구사항을 충족함
- [ ] OAuth 클라이언트 ID/Secret이 올바름
- [ ] Payment API 키가 올바른 환경으로 설정됨
- [ ] 슬랙 웹훅이 올바른 채널로 설정됨
- [ ] 환경별로 다른 값들이 적절히 분리됨

## 🚨 비상 시 대응

### Secrets 노출 시
1. 즉시 해당 Secret 무효화
2. 새로운 값으로 재생성
3. GitHub Secrets 업데이트
4. 관련 서비스 재배포

### 접근 권한 문제 시
1. OCI 사용자 권한 확인
2. SSH 키 등록 상태 확인
3. API 키 유효성 확인
4. 네트워크 접근 규칙 확인

## 📚 추가 참고자료

- [GitHub Secrets 문서](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OCI CLI 설정](https://docs.oracle.com/en-us/iaas/Content/API/SDKDocs/cliinstall.htm)
- [Terraform OCI Provider](https://registry.terraform.io/providers/oracle/oci/latest/docs)

---

**⚠️ 중요**: 이 문서의 예시 값들은 실제 프로덕션에서 사용하지 마세요. 반드시 새로운 값을 생성하여 사용하세요.