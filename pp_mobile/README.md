# 삐뚜루빠뚜루 Mobile App

Flutter WebView 앱으로 삐뚜루빠뚜루 게임 플랫폼에 모바일에서 접속할 수 있습니다.

## 기능

- **WebView 기반**: 웹 기반 게임 플랫폼을 모바일 앱에서 접근
- **빠른 접속**: 프론트엔드, 백엔드 API, Swagger 문서에 빠르게 접속
- **네비게이션**: 뒤로/앞으로 가기, 새로고침 기능
- **URL 변경**: 개발 환경 및 다른 URL로 쉽게 전환
- **로딩 인디케이터**: 페이지 로딩 상태 표시
- **에러 처리**: 네트워크 오류 시 알림 표시

## 개발 환경 설정

### 1. Flutter 설치 확인
```bash
flutter doctor
```

### 2. 의존성 설치
```bash
cd pp_mobile
flutter pub get
```

### 3. 앱 실행

#### iOS 시뮬레이터에서 실행
```bash
flutter run
```

#### Android 에뮬레이터에서 실행
```bash
flutter run
```

#### Chrome에서 웹으로 실행 (개발용)
```bash
flutter run -d chrome
```

## 사용법

### 1. 기본 접속
앱을 실행하면 자동으로 `http://localhost:3000` (프론트엔드)에 접속합니다.

### 2. 빠른 접속 메뉴
하단의 메뉴 버튼을 눌러서 다음 항목에 빠르게 접속할 수 있습니다:
- **프론트엔드**: `http://localhost:3000`
- **백엔드 API**: `http://localhost:8080`
- **API 문서**: `http://localhost:8080/swagger/index.html`

### 3. URL 변경
상단의 지구본 아이콘을 눌러서 원하는 URL로 직접 이동할 수 있습니다.

### 4. 네비게이션
- **뒤로 가기**: ← 버튼
- **앞으로 가기**: → 버튼
- **새로고침**: 🔄 버튼

## 프로젝트 구조

```
pp_mobile/
├── lib/
│   └── main.dart          # 메인 앱 코드 (WebView 구현)
├── android/               # Android 플랫폼 설정
├── ios/                   # iOS 플랫폼 설정
├── web/                   # Web 플랫폼 설정 (개발용)
├── pubspec.yaml          # Flutter 의존성 설정
└── README.md             # 이 파일
```

## 개발 환경과 연동

이 모바일 앱은 로컬 개발 환경과 함께 사용하도록 설계되었습니다:

1. **백엔드 서버 실행** (`localhost:8080`)
2. **프론트엔드 개발 서버 실행** (`localhost:3000`)
3. **모바일 앱 실행**

### 백엔드 서버 실행
```bash
cd ../pp-backend
./bin/server
```

### 프론트엔드 서버 실행
```bash
cd ../pp-frontend
npm run dev
```

## 주의사항

- iOS에서 localhost 접속 시 네트워크 보안 설정이 필요할 수 있습니다
- Android에서는 `10.0.2.2`를 localhost 대신 사용해야 할 수 있습니다
- 웹에서 실행할 때는 CORS 정책으로 인해 일부 기능이 제한될 수 있습니다

## 트러블슈팅

### localhost 접속 안 됨
- iOS: 시뮬레이터에서 localhost 대신 실제 IP 주소 사용
- Android: `10.0.2.2:3000` 또는 `10.0.2.2:8080` 사용

### 빌드 오류
```bash
flutter clean
flutter pub get
flutter run
```

## 배포 준비

### Android APK 빌드
```bash
flutter build apk
```

### iOS 빌드 (Mac 필요)
```bash
flutter build ios
```
