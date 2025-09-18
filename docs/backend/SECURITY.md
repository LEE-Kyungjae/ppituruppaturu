<!-- /Users/ze/work/go/SECURITY.md -->
# 🔐 PittuRu PpattuRu Security Guide

## 📁 Sensitive Files Management

### **보안 파일 위치:**
```
secrets/                          # Git에서 제외된 보안 디렉토리
├── .env.oracle.production        # Oracle Cloud 인증 정보
├── ze2@kakao.com-*.pem           # Oracle API Private Key
└── deployment.config             # 배포 설정 (향후 추가)

config/                           # Docker 컨테이너용 설정
├── oci_private_key.pem          # Oracle Private Key (복사본)
└── (기타 설정 파일들)
```

### **Git에서 제외되는 파일들:**
- `.env*` (모든 환경변수 파일)
- `*.pem`, `*.p12`, `*.pfx` (인증서 파일)
- `secrets/` (전체 디렉토리)
- `config/` (설정 디렉토리)
- `*kakao*key*`, `*oauth*key*` (OAuth 키 파일들)

---

## ⚠️ 보안 주의사항

### **절대 Git에 커밋하면 안 되는 정보들:**

1. **Oracle Cloud 인증 정보**
   - Tenancy OCID: `ocid1.tenancy.oc1..aaaaaaaaox23rnm...`
   - User OCID: `ocid1.user.oc1..aaaaaaaaivl5ncb...`
   - API Key Fingerprint: `53:3a:50:e8:43:f5...`
   - Private Key 파일 내용

2. **OAuth API Keys**
   - Kakao REST API: `982038156c0f5d51eac72ac1912db622`
   - Kakao JS Key: `a33709c989c6eff816afbff8b6576513`
   - Google OAuth 키들

3. **기타 민감한 정보**
   - JWT Secret Keys
   - Database 비밀번호
   - Redis 비밀번호
   - SSL Private Keys

---

## 🛡️ 현재 보안 상태

### ✅ **안전하게 보호된 것들:**
- 모든 민감한 정보가 `secrets/` 디렉토리로 이동됨
- `.gitignore`에 보안 패턴들 추가됨
- 템플릿 파일들은 플레이스홀더로 정리됨
- Git history에 민감한 정보 없음 확인됨

### 📋 **배포 시 주의사항:**
1. `secrets/` 디렉토리를 서버에 안전하게 복사
2. Docker 컨테이너에 환경변수로 주입
3. Private Key 파일 권한을 600으로 설정
4. 운영 서버에서 불필요한 파일들 삭제

---

## 🚀 배포 시 보안 체크리스트

- [ ] `secrets/` 디렉토리가 Git에 추가되지 않았는지 확인
- [ ] Private Key 파일 권한이 600인지 확인
- [ ] 환경변수들이 컨테이너에 안전하게 주입되는지 확인
- [ ] SSL 인증서가 올바르게 설정되었는지 확인
- [ ] 방화벽 규칙이 적절히 설정되었는지 확인
- [ ] 로그에 민감한 정보가 출력되지 않는지 확인

---

## 📞 보안 문제 발생 시

1. **즉시 해당 키/토큰 비활성화**
2. **새로운 키 재발급**
3. **Git history에서 민감한 정보 제거** (필요시)
4. **모든 배포 환경에서 키 교체**

**중요**: 이 파일도 민감한 정보를 포함하므로 공개 저장소에 올릴 때 주의하세요!