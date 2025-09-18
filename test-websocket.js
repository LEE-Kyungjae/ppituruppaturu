const io = require('socket.io-client');

// 게임 서버 WebSocket 연결 테스트
async function testGameWebSocket() {
  console.log('🎮 게임 서버 WebSocket 연결 테스트 시작...');

  try {
    // 포트 8081에서 게임 서버 WebSocket 연결 시도
    const socket = io('http://localhost:8081', {
      transports: ['websocket']
    });

    socket.on('connect', () => {
      console.log('✅ WebSocket 연결 성공!');

      // 게임 방 생성 테스트
      socket.emit('create_room', {
        gameType: 'physics_battle_royale',
        maxPlayers: 10
      });
    });

    socket.on('room_created', (room) => {
      console.log('✅ 게임 방 생성 성공:', room);

      // 게임 방 참가 테스트
      socket.emit('join_room', {
        roomId: room.id,
        playerName: 'TestPlayer'
      });
    });

    socket.on('room_joined', (data) => {
      console.log('✅ 게임 방 참가 성공:', data);

      // 연결 테스트 완료
      setTimeout(() => {
        socket.disconnect();
        console.log('🎯 WebSocket 연결 테스트 완료!');
        process.exit(0);
      }, 2000);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ WebSocket 연결 실패:', error.message);
      process.exit(1);
    });

    socket.on('error', (error) => {
      console.error('❌ WebSocket 에러:', error);
    });

  } catch (error) {
    console.error('❌ 테스트 실행 중 에러:', error);
    process.exit(1);
  }
}

// 백엔드 REST API 테스트
async function testRestAPI() {
  console.log('🔗 백엔드 REST API 연결 테스트 시작...');

  try {
    const response = await fetch('http://localhost:8080/health');
    const data = await response.json();

    if (response.ok) {
      console.log('✅ REST API 연결 성공:', data);
      return true;
    } else {
      console.error('❌ REST API 연결 실패:', response.status);
      return false;
    }
  } catch (error) {
    console.error('❌ REST API 테스트 중 에러:', error.message);
    return false;
  }
}

// 메인 테스트 실행
async function runTests() {
  console.log('🚀 백엔드 통합 테스트 시작...\n');

  // 1. REST API 테스트
  const restOk = await testRestAPI();
  if (!restOk) {
    console.error('❌ REST API 테스트 실패 - 백엔드 서버가 실행 중인지 확인하세요');
    process.exit(1);
  }

  console.log('');

  // 2. WebSocket 테스트
  await testGameWebSocket();
}

runTests();