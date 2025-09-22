import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import '../components/unity_game_widget.dart';

class GameHubScreen extends StatefulWidget {
  const GameHubScreen({Key? key}) : super(key: key);

  @override
  State<GameHubScreen> createState() => _GameHubScreenState();
}

class _GameHubScreenState extends State<GameHubScreen> with TickerProviderStateMixin {
  late TabController _tabController;
  late WebViewController _webViewController;

  // 게임 모드
  final List<GameMode> _gameModes = [
    GameMode(
      id: 'main_unity',
      title: '메인 게임',
      subtitle: 'Unity 기반 3D 페인트 배틀',
      icon: Icons.games,
      type: GameType.unity,
      description: '실시간 멀티플레이어 3D 페인트 배틀 게임',
      playerCount: '1-8명',
      difficulty: 'Hard',
    ),
    GameMode(
      id: 'mini_paint',
      title: '미니 페인트',
      subtitle: '간단한 2D 페인트 게임',
      icon: Icons.brush,
      type: GameType.webview,
      webUrl: 'http://localhost:3000/games/paint-game',
      description: '빠르고 간단한 2D 페인트 게임',
      playerCount: '1-4명',
      difficulty: 'Easy',
    ),
    GameMode(
      id: 'memory_match',
      title: '기억력 게임',
      subtitle: '카드 매칭 게임',
      icon: Icons.psychology,
      type: GameType.webview,
      webUrl: 'http://localhost:3000/games/memory-match',
      description: '집중력과 기억력을 테스트하는 게임',
      playerCount: '1-2명',
      difficulty: 'Medium',
    ),
    GameMode(
      id: 'physics_jump',
      title: '피직스 점프',
      subtitle: '물리 기반 점프 게임',
      icon: Icons.sports_gymnastics,
      type: GameType.webview,
      webUrl: 'http://localhost:3000/games/physics-jump',
      description: '실감나는 물리 효과와 함께하는 점프 게임',
      playerCount: '1-8명',
      difficulty: 'Medium',
    ),
    GameMode(
      id: 'click_speed',
      title: '클릭 스피드',
      subtitle: '반응속도 테스트',
      icon: Icons.speed,
      type: GameType.webview,
      webUrl: 'http://localhost:3000/games/click-speed',
      description: '당신의 반응속도를 테스트해보세요',
      playerCount: '1명',
      difficulty: 'Easy',
    ),
  ];

  @override
  void initState() {
    super.initState();
    _tabController = TabController(length: 2, vsync: this);
    _initializeWebView();
  }

