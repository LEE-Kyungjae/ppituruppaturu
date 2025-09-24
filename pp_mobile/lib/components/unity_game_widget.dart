import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_unity_widget/flutter_unity_widget.dart';
import '../services/cross_platform_game_manager.dart';
import '../services/websocket_manager.dart';

class UnityGameWidget extends StatefulWidget {
  final String? gameSceneName;
  final Map<String, dynamic>? gameConfig;
  final Function(UnityWidgetController)? onUnityCreated;
  final Function(String)? onUnityMessage;
  final Function(String)? onUnitySceneLoaded;

  const UnityGameWidget({
    Key? key,
    this.gameSceneName,
    this.gameConfig,
    this.onUnityCreated,
    this.onUnityMessage,
    this.onUnitySceneLoaded,
  }) : super(key: key);

  @override
  State<UnityGameWidget> createState() => _UnityGameWidgetState();
}

class _UnityGameWidgetState extends State<UnityGameWidget> {
  UnityWidgetController? _unityController;
  bool _isUnityLoaded = false;
  bool _isGameReady = false;
  String _gameStatus = 'Initializing...';
  late CrossPlatformGameManager _gameManager;

  @override
  void initState() {
    super.initState();
    _gameManager = CrossPlatformGameManager(WebSocketManager());
    _initializeUnity();
  }

  void _initializeUnity() {
    setState(() {
      _gameStatus = 'Unity 게임 로딩 중...';
    });
  }

  void _onUnityCreated(UnityWidgetController controller) {
    _unityController = controller;
    _isUnityLoaded = true;

    setState(() {
      _gameStatus = 'Unity 연결됨';
    });

    widget.onUnityCreated?.call(controller);

    // Unity와 Flutter 간 메시지 브리지 설정
    // _setupUnityBridge(); // Disabled for now due to API changes

    // 초기 게임 설정 전송
    _sendInitialGameConfig();
  }

  void _setupUnityBridge() {
    if (_unityController == null) return;

    // TODO: Unity → Flutter 메시지 수신 (API 변경으로 임시 비활성화)
    // Unity와 Flutter 간 통신은 다른 방법으로 구현 필요

    setState(() {
      _isGameReady = true;
      _gameStatus = 'Game Ready';
    });

    print('🔗 Unity-Flutter 브리지 설정 완료');
  }

