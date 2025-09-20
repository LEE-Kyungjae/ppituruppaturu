import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:flame/game.dart';
import 'games/simple_jump_game.dart';
import 'games/cross_platform_jump_game.dart';

void main() {
  runApp(const PittuRuApp());
}

class PittuRuApp extends StatelessWidget {
  const PittuRuApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PittuRu PpattuRu',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.purple,
          brightness: Brightness.light,
        ),
        useMaterial3: true,
      ),
      home: const WebViewScreen(),
      debugShowCheckedModeBanner: false,
    );
  }
}

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key});

  @override
  State<WebViewScreen> createState() => _WebViewScreenState();
}

class _WebViewScreenState extends State<WebViewScreen> {
  late WebViewController controller;
  bool isLoading = true;
  String currentUrl = 'http://localhost:3000';

  @override
  void initState() {
    super.initState();
    
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            // Update loading bar progress
          },
          onPageStarted: (String url) {
            setState(() {
              isLoading = true;
              currentUrl = url;
            });
          },
          onPageFinished: (String url) {
            setState(() {
              isLoading = false;
            });
          },
          onWebResourceError: (WebResourceError error) {
            ScaffoldMessenger.of(context).showSnackBar(
              SnackBar(
                content: Text('연결 오류: ${error.description}'),
                backgroundColor: Colors.red,
              ),
            );
          },
        ),
      )
      ..loadRequest(Uri.parse(currentUrl));
  }

  void _refreshPage() {
    controller.reload();
  }

  void _goBack() {
    controller.goBack();
  }

  void _goForward() {
    controller.goForward();
  }

  void _showUrlDialog() {
    final TextEditingController urlController = TextEditingController(text: currentUrl);
    
    showDialog(
      context: context,
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('URL 변경'),
          content: TextField(
            controller: urlController,
            decoration: const InputDecoration(
              labelText: 'URL을 입력하세요',
              hintText: 'http://localhost:3000',
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(),
              child: const Text('취소'),
            ),
            TextButton(
              onPressed: () {
                final newUrl = urlController.text.trim();
                if (newUrl.isNotEmpty) {
                  // Add protocol if missing
                  String url = newUrl;
                  if (!url.startsWith('http://') && !url.startsWith('https://')) {
                    url = 'http://$url';
                  }
                  
                  controller.loadRequest(Uri.parse(url));
                  setState(() {
                    currentUrl = url;
                  });
                }
                Navigator.of(context).pop();
              },
              child: const Text('이동'),
            ),
          ],
        );
      },
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🎮 PittuRu PpattuRu',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
        actions: [
          IconButton(
            onPressed: _goBack,
            icon: const Icon(Icons.arrow_back),
            tooltip: '뒤로',
          ),
          IconButton(
            onPressed: _goForward,
            icon: const Icon(Icons.arrow_forward),
            tooltip: '앞으로',
          ),
          IconButton(
            onPressed: _refreshPage,
            icon: const Icon(Icons.refresh),
            tooltip: '새로고침',
          ),
          IconButton(
            onPressed: _showUrlDialog,
            icon: const Icon(Icons.language),
            tooltip: 'URL 변경',
          ),
        ],
      ),
      body: Stack(
        children: [
          WebViewWidget(controller: controller),
          if (isLoading)
            const Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  CircularProgressIndicator(
                    color: Colors.purple,
                  ),
                  SizedBox(height: 16),
                  Text(
                    '게임 로딩 중...',
                    style: TextStyle(
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
      bottomNavigationBar: Container(
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
        color: Theme.of(context).colorScheme.surface,
        child: Row(
          children: [
            Expanded(
              child: Text(
                currentUrl,
                style: Theme.of(context).textTheme.bodySmall,
                overflow: TextOverflow.ellipsis,
              ),
            ),
            IconButton(
              onPressed: () {
                // Development URLs quick access
                showModalBottomSheet(
                  context: context,
                  builder: (BuildContext context) {
                    return Container(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            '빠른 접속',
                            style: TextStyle(
                              fontSize: 18,
                              fontWeight: FontWeight.bold,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ListTile(
                            leading: const Icon(Icons.home),
                            title: const Text('프론트엔드 (localhost:3000)'),
                            onTap: () {
                              controller.loadRequest(Uri.parse('http://localhost:3000'));
                              setState(() {
                                currentUrl = 'http://localhost:3000';
                              });
                              Navigator.pop(context);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.api),
                            title: const Text('백엔드 API (localhost:8080)'),
                            onTap: () {
                              controller.loadRequest(Uri.parse('http://localhost:8080'));
                              setState(() {
                                currentUrl = 'http://localhost:8080';
                              });
                              Navigator.pop(context);
                            },
                          ),
                          ListTile(
                            leading: const Icon(Icons.description),
                            title: const Text('API 문서 (Swagger)'),
                            onTap: () {
                              controller.loadRequest(Uri.parse('http://localhost:8080/swagger/index.html'));
                              setState(() {
                                currentUrl = 'http://localhost:8080/swagger/index.html';
                              });
                              Navigator.pop(context);
                            },
                          ),
                          const Divider(),
                          ListTile(
                            leading: const Icon(Icons.sports_esports),
                            title: const Text('네이티브 게임'),
                            subtitle: const Text('Flutter로 만든 고성능 물리 게임'),
                            onTap: () {
                              Navigator.pop(context);
                              Navigator.push(
                                context,
                                MaterialPageRoute(builder: (context) => const GameSelectionScreen()),
                              );
                            },
                          ),
                        ],
                      ),
                    );
                  },
                );
              },
              icon: const Icon(Icons.menu),
              tooltip: '빠른 접속',
            ),
          ],
        ),
      ),
    );
  }
}

