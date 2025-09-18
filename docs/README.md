# 📚 PittuRu PpattuRu Documentation

종합 게임 플랫폼의 전체 문서 모음입니다.

## 📁 문서 구조

### 🎨 [Frontend](./frontend/)
- **Next.js 14 + React 18** 기반 웹 애플리케이션
- 실시간 채팅, 소셜 기능, 게임 시스템
- TypeScript + Tailwind CSS + Framer Motion

### ⚙️ [Backend](./backend/)
- **Go + Gin** 기반 API 서버
- PostgreSQL + Redis + JWT 인증
- 포트원 결제 시스템 통합

### 🚀 [Infrastructure](./infrastructure/)
- **Oracle Cloud** 기반 인프라
- Docker + Kubernetes + CI/CD
- 모니터링 및 보안 설정

### 📖 [Guides](./guides/)
- 공통 개발 가이드라인
- 배포 및 운영 매뉴얼
- 트러블슈팅 가이드

## 🎯 주요 기능

- **🎮 게임 시스템**: 미니게임, 순위표, 토너먼트
- **💬 실시간 채팅**: 다중 룸, 음성 채팅, 파일 공유
- **👥 소셜 기능**: 친구 시스템, 매칭, 프로필 관리
- **💳 결제 시스템**: 포인트 충전, 프리미엄 기능
- **🛡️ 관리자**: 대시보드, 사용자 관리, 분석

## 🚀 Quick Start

```bash
# Frontend
cd frontend && npm run dev

# Backend  
cd backend && go run main.go

# Infrastructure
cd infrastructure && terraform apply
```

## 🔗 주요 링크

- **개발 가이드**: [guides/development.md](./guides/development.md)
- **API 문서**: [backend/api/](./backend/api/)
- **배포 가이드**: [infrastructure/deployment/](./infrastructure/deployment/)
- **아키텍처**: [frontend/architecture.md](./frontend/architecture.md)

---

**🎯 목표**: 안정적이고 확장 가능한 멀티플레이어 게임 플랫폼 구축