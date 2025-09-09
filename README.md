# 🎮 PittuRu PpattuRu - 통합 플랫폼

> **차세대 소셜 게이밍 플랫폼** - 실시간 채팅, 멀티플레이어 게임, 소셜 네트워킹이 하나로!

## 📋 프로젝트 개요

PittuRu PpattuRu는 실시간 채팅, 미니게임, 소셜 기능, 결제 시스템을 통합한 현대적인 웹 플랫폼입니다. Oracle Cloud Infrastructure 무료 티어를 활용하여 완전 무료로 운영 가능한 확장 가능한 아키텍처를 제공합니다.

## 🏗️ 모노레포 구조

이 프로젝트는 도메인별로 분리된 세 개의 주요 디렉토리로 구성되어 있습니다:

```
pitturu-platform/
├── backend/           # Go API 서버 및 비즈니스 로직
├── frontend/          # Next.js React 웹 애플리케이션
├── infrastructure/    # DevOps, 배포, 모니터링 도구
├── .env.template      # 통합 환경변수 템플릿
└── README.md         # 이 파일
```

## 🎯 각 모듈별 특징

### 🔧 Backend ([/backend](./backend/))
**Go 기반 고성능 API 서버**
- **기술 스택**: Go 1.21+, Gin, GORM, Redis, PostgreSQL
- **주요 기능**: JWT 인증, WebSocket 실시간 통신, 게임 시스템, 결제 연동
- **아키텍처**: 계층화된 클린 아키텍처 (Handler → Service → Repository)
- **특징**: 상태 비저장 설계, 수평 확장 가능, 고성능 캐싱

### 🎨 Frontend ([/frontend](./frontend/))
**Next.js 기반 모던 웹 애플리케이션**
- **기술 스택**: Next.js 14, React 18, TypeScript, Tailwind CSS
- **주요 기능**: SSR/SSG, PWA 지원, 반응형 디자인, 실시간 UI
- **상태 관리**: Zustand
- **특징**: 코드 분할, 이미지 최적화, SEO 최적화, 접근성 준수

### 🏗️ Infrastructure ([/infrastructure](./infrastructure/))
**완전 자동화된 클라우드 인프라**
- **클라우드**: Oracle Cloud Infrastructure (무료 티어)
- **컨테이너**: Docker Compose, Kubernetes
- **CI/CD**: GitHub Actions
- **모니터링**: Prometheus, Grafana, ELK Stack
- **특징**: Infrastructure as Code, 무중단 배포, 자동 백업

## ✨ 통합 기능

### 🔐 인증 시스템
- JWT 기반 토큰 인증 (Access + Refresh)
- 소셜 로그인 (카카오, 구글, 네이버)
- 역할 기반 접근 제어 (RBAC)
- 비밀번호 재설정 및 이메일 인증

### 💬 실시간 채팅
- WebSocket 기반 실시간 메시징
- 다중 채팅방 지원 (일반, 게임, VIP)
- 파일 공유 및 미디어 미리보기
- 음성 채팅 (WebRTC)
- 이모지 및 스티커 시스템

### 🎮 게임 플랫폼
- 5종 미니게임 엔진
- 실시간 리더보드 및 순위 시스템
- 토너먼트 및 대회 관리
- 성취 시스템 및 배지
- 포인트 기반 보상 시스템

### 💰 결제 & 수익화
- TossPayments 통합 (국내 결제)
- PayPal 지원 (해외 결제)
- 인앱 구매 시스템
- Google AdMob 광고 통합
- 포인트 시스템 및 아이템 거래

### 👥 소셜 시스템
- AI 기반 사용자 매칭
- 친구 시스템 및 그룹 관리
- 사용자 프로필 및 통계
- 활동 피드 및 알림
- 콘텐츠 공유 시스템

## 🚀 빠른 시작

### 1. 환경 설정
```bash
# 루트 디렉토리에서 환경변수 설정
cp .env.template .env
# .env 파일을 실제 값으로 수정

# 각 서비스별 환경변수 설정
cp backend/.env.template backend/.env
cp frontend/.env.template frontend/.env.local
cp infrastructure/.env.template infrastructure/.env
```

### 2. 로컬 개발 환경
```bash
# Docker Compose로 전체 스택 실행
cd infrastructure/docker
docker-compose up -d

# 또는 개별 서비스 실행
# Backend
cd backend && go run cmd/server/main.go

# Frontend  
cd frontend && npm install && npm run dev
```

### 3. 프로덕션 배포
```bash
# 인프라 프로비저닝
cd infrastructure
terraform apply

# 자동 배포 (CI/CD)
git push origin main  # GitHub Actions 트리거
```

## 📊 시스템 사양

### Oracle Cloud 무료 리소스 활용
| 리소스 | 사양 | 무료 한도 | 예상 비용 |
|--------|------|-----------|-----------|
| **Compute** | VM.Standard.A1.Flex (ARM64) | 4 OCPU, 24GB RAM | **$0** |
| **Database** | Autonomous DB | 2 OCPU, 20GB | **$0** |
| **Storage** | Block + Object Storage | 200GB + 10GB | **$0** |
| **Network** | Load Balancer, CDN | 10 Mbps, 10TB/월 | **$0** |
| **총 운영비** | | | **$0/월** |

