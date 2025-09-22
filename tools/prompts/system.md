# PittuRu AI System Prompts & Guardrails

## 🚨 절대 규칙 (Never Break)

### 코딩 스타일
- **C# (Unity)**: PascalCase 클래스/메서드, camelCase 필드/변수
- **Dart (Flutter)**: camelCase 클래스/메서드/변수, snake_case 파일명
- **Go (Backend)**: camelCase 공개, camelCase 비공개, kebab-case 패키지
- **모든 공개 API**: 절대 시그니처 변경 금지 (Breaking Change 방지)

### 아키텍처 원칙
- **Unity ↔ Flutter**: Platform Channel만 사용, 직접 네이티브 호출 금지
- **데이터 흐름**: Flutter → Unity (게임 시작), Unity → Flutter (결과 전송)
- **상태 관리**: Flutter Riverpod, Unity ScriptableObject, Go Context
- **에러 처리**: 모든 API 호출에 timeout + retry 로직 필수

### 성능 임계값
- **APK 크기**: 300MB 이하 (Unity Addressables 활용)
- **콜드 스타트**: 10초 이하 (Android 중급기 기준)
- **프레임레이트**: 60fps 안정성 (Unity Profiler 검증)
- **메모리**: 2GB RAM 기기에서 안정 동작

## 🎯 Unity 개발 가이드

### 필수 컴포넌트 구조
```csharp
// 모든 게임 로직은 이 패턴 따르기
public class GameManager : MonoBehaviour, IGameSystem
{
    [SerializeField] private GameConfig config;
    [SerializeField] private UnityEvent onGameStateChanged;

    public GameState State { get; private set; }

    public void Initialize(GameConfig config) { }
    public void UpdateGameState(float deltaTime) { }
    public void Cleanup() { }
}
```

### Platform Channel 브리지 규격
```csharp
// Flutter ↔ Unity 통신은 이 클래스를 통해서만
public static class FlutterBridge
{
    private const string CHANNEL_NAME = "pitturu.game/unity";

    public static void SendToFlutter(string method, Dictionary<string, object> data) { }
    public static void RegisterCallback(string method, Action<Dictionary<string, object>> callback) { }
}
```

### 멀티플레이어 네트워킹
```csharp
// Unity Netcode for GameObjects 패턴
public class NetworkPlayer : NetworkBehaviour
{
    [NetworkVariable] public NetworkString playerName = "";
    [NetworkVariable] public Vector3 position = Vector3.zero;

    [ServerRpc]
    public void MoveServerRpc(Vector3 newPosition) { }

    [ClientRpc]
    public void UpdatePositionClientRpc(Vector3 position) { }
}
```

## 🎨 Flutter 개발 가이드

### 화면 구조 템플릿
```dart
// 모든 화면은 이 구조 따르기
class GameScreen extends ConsumerStatefulWidget {
  const GameScreen({super.key});

  @override
  ConsumerState<GameScreen> createState() => _GameScreenState();
}

class _GameScreenState extends ConsumerState<GameScreen> {
  @override
  Widget build(BuildContext context) {
    final gameState = ref.watch(gameStateProvider);

    return Scaffold(
      appBar: const PitturuAppBar(title: 'Game'),
      body: const GameView(),
      floatingActionButton: const GameFAB(),
    );
  }
}
```

### 상태 관리 패턴
```dart
// Riverpod Provider 구조
final gameStateProvider = StateNotifierProvider<GameStateNotifier, GameState>((ref) {
  return GameStateNotifier(ref.read(gameRepositoryProvider));
});

class GameStateNotifier extends StateNotifier<GameState> {
  final GameRepository _repository;

  GameStateNotifier(this._repository) : super(const GameState.initial());

  Future<void> startGame() async { }
  Future<void> endGame() async { }
}
```

### Unity 통합 관리
```dart
// Unity 임베딩 매니저
class UnityGameManager {
  static const MethodChannel _channel = MethodChannel('pitturu.game/unity');

  static Future<bool> startGame(GameConfig config) async { }
  static Future<GameResult> getGameResult() async { }
  static Stream<GameEvent> get gameEvents => _gameEventController.stream;
}
```

## 🌐 Backend API 규격

### REST API 패턴
```go
// 모든 핸들러는 이 구조 따르기
func (h *GameHandler) StartGame(c *gin.Context) {
    var req StartGameRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        respondError(c, http.StatusBadRequest, "invalid request")
        return
    }

    result, err := h.gameService.StartGame(c.Request.Context(), req)
    if err != nil {
        respondError(c, http.StatusInternalServerError, err.Error())
        return
    }

    respondJSON(c, http.StatusOK, result)
}
```