  void _initializeWebView() {
    _webViewController = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            print('WebView 로딩 진행률: $progress%');
          },
          onPageStarted: (String url) {
            print('WebView 페이지 시작: $url');
          },
          onPageFinished: (String url) {
            print('WebView 페이지 완료: $url');
          },
        ),
      );
  }

  @override
  void dispose() {
    _tabController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF1A1A2E),
      appBar: AppBar(
        title: const Text(
          'PittuRu Game Hub',
          style: TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
          ),
        ),
        backgroundColor: const Color(0xFF16213E),
        elevation: 0,
        bottom: TabBar(
          controller: _tabController,
          indicatorColor: const Color(0xFF00FF88),
          labelColor: const Color(0xFF00FF88),
          unselectedLabelColor: Colors.white70,
          tabs: const [
            Tab(icon: Icon(Icons.games), text: '게임 선택'),
            Tab(icon: Icon(Icons.leaderboard), text: '랭킹'),
          ],
        ),
      ),
      body: TabBarView(
        controller: _tabController,
        children: [
          _buildGameSelection(),
          _buildRankings(),
        ],
      ),
    );
  }

  Widget _buildGameSelection() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '게임을 선택하세요',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '다양한 게임 모드를 즐겨보세요',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: GridView.builder(
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 2,
                childAspectRatio: 0.8,
                crossAxisSpacing: 16,
                mainAxisSpacing: 16,
              ),
              itemCount: _gameModes.length,
              itemBuilder: (context, index) {
                final gameMode = _gameModes[index];
                return _buildGameCard(gameMode);
              },
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildGameCard(GameMode gameMode) {
    return GestureDetector(
      onTap: () => _launchGame(gameMode),
      child: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: [
              const Color(0xFF0F3460),
              const Color(0xFF16213E),
            ],
          ),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(
            color: gameMode.type == GameType.unity
                ? const Color(0xFF00FF88)
                : const Color(0xFF0EA5E9),
            width: 2,
          ),
        ),
        child: Padding(
          padding: const EdgeInsets.all(16.0),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Row(
                children: [
                  Icon(
                    gameMode.icon,
                    color: gameMode.type == GameType.unity
                        ? const Color(0xFF00FF88)
                        : const Color(0xFF0EA5E9),
                    size: 32,
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: gameMode.type == GameType.unity
                          ? const Color(0xFF00FF88).withOpacity(0.2)
                          : const Color(0xFF0EA5E9).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Text(
                      gameMode.type == GameType.unity ? 'Unity' : 'Web',
                      style: TextStyle(
                        color: gameMode.type == GameType.unity
                            ? const Color(0xFF00FF88)
                            : const Color(0xFF0EA5E9),
                        fontSize: 10,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Text(
                gameMode.title,
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
              ),
              const SizedBox(height: 4),
              Text(
                gameMode.subtitle,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.7),
                  fontSize: 12,
                ),
              ),
              const SizedBox(height: 8),
              Text(
                gameMode.description,
                style: TextStyle(
                  color: Colors.white.withOpacity(0.6),
                  fontSize: 10,
                  height: 1.3,
                ),
                maxLines: 2,
                overflow: TextOverflow.ellipsis,
              ),
              const Spacer(),
              Row(
                children: [
                  Icon(
                    Icons.people,
                    color: Colors.white.withOpacity(0.5),
                    size: 12,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    gameMode.playerCount,
                    style: TextStyle(
                      color: Colors.white.withOpacity(0.5),
                      fontSize: 10,
                    ),
                  ),
                  const Spacer(),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                    decoration: BoxDecoration(
                      color: _getDifficultyColor(gameMode.difficulty).withOpacity(0.2),
                      borderRadius: BorderRadius.circular(8),
                    ),
                    child: Text(
                      gameMode.difficulty,
                      style: TextStyle(
                        color: _getDifficultyColor(gameMode.difficulty),
                        fontSize: 8,
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }

  Color _getDifficultyColor(String difficulty) {
    switch (difficulty) {
      case 'Easy':
        return Colors.green;
      case 'Medium':
        return Colors.orange;
      case 'Hard':
        return Colors.red;
      default:
        return Colors.grey;
    }
  }

  void _launchGame(GameMode gameMode) {
    switch (gameMode.type) {
      case GameType.unity:
        _launchUnityGame(gameMode);
        break;
      case GameType.webview:
        _launchWebViewGame(gameMode);
        break;
    }
  }

  void _launchUnityGame(GameMode gameMode) {
    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(gameMode.title),
            backgroundColor: const Color(0xFF16213E),
            foregroundColor: Colors.white,
          ),
          body: UnityGameWidget(
            gameSceneName: 'PaintBattleScene',
            gameConfig: {
              'gameMode': gameMode.id,
              'maxPlayers': 8,
              'gameType': 'paintBattle',
            },
            onUnityCreated: (controller) {
              print('Unity 게임 시작: ${gameMode.title}');
            },
            onUnityMessage: (message) {
              print('Unity 메시지: $message');
            },
          ),
        ),
      ),
    );
  }

  void _launchWebViewGame(GameMode gameMode) {
    if (gameMode.webUrl == null) return;

    Navigator.push(
      context,
      MaterialPageRoute(
        builder: (context) => Scaffold(
          appBar: AppBar(
            title: Text(gameMode.title),
            backgroundColor: const Color(0xFF16213E),
            foregroundColor: Colors.white,
            actions: [
              IconButton(
                icon: const Icon(Icons.refresh),
                onPressed: () {
                  _webViewController.reload();
                },
              ),
            ],
          ),
          body: WebViewWidget(
            controller: _webViewController
              ..loadRequest(Uri.parse(gameMode.webUrl!)),
          ),
        ),
      ),
    );
  }

  Widget _buildRankings() {
    return Padding(
      padding: const EdgeInsets.all(16.0),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const Text(
            '랭킹',
            style: TextStyle(
              color: Colors.white,
              fontSize: 24,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          Text(
            '전체 플레이어 순위',
            style: TextStyle(
              color: Colors.white.withOpacity(0.7),
              fontSize: 16,
            ),
          ),
          const SizedBox(height: 24),
          Expanded(
            child: ListView.builder(
              itemCount: 10,
              itemBuilder: (context, index) {
                return Container(
                  margin: const EdgeInsets.only(bottom: 12),
                  padding: const EdgeInsets.all(16),
                  decoration: BoxDecoration(
                    color: const Color(0xFF16213E),
                    borderRadius: BorderRadius.circular(12),
                    border: Border.all(
                      color: index < 3
                          ? const Color(0xFF00FF88)
                          : Colors.transparent,
                      width: index < 3 ? 2 : 0,
                    ),
                  ),
                  child: Row(
                    children: [
                      CircleAvatar(
                        backgroundColor: _getRankColor(index),
                        radius: 20,
                        child: Text(
                          '${index + 1}',
                          style: const TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                      const SizedBox(width: 16),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Player${index + 1}',
                              style: const TextStyle(
                                color: Colors.white,
                                fontSize: 16,
                                fontWeight: FontWeight.bold,
                              ),
                            ),
                            Text(
                              'Level ${25 - index}',
                              style: TextStyle(
                                color: Colors.white.withOpacity(0.7),
                                fontSize: 12,
                              ),
                            ),
                          ],
                        ),
                      ),
                      Column(
                        crossAxisAlignment: CrossAxisAlignment.end,
                        children: [
                          Text(
                            '${(1000 - index * 50)} pts',
                            style: const TextStyle(
                              color: Color(0xFF00FF88),
                              fontSize: 16,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          Text(
                            '${index + 1}승',
                            style: TextStyle(
                              color: Colors.white.withOpacity(0.7),
                              fontSize: 12,
                            ),
                          ),
                        ],
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
        ],
      ),
    );
  }

  Color _getRankColor(int index) {
    switch (index) {
      case 0:
        return Colors.amber; // 1등 - 금색
      case 1:
        return Colors.grey[400]!; // 2등 - 은색
      case 2:
        return Colors.brown; // 3등 - 동색
      default:
        return const Color(0xFF0EA5E9); // 나머지 - 파란색
    }
  }
}

// 게임 모드 데이터 클래스
class GameMode {
  final String id;
  final String title;
  final String subtitle;
  final IconData icon;
  final GameType type;
  final String? webUrl;
  final String description;
  final String playerCount;
  final String difficulty;

  GameMode({
    required this.id,
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.type,
    this.webUrl,
    required this.description,
    required this.playerCount,
    required this.difficulty,
  });
}

enum GameType {
  unity,   // Unity 기반 메인 게임
  webview, // WebView 기반 미니게임
}