### 성능 지표
- **동시 사용자**: 1,000+ 명
- **응답 시간**: 평균 < 100ms
- **가용성**: 99.9% SLA
- **확장성**: 수평 확장 지원

## 🔧 기술 스택 요약

### Backend
- **언어**: Go 1.21+
- **프레임워크**: Gin HTTP Framework
- **데이터베이스**: PostgreSQL + Redis
- **인증**: JWT + OAuth 2.0
- **실시간**: WebSocket, Server-Sent Events

### Frontend
- **프레임워크**: Next.js 14 + React 18
- **언어**: TypeScript
- **스타일링**: Tailwind CSS + Framer Motion
- **상태관리**: Zustand
- **빌드**: Webpack + SWC

### Infrastructure
- **클라우드**: Oracle Cloud Infrastructure
- **컨테이너**: Docker + Docker Compose
- **CI/CD**: GitHub Actions
- **모니터링**: Prometheus + Grafana
- **보안**: Let's Encrypt SSL, Fail2Ban

## 📁 상세 문서

각 모듈의 상세한 문서는 해당 디렉토리에서 확인할 수 있습니다:

- **[Backend 문서](./backend/README.md)** - API 명세, 아키텍처, 개발 가이드
- **[Frontend 문서](./frontend/README.md)** - 컴포넌트, UI/UX, 개발 가이드  
- **[Infrastructure 문서](./infrastructure/README.md)** - 배포, 모니터링, 운영 가이드

## 📈 개발 로드맵

### Phase 1: 코어 플랫폼 (완료)
- [x] 사용자 인증 및 권한 관리
- [x] 실시간 채팅 시스템
- [x] 기본 게임 프레임워크
- [x] API 문서화

### Phase 2: 게임 기능 (진행중)
- [ ] 5종 미니게임 구현
- [ ] 고급 리더보드 시스템
- [ ] 토너먼트 시스템
- [ ] 성취 시스템

### Phase 3: 수익화 (계획중)
- [ ] 인앱 구매 시스템
- [ ] 광고 시스템 (AdMob)
- [ ] 프리미엄 구독
- [ ] 마켓플레이스

### Phase 4: 고급 기능 (향후)
- [ ] AI 기반 게임 추천
- [ ] 소셜 기능 확장
- [ ] 모바일 앱 개발
- [ ] 다국어 지원

## 🛠️ 개발 환경 설정

### 필수 도구
```bash
# Backend 개발
go >= 1.21
docker >= 20.10
postgresql >= 13
redis >= 6

# Frontend 개발  
node >= 18
npm >= 8

# Infrastructure 관리
terraform >= 1.0
ansible >= 4.0
```

### IDE 설정
- **Backend**: VSCode + Go extension
- **Frontend**: VSCode + ES7+ React/Redux/GraphQL snippets
- **추천 Extension**: Prettier, ESLint, Docker, Terraform

## 🔍 모니터링 & 운영

### 대시보드 접속
- **Grafana**: http://localhost:3001 (admin/admin)
- **Prometheus**: http://localhost:9090
- **Application**: http://localhost:3000

### 로그 확인
```bash
# 실시간 로그 모니터링
docker-compose logs -f

# 특정 서비스 로그
docker-compose logs backend
docker-compose logs frontend
```

### 백업 및 복원
```bash
# 자동 백업 (매일 2시)
crontab -l | grep backup

# 수동 백업 실행
./infrastructure/scripts/backup.sh

# 복원
./infrastructure/scripts/restore.sh [backup_date]
```

## 🔒 보안

### 보안 기능
- HTTPS 강제 적용 (Let's Encrypt)
- JWT 토큰 보안 (Refresh Token Rotation)
- SQL 인젝션 방지 (GORM ORM)
- XSS 방지 (Content Security Policy)
- Rate Limiting (API 남용 방지)
- Fail2Ban (브루트포스 공격 방지)

### 보안 업데이트
```bash
# 의존성 보안 스캔
npm audit
go mod audit

# 컨테이너 보안 스캔
docker scout cves
```

## 🤝 기여 가이드

1. **이슈 생성**: 버그 리포트 또는 기능 요청
2. **Fork & Clone**: 저장소 포크 및 로컬 클론
3. **Branch 생성**: `git checkout -b feature/your-feature`
4. **개발 & 테스트**: 코드 작성 및 테스트 추가
5. **Pull Request**: 상세한 설명과 함께 PR 생성

### 커밋 컨벤션
```
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포매팅 변경
refactor: 코드 리팩토링
test: 테스트 추가/수정
chore: 빌드 프로세스 또는 보조 도구 변경
```

## 📄 라이센스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참고하세요.

## 📞 지원 및 문의

- 📧 **이메일**: contact@pitturu.com
- 🐛 **버그 리포트**: [GitHub Issues](https://github.com/pitturu/pitturu-platform/issues)
- 💬 **커뮤니티**: [Discord Server](https://discord.gg/pitturu)
- 📖 **문서**: [Wiki](https://github.com/pitturu/pitturu-platform/wiki)
- 🌐 **웹사이트**: [ppituruppaturu.com](https://ppituruppaturu.com)

---

**Built with ❤️ by the PittuRu Team**

> 이 프로젝트는 교육 및 학습 목적으로 제작되었으며, 오픈소스 커뮤니티의 기여를 환영합니다.