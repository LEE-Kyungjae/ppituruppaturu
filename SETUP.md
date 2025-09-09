# 🚀 PortOne 결제 시스템 - 간단 설정 가이드

## 📋 현재 상태
- ✅ **Mock 모드로 즉시 실행 가능**
- 실제 결제를 위해서는 PortOne 토큰만 입력하면 됩니다

## ⚡ 빠른 시작

```bash
# 1. Frontend 실행
cd pp-frontend
npm install && npm run dev

# 2. Backend 실행  
cd pp-backend
go mod tidy && go run main.go
```

## 🔧 실제 결제 설정 (3단계)

### 1️⃣ PortOne 계정에서 정보 가져오기
[PortOne 콘솔](https://admin.portone.io)에서 다음 정보 복사:
- Store ID
- API Key  
- API Secret
- User Code

### 2️⃣ Backend 설정
```bash
cd pp-backend
cp .env.example .env
# .env 파일에서 PORTONE_* 값들을 실제 값으로 변경
```

### 3️⃣ Frontend 설정  
```bash
cd pp-frontend
cp .env.example .env.local
# .env.local 파일에서 NEXT_PUBLIC_PORTONE_* 값들을 실제 값으로 변경
```

### 4. 설정 확인

1. 서버 재시작
2. 개발자 도구 콘솔에서 Mock 모드 경고가 사라졌는지 확인
3. `paymentService.getPortOneConfig()`로 설정 상태 확인

## 🧪 설정 테스트

### Configuration 상태 확인

Frontend 콘솔에서:

```javascript
import { paymentService } from '@/services/paymentService'

// 현재 설정 확인
console.log(paymentService.getPortOneConfig())

// Production 준비 상태 확인
console.log('Production Ready:', paymentService.isProductionReady())
```

### Backend API로 확인

```bash
curl http://localhost:8080/api/v1/payments/config
```

## ⚙️ 설정 파일 구조

```
pp-frontend/
├── .env.example          # 환경변수 템플릿
├── .env.local            # 실제 환경변수 (생성 필요)
└── src/config/
    └── portone.config.ts # PortOne 설정 관리

pp-backend/
├── .env.example          # 환경변수 템플릿  
├── .env                  # 실제 환경변수 (생성 필요)
└── internal/config/
    └── portone.go        # PortOne 설정 관리
```

## 🔒 보안 주의사항

- **API Secret은 절대 Frontend에 노출하지 마세요**
- Frontend에는 Store ID, User Code만 설정
- Backend에는 민감한 API Key, API Secret 설정
- `.env` 파일들은 `.gitignore`에 추가되어 있음

## 📊 지원 기능

### ✅ 현재 구현된 기능
- 결제 세션 생성/관리
- 결제 준비/검증/취소
- 결제 내역 조회
- 관리자 대시보드
- 실시간 알림 시스템

### 🚧 추가 개발 필요
- 웹훅 엔드포인트 구현
- 정기 결제 기능
- 환불 처리 자동화

## 🆘 문제 해결

### Mock 모드가 계속 나타날 때
1. 환경변수 파일 생성 확인
2. 환경변수 값이 'mock_'으로 시작하지 않는지 확인
3. 서버 재시작

### 결제가 실패할 때
1. PortOne 콘솔에서 API 키 활성화 상태 확인
2. Store ID와 API 정보 일치 여부 확인
3. 개발자 도구 네트워크 탭에서 API 응답 확인

## 📞 지원

- PortOne 공식 문서: https://portone.gitbook.io/docs/
- PortOne 고객센터: https://portone.io/support