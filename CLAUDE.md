# 삐뚜루빠뚜루 Project

## 프로젝트 구조

### 애플리케이션 레포지토리 (/Users/ze/work/pp/)
- `pp-backend/`: Go 기반 REST API 서버 및 WebSocket 게임 서버
- `pp-frontend/`: Next.js 기반 웹 애플리케이션 (물리 게임 엔진 포함)
- `pp_mobile/`: Flutter 기반 모바일 애플리케이션

### 인프라 레포지토리 (/Users/ze/work/pp-infra/)
- Oracle Cloud 기반 프로덕션 인프라
- Terraform, Ansible 자동화
- 도메인: ppituruppaturu.com
- **모든 인프라 관련 작업은 pp-infra에서 진행**

### 역할 구분
- **이 디렉토리 (pp/)**: 게임 애플리케이션 개발, 빌드, 배포 파이프라인
- **pp-infra/**: 인프라 프로비저닝 (Terraform, Ansible)

## 프로젝트 헌법

이 프로젝트는 다음 원칙을 따릅니다:

- **사용자 중심**: 모든 기능은 사용자 경험을 개선하는 방향으로 개발
- **품질 우선**: 코드 품질, 테스트, 보안을 항상 고려
- **확장성**: 미래의 성장을 고려한 아키텍처 설계  
- **성능**: 빠른 응답시간과 효율적인 리소스 사용
- **유지보수성**: 명확하고 읽기 쉬운 코드 작성