# CI/CD & Blue-Green Runbook

이 문서는 PittuRu 서비스의 CI/CD 파이프라인과 블루/그린 배포에서 재발하기 쉬운 문제를 예방하기 위한 절차를 정리합니다.

## 1. 코드 변경 전 체크리스트
- `scripts/ensure-initdb.sh`를 실행해 `pp-backend/internal/migrations/initdb/` 폴더가 최신 상태인지 확인합니다. (CI에서도 `--check` 모드로 검증됨)
- Swagger 문서(`pp-backend/docs/`)가 변경된 경우 `pp-backend/.dockerignore`에 의해 제외되지 않았는지 확인합니다.
- 로컬에서 `docker-compose up -d` 실행 시 포트(8080, 8082, 3000)가 비어 있는지 확인합니다. 필요시 `lsof -i :<port>`로 점유 프로세스를 종료하세요.

## 2. GitHub Actions 파이프라인 개요
- **frontend-tests**: Lint, 타입체크, 유닛/E2E, 커버리지 수집.
- **backend-tests**: golangci-lint, race 테스트, 통합 테스트, `ensure-initdb.sh --check`.
- **mobile-tests**: Flutter 단위 테스트 및 APK 빌드.
- **security-scan** (main push): Trivy 파일 스캔.
- **build-images**: 커밋 SHA 기반 태그로 백엔드/프론트 이미지를 빌드하고 Docker Hub로 push.
- **deploy**: SSH로 서버 접속 → 포트 정리 → 최신 compose/스크립트 업로드 → 블루/그린 배포 스크립트 실행.

## 3. 수동 배포 또는 긴급 조치 절차
1. `ssh ocloud`로 서버 접속.
2. `/opt/pitturu`에서 최신 파일을 확인하고 필요 시 로컬에서 `scp`로 전달.
3. `docker network ls`로 `pitturu-core`, `pitturu_default`가 존재하는지 확인. 없으면 `docker network create`로 생성.
4. `docker inspect`로 `pitturu-postgres`, `pitturu-redis`가 두 네트워크에 모두 연결되어 있는지 확인. 없으면 `docker network connect` 수행.
5. `docker exec -it pitturu-postgres psql ...` 명령으로 데이터베이스 패스워드가 `.env`와 일치하는지 점검.
6. `docker compose -f docker-compose.<color>.yml -p pitturu-<color> up -d` 로 대상 스택 기동.
7. `/etc/nginx/conf.d`의 심볼릭 링크를 새 스택으로 전환 후 `sudo nginx -t && sudo systemctl reload nginx`.

## 4. 자주 발생한 장애와 대응법
- **Swagger 패키지 누락으로 백엔드 이미지 빌드 실패**: `.dockerignore`에서 `docs/` 제외 여부를 확인.
- **Postgres 초기화 실패 (`.down.sql` 실행)**: `initdb` 폴더에 `*.up.sql`만 존재하는지 재검증.
- **데이터베이스 비밀번호 불일치**: `.env`와 실제 DB 계정 패스워드를 항상 동일하게 유지 (`ALTER USER ... WITH PASSWORD`).
- **포트 바인딩 충돌**: `docker-compose` 실행 전 `lsof`로 8080/8082/8081/8083/8084/3000 포트를 체크.
- **Nginx 다중 설정 충돌**: `/etc/nginx/sites-enabled`에 단일 사이트만 남기고, `nginx -T`로 적용 내역을 확인.

## 5. 참고 명령 모음
```bash
# initdb 검증
./scripts/ensure-initdb.sh --check

# Blue 스택 수동 기동
cd /opt/pitturu && docker compose -f docker-compose.blue.yml -p pitturu-blue up -d

# Nginx 업스트림 전환 예시
sudo ln -sfn /etc/nginx/upstreams/app-blue.conf /etc/nginx/conf.d/app-upstream.conf
sudo nginx -t && sudo systemctl reload nginx

# DB 패스워드 수정
docker exec -i pitturu-postgres psql -U postgres -d pitturu_db \
  -c "ALTER USER postgres WITH PASSWORD '새_비밀번호';"
```

## 6. 파이프라인 실패 시 알림 확인
- GitHub Actions Summary의 “Deployment” 섹션에서 이미지 태그와 포트 정리 로그를 확인합니다.
- 실패 시 `playwright-report`, `trivy-results.sarif` 아티팩트를 내려 받아 추가 분석을 진행하세요.