### WebSocket 실시간 통신
```go
// 게임 룸 관리
type GameRoom struct {
    ID      string                 `json:"id"`
    Players map[string]*Player     `json:"players"`
    State   GameState             `json:"state"`
    Events  chan GameEvent        `json:"-"`
}

func (r *GameRoom) BroadcastEvent(event GameEvent) { }
func (r *GameRoom) AddPlayer(player *Player) error { }
```

## 📱 에셋 생성 규격

### 2D 스프라이트 표준
- **해상도**: 512x512px (캐릭터), 128x128px (아이콘)
- **포맷**: PNG (알파 채널), 24비트 컬러
- **네이밍**: `character_idle_01.png`, `ui_button_normal.png`
- **스프라이트 시트**: TexturePacker 4.x 호환

### 3D 모델 규격
- **폴리곤**: 5000 이하 (캐릭터), 1000 이하 (props)
- **텍스처**: 1024x1024px, PBR 워크플로우
- **본 구조**: 최대 50개 본, Humanoid 리그
- **애니메이션**: 30fps, 루핑 가능

### UI 디자인 시스템
- **컬러 팔레트**: Primary #4A90E2, Secondary #7B68EE, Accent #FF6B6B
- **타이포그래피**: Noto Sans KR (한글), Roboto (영문)
- **아이콘**: 24x24dp, Material Design 가이드라인
- **여백**: 8dp 단위 기준 (8, 16, 24, 32, 40dp)

## 🔧 빌드 & 배포 자동화

### Unity 빌드 설정
```bash
# Unity 배치 빌드 커맨드
Unity -batchmode -quit -projectPath ./unity-game \
  -buildTarget Android \
  -executeMethod BuildScript.BuildAndroid \
  -logFile build.log
```

### Flutter 빌드 파이프라인
```bash
# Flutter 릴리즈 빌드
flutter build apk --release \
  --dart-define=FLAVOR=production \
  --dart-define=API_URL=https://api.ppituruppaturu.com
```

### CI/CD 워크플로우 규칙
- **브랜치**: main(프로덕션), develop(개발), feature/*(피처)
- **태그**: v1.0.0 형식, semantic versioning
- **배포**: main 푸시 시 자동 배포, 10% → 50% → 100% 점진적 롤아웃
- **롤백**: 실패 시 이전 안정 버전으로 자동 복구

## 🧪 테스트 전략

### 자동화 테스트 커버리지
- **Unity**: 핵심 게임 로직 80% 이상
- **Flutter**: UI 위젯 + 비즈니스 로직 85% 이상
- **Backend**: API 엔드포인트 90% 이상
- **통합**: E2E 시나리오 주요 플로우 100%

### 성능 테스트 기준
- **게임 프레임레이트**: 60fps 5분간 안정성
- **메모리 사용량**: 2GB 기기에서 1.5GB 이하
- **네트워크 지연**: 200ms 이하에서 정상 플레이
- **배터리**: 1시간 플레이 시 20% 이하 소모

## 🚨 실패 기준 (Auto-Reject)

### 코드 품질
- **컴파일 에러**: 즉시 빌드 실패
- **경고 메시지**: 10개 이상 시 검토 요청
- **코드 스타일**: Lint 규칙 위반 시 자동 수정
- **보안 취약점**: Snyk/SonarQube 검출 시 배포 차단

### 성능 임계값
- **APK 크기**: 300MB 초과 시 빌드 실패
- **콜드 스타트**: 15초 초과 시 최적화 요청
- **메모리 누수**: Unity Profiler 검출 시 수정 필수
- **크래시율**: 1% 초과 시 핫픽스 필요

## 💡 AI 활용 가이드

### Claude Code 활용 시나리오
- **"Unity 캐릭터 컨트롤러 생성"**: 위 템플릿 기반으로 WASD 이동 + 점프 로직
- **"Flutter 로그인 화면 구현"**: 카카오/구글 소셜 로그인 + 에러 핸들링
- **"Go REST API 추가"**: CRUD + JWT 인증 + 페이징 포함
- **"CI/CD 워크플로우 생성"**: GitHub Actions + 자동 배포 + 롤백

### 에셋 생성 프롬프트 템플릿
```
# 캐릭터 생성
"2D game character, chibi style, [hair_color] hair, [outfit_description],
front view, idle pose, clean background, pixel perfect, 512x512px,
anime aesthetic, consistent art style with previous characters"

# UI 아이콘 생성
"Game UI icon set, minimalist style, [icon_type], 128x128px,
flat design, #4A90E2 primary color, white background,
vector style, mobile game interface"
```

### 프롬프트 재사용 규칙
- **일관성 유지**: 이전 생성물 스타일 참조 필수
- **품질 기준**: "commercial quality", "game ready" 키워드 포함
- **기술 규격**: 해상도/포맷/컬러 모드 명시
- **변형 생성**: 기본 → 바리에이션 순서로 점진적 확장