class GameSelectionScreen extends StatelessWidget {
  const GameSelectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text(
          '🎮 네이티브 게임 선택',
          style: TextStyle(fontWeight: FontWeight.bold),
        ),
        backgroundColor: Theme.of(context).colorScheme.inversePrimary,
      ),
      body: Padding(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const Text(
              '미니게임 천국에 오신 것을 환영합니다!',
              style: TextStyle(
                fontSize: 20,
                fontWeight: FontWeight.bold,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            const Text(
              'Flutter와 Flame 엔진으로 만든 고성능 물리 게임을 즐겨보세요',
              style: TextStyle(
                fontSize: 14,
                color: Colors.grey,
              ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 32),
            Expanded(
              child: GridView.count(
                crossAxisCount: 2,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
                children: [
                  _GameCard(
                    title: '올라올라',
                    subtitle: '점프 게임',
                    icon: Icons.arrow_upward,
                    color: Colors.blue,
                    description: 'Flame 엔진으로 구현한\n간단한 점프 게임',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => GameWidget<SimpleJumpGame>.controlled(
                            gameFactory: SimpleJumpGame.new,
                          ),
                        ),
                      );
                    },
                  ),
                  _GameCard(
                    title: '멀티플레이어 점프',
                    subtitle: '크로스플랫폼',
                    icon: Icons.people,
                    color: Colors.purple,
                    description: '웹/모바일 함께 즐기는\n실시간 멀티플레이어 게임',
                    onTap: () {
                      Navigator.push(
                        context,
                        MaterialPageRoute(
                          builder: (context) => GameWidget<CrossPlatformJumpGame>.controlled(
                            gameFactory: CrossPlatformJumpGame.new,
                          ),
                        ),
                      );
                    },
                  ),
                  _GameCard(
                    title: '받아받아',
                    subtitle: '캐치 게임',
                    icon: Icons.sports_baseball,
                    color: Colors.green,
                    description: '준비 중인 게임입니다',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('곧 출시됩니다! 기대해 주세요 🎮'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                  _GameCard(
                    title: '흔들흔들',
                    subtitle: '밸런스 게임',
                    icon: Icons.balance,
                    color: Colors.orange,
                    description: '준비 중인 게임입니다',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('곧 출시됩니다! 기대해 주세요 🎮'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                  _GameCard(
                    title: '더 많은 게임',
                    subtitle: '준비 중',
                    icon: Icons.add_circle_outline,
                    color: Colors.grey,
                    description: '곧 더 많은 재미있는\n게임들이 추가됩니다',
                    onTap: () {
                      ScaffoldMessenger.of(context).showSnackBar(
                        const SnackBar(
                          content: Text('곧 출시됩니다! 기대해 주세요 🎮'),
                          duration: Duration(seconds: 2),
                        ),
                      );
                    },
                  ),
                ],
              ),
            ),
            const SizedBox(height: 16),
            const Text(
              '💡 팁: 게임을 최대한 즐기려면 소리를 켜고 진동을 활성화하세요!',
              style: TextStyle(
                fontSize: 12,
                color: Colors.grey,
                fontStyle: FontStyle.italic,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}

class _GameCard extends StatelessWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final String description;
  final VoidCallback onTap;

  const _GameCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.description,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      elevation: 4,
      shape: RoundedRectangleBorder(
        borderRadius: BorderRadius.circular(16),
      ),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(16),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(16),
                decoration: BoxDecoration(
                  color: color.withOpacity(0.1),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  icon,
                  size: 32,
                  color: color,
                ),
              ),
              const SizedBox(height: 12),
              Text(
                title,
                style: const TextStyle(
                  fontSize: 18,
                  fontWeight: FontWeight.bold,
                ),
                textAlign: TextAlign.center,
              ),
              Text(
                subtitle,
                style: TextStyle(
                  fontSize: 12,
                  color: Colors.grey[600],
                ),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 8),
              Text(
                description,
                style: const TextStyle(
                  fontSize: 11,
                  height: 1.3,
                ),
                textAlign: TextAlign.center,
              ),
            ],
          ),
        ),
      ),
    );
  }
}