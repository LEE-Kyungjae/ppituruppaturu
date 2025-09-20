# 🚀 PittuRu 배포 가이드

## 🏗️ 인프라 설정 (한 번만 실행)

pp-infra 레포지토리에서 서버 환경을 설정합니다:

```bash
# pp-infra/scripts/setup-pitturu-server.sh를 서버에서 실행
sudo ./setup-pitturu-server.sh
```

**설치되는 것들:**
- Docker + Docker Compose
- Nginx (리버스 프록시)
- UFW 방화벽
- Fail2Ban 보안
- /opt/pitturu 디렉토리

## 🎯 애플리케이션 배포 (자동)

이 레포지토리에서 main 브랜치에 푸시하면 **자동 배포**됩니다:

```bash
git push origin main
```

### 배포 과정
1. **빌드**: Docker 이미지 빌드 및 GHCR 업로드
2. **배포**: SSH로 서버 접속 → 컨테이너 업데이트
3. **헬스체크**: 서비스 정상 동작 확인

## ⚙️ GitHub Secrets 설정

Repository Settings → Secrets and variables → Actions:

| Secret | 값 | 설명 |
|--------|----|----|
| `DEPLOY_SSH_KEY` | SSH 개인키 | 서버 접속용 |
| `SERVER_HOST` | `152.67.201.101` | Oracle Cloud IP |
| `SERVER_USER` | `ubuntu` | 서버 사용자 |

## 🔧 서버 환경변수 설정

서버에서 한 번만 설정:

```bash
# 서버에 접속
ssh ubuntu@152.67.201.101

# 환경변수 파일 생성
cd /opt/pitturu
cp .env.example .env
nano .env  # 실제 값으로 수정
```

**필수 수정 항목:**
```env
POSTGRES_PASSWORD=안전한_패스워드
JWT_SECRET=32글자_이상_시크릿
REFRESH_SECRET=32글자_이상_시크릿
```

## 🌐 도메인 설정

1. **DNS 설정**: ppituruppaturu.com → 152.67.201.101
2. **SSL 인증서**: Let's Encrypt 자동 설정 (추후)

## 🔍 모니터링

- **서비스 상태**: `docker-compose ps`
- **로그 확인**: `docker-compose logs -f`
- **헬스체크**:
  - Frontend: http://152.67.201.101:3000
  - Backend: http://152.67.201.101:8080/health

## 🚨 트러블슈팅

### 배포 실패시
```bash
# 서버에서 확인
cd /opt/pitturu
docker-compose logs

# 수동 재시작
docker-compose down
docker-compose up -d
```

### SSH 접속 문제
```bash
# 로컬에서 테스트
ssh ubuntu@152.67.201.101 "echo 'connection test'"
```

---

## ✅ 완료 체크리스트

- [ ] pp-infra 스크립트 실행 완료
- [ ] GitHub Secrets 설정 완료
- [ ] 서버 .env 파일 설정 완료
- [ ] 첫 배포 테스트 성공
- [ ] 도메인 연결 확인

🎉 **이제 `git push origin main`만 하면 자동 배포됩니다!**