  void _sendInitialGameConfig() {
    if (_unityController == null || !_isUnityLoaded) return;

    final config = {
      'gameMode': 'paintBattle',
      'playerName': 'FlutterPlayer',
      'roomId': 'flutter-room-001',
      'language': 'ko',
      'settings': widget.gameConfig ?? {},
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    // Unity의 GameManager 오브젝트에 설정 전송
    _unityController!.postMessage(
      'GameManager',
      'ReceiveFlutterConfig',
      jsonEncode(config),
    );

    print('📤 Flutter → Unity: 초기 게임 설정 전송');
  }

  void _handleUnityMessage(String message) {
    try {
      final data = jsonDecode(message);
      final messageType = data['type'] as String?;

      switch (messageType) {
        case 'gameReady':
          _handleGameReady(data);
          break;
        case 'gameStateChanged':
          _handleGameStateChanged(data);
          break;
        case 'playerAction':
          _handlePlayerAction(data);
          break;
        case 'gameResult':
          _handleGameResult(data);
          break;
        case 'error':
          _handleUnityError(data);
          break;
        default:
          print('📨 Unity Message: $message');
      }
    } catch (e) {
      print('❌ Unity 메시지 파싱 오류: $e');
    }
  }

  void _handleGameReady(Map<String, dynamic> data) {
    setState(() {
      _isGameReady = true;
      _gameStatus = 'Game Ready';
    });

    print('🎮 Unity 게임 준비 완료');

    // 게임 시작 신호 전송
    sendToUnity('gameStart', {
      'startTime': DateTime.now().millisecondsSinceEpoch,
    });
  }

  void _handleGameStateChanged(Map<String, dynamic> data) {
    setState(() {
      _gameStatus = data['status'] ?? 'Playing';
    });

    // 게임 상태를 다른 Flutter 컴포넌트에 전파
    // _gameManager.onGameStateChanged(data); // Method not available
  }

  void _handlePlayerAction(Map<String, dynamic> data) {
    // 플레이어 액션을 서버나 다른 플레이어에게 전송
    // _gameManager.sendPlayerAction(data); // Method not available
  }

  void _handleGameResult(Map<String, dynamic> data) {
    setState(() {
      _gameStatus = 'Game Finished';
    });

    // 게임 결과 처리
    _showGameResult(data);
  }

  void _handleUnityError(Map<String, dynamic> data) {
    final errorMessage = data['message'] ?? 'Unknown Unity error';
    setState(() {
      _gameStatus = 'Error: $errorMessage';
    });

    print('❌ Unity 에러: $errorMessage');
  }

  void _showGameResult(Map<String, dynamic> result) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (context) => AlertDialog(
        title: const Text('게임 결과'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Text('점수: ${result['score'] ?? 0}'),
            Text('순위: ${result['rank'] ?? 'N/A'}'),
            Text('플레이 시간: ${result['playTime'] ?? 0}초'),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              _restartGame();
            },
            child: const Text('다시 하기'),
          ),
          TextButton(
            onPressed: () {
              Navigator.of(context).pop();
              Navigator.of(context).pop(); // 게임 화면 종료
            },
            child: const Text('메뉴로'),
          ),
        ],
      ),
    );
  }

  void _restartGame() {
    sendToUnity('restartGame', {});
    setState(() {
      _gameStatus = 'Restarting...';
      _isGameReady = false;
    });
  }

  // Flutter → Unity 메시지 전송
  void sendToUnity(String messageType, Map<String, dynamic> data) {
    if (_unityController == null || !_isUnityLoaded) {
      print('⚠️ Unity가 아직 로드되지 않음');
      return;
    }

    final message = {
      'type': messageType,
      'data': data,
      'timestamp': DateTime.now().millisecondsSinceEpoch,
    };

    _unityController!.postMessage(
      'GameManager',
      'ReceiveFlutterMessage',
      jsonEncode(message),
    );

    print('📤 Flutter → Unity: $messageType');
  }

  // 게임 일시정지/재개
  void pauseGame() {
    sendToUnity('pauseGame', {});
  }

  void resumeGame() {
    sendToUnity('resumeGame', {});
  }

  @override
  void dispose() {
    _unityController?.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Stack(
        children: [
          // Unity 게임 뷰
          Positioned.fill(
            child: UnityWidget(
              onUnityCreated: _onUnityCreated,
              onUnityMessage: (message) => _handleUnityMessage(message),
              onUnitySceneLoaded: (sceneName) {
                print('🎬 Unity 씬 로드됨: $sceneName');
              },
              fullscreen: false,
              enablePlaceholder: true,
              placeholder: Container(
                color: const Color(0xFF1A1A2E),
                child: const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      CircularProgressIndicator(color: Color(0xFF00FF88)),
                      SizedBox(height: 16),
                      Text(
                        '삐뚜루빠뚜루 Unity 게임 로딩 중...',
                        style: TextStyle(color: Colors.white, fontSize: 18),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          ),

          // 게임 상태 표시 (상단)
          Positioned(
            top: 50,
            left: 16,
            right: 16,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              decoration: BoxDecoration(
                color: Colors.black54,
                borderRadius: BorderRadius.circular(8),
              ),
              child: Row(
                children: [
                  Icon(
                    _isGameReady ? Icons.videogame_asset : Icons.hourglass_empty,
                    color: _isGameReady ? Colors.green : Colors.orange,
                    size: 16,
                  ),
                  const SizedBox(width: 8),
                  Text(
                    _gameStatus,
                    style: const TextStyle(color: Colors.white, fontSize: 14),
                  ),
                ],
              ),
            ),
          ),

          // 게임 컨트롤 버튼 (하단)
          if (_isGameReady)
            Positioned(
              bottom: 30,
              right: 16,
              child: Column(
                children: [
                  FloatingActionButton(
                    mini: true,
                    heroTag: 'pause',
                    onPressed: pauseGame,
                    backgroundColor: Colors.orange,
                    child: const Icon(Icons.pause),
                  ),
                  const SizedBox(height: 8),
                  FloatingActionButton(
                    mini: true,
                    heroTag: 'settings',
                    onPressed: _showGameSettings,
                    backgroundColor: Colors.blue,
                    child: const Icon(Icons.settings),
                  ),
                ],
              ),
            ),

          // 뒤로가기 버튼
          Positioned(
            top: 50,
            left: 16,
            child: IconButton(
              onPressed: () => Navigator.of(context).pop(),
              icon: const Icon(Icons.arrow_back, color: Colors.white),
              style: IconButton.styleFrom(
                backgroundColor: Colors.black54,
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _showGameSettings() {
    showModalBottomSheet(
      context: context,
      builder: (context) => Container(
        padding: const EdgeInsets.all(16),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            const Text('게임 설정', style: TextStyle(fontSize: 18, fontWeight: FontWeight.bold)),
            const SizedBox(height: 16),
            ListTile(
              leading: const Icon(Icons.volume_up),
              title: const Text('사운드 설정'),
              onTap: () {
                Navigator.pop(context);
                sendToUnity('openSoundSettings', {});
              },
            ),
            ListTile(
              leading: const Icon(Icons.refresh),
              title: const Text('게임 재시작'),
              onTap: () {
                Navigator.pop(context);
                _restartGame();
              },
            ),
            ListTile(
              leading: const Icon(Icons.exit_to_app),
              title: const Text('게임 종료'),
              onTap: () {
                Navigator.pop(context);
                Navigator.pop(context);
              },
            ),
          ],
        ),
      ),
    );
  }
}
