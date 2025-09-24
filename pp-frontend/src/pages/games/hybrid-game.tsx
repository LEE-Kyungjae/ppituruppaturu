import React, { useState, useEffect, useCallback } from 'react'
import Head from 'next/head'
import UnityWebGLWrapper, { UnityMessaging } from '../../components/UnityWebGLWrapper'
import { useFlutterBridge } from '../../lib/cross-platform/FlutterWebBridge'

interface GameSession {
  id: string
  playerName: string
  startTime: number
  currentScore: number
  gameState: 'waiting' | 'playing' | 'paused' | 'ended'
}

interface HybridGameState {
  unityLoaded: boolean
  flutterConnected: boolean
  gameMode: 'unity' | 'threejs' | 'hybrid'
  session: GameSession | null
}

export default function HybridGame() {
  const [gameState, setGameState] = useState<HybridGameState>({
    unityLoaded: false,
    flutterConnected: false,
    gameMode: 'hybrid',
    session: null
  })

  const [playerName, setPlayerName] = useState('')
  const [isGameStarted, setIsGameStarted] = useState(false)

  // Flutter 브리지 훅
  const {
    isConnected: flutterConnected,
    sendToFlutter,
    on: onFlutterMessage,
    off: offFlutterMessage,
    notifyGameStarted,
    updateGameState,
    submitGameResult
  } = useFlutterBridge()

  // Unity WebGL 설정
  const unityConfig = {
    dataUrl: '/unity/Build/WebGL.data',
    frameworkUrl: '/unity/Build/WebGL.framework.js',
    codeUrl: '/unity/Build/WebGL.wasm',
    streamingAssetsUrl: '/unity/StreamingAssets',
    companyName: '삐뚜루빠뚜루',
    productName: '삐뚜루빠뚜루 페인트 게임',
    productVersion: '1.0'
  }

  // 게임 상태 업데이트
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      flutterConnected
    }))
  }, [flutterConnected])

  // Unity 로딩 완료 핸들러
  const handleUnityLoaded = useCallback(() => {
    console.log('Unity WebGL loaded successfully')
    setGameState(prev => ({
      ...prev,
      unityLoaded: true
    }))
  }, [])

  // Unity 에러 핸들러
  const handleUnityError = useCallback((error: string) => {
    console.error('Unity WebGL error:', error)
    // Fallback to Three.js mode
    setGameState(prev => ({
      ...prev,
      gameMode: 'threejs'
    }))
  }, [])

  // Unity에서 오는 메시지 핸들러
  const handleUnityMessage = useCallback((message: any) => {
    console.log('Message from Unity:', message)

    switch (message.type) {
      case 'game_started':
        setIsGameStarted(true)
        if (gameState.session) {
          notifyGameStarted(gameState.session.id, gameState.session.playerName)
        }
        break

      case 'game_state_update':
        if (gameState.session) {
          const updatedState = {
            score: message.data.score,
            gameTime: message.data.gameTime,
            playerName: gameState.session.playerName,
            paintCoverage: message.data.paintCoverage,
            state: message.data.state
          }
          updateGameState(updatedState)
        }
        break

      case 'game_ended':
        if (gameState.session) {
          const result = {
            score: message.data.score,
            gameTime: message.data.gameTime,
            victory: message.data.victory,
            stats: message.data.stats,
            sessionId: gameState.session.id
          }
          submitGameResult(result)
        }
        setIsGameStarted(false)
        break
    }
  }, [gameState.session, notifyGameStarted, updateGameState, submitGameResult])

  // Flutter 메시지 핸들러 설정
  useEffect(() => {
    const handleFlutterMessage = (message: any) => {
      console.log('Message from Flutter:', message)

      switch (message.type) {
        case 'start_game_request':
          if (gameState.unityLoaded) {
            UnityMessaging.startGame(message.data.playerName, message.data.config)
          }
          break

        case 'pause_game':
          if (gameState.unityLoaded) {
            UnityMessaging.pauseGame()
          }
          break

        case 'resume_game':
          if (gameState.unityLoaded) {
            UnityMessaging.resumeGame()
          }
          break

        case 'player_input':
          if (gameState.unityLoaded) {
            UnityMessaging.sendPlayerInput(message.data)
          }
          break
      }
    }

    onFlutterMessage('*', handleFlutterMessage)

    return () => {
      offFlutterMessage('*', handleFlutterMessage)
    }
  }, [gameState.unityLoaded, onFlutterMessage, offFlutterMessage])

  // 게임 시작
  const startGame = useCallback(() => {
    if (!playerName.trim()) return

    const session: GameSession = {
      id: `session_${Date.now()}`,
      playerName: playerName.trim(),
      startTime: Date.now(),
      currentScore: 0,
      gameState: 'playing'
    }

    setGameState(prev => ({ ...prev, session }))

    // Unity로 게임 시작 메시지 전송
    if (gameState.unityLoaded) {
      UnityMessaging.startGame(playerName.trim(), {
        mode: 'paint',
        difficulty: 'normal',
        timeLimit: 300
      })
    }

    // Flutter로 게임 시작 알림
    if (flutterConnected) {
      notifyGameStarted(session.id, session.playerName)
    }

    setIsGameStarted(true)
  }, [playerName, gameState.unityLoaded, flutterConnected, notifyGameStarted])

  // 게임 일시정지
  const pauseGame = useCallback(() => {
    if (gameState.unityLoaded) {
      UnityMessaging.pauseGame()
    }
    if (flutterConnected) {
      sendToFlutter({
        type: 'game_paused',
        data: { sessionId: gameState.session?.id }
      })
    }
  }, [gameState.unityLoaded, gameState.session, flutterConnected, sendToFlutter])

  // 게임 재개
  const resumeGame = useCallback(() => {
    if (gameState.unityLoaded) {
      UnityMessaging.resumeGame()
    }
    if (flutterConnected) {
      sendToFlutter({
        type: 'game_resumed',
        data: { sessionId: gameState.session?.id }
      })
    }
  }, [gameState.unityLoaded, gameState.session, flutterConnected, sendToFlutter])

  return (
    <>
      <Head>
        <title>삐뚜루빠뚜루 - Hybrid Game</title>
        <meta name="description" content="Unity + Flutter + Web 하이브리드 게임" />
      </Head>

      <div className="hybrid-game-container">
        {/* 헤더 */}
        <div className="game-header">
          <h1 className="game-title">PITTURU HYBRID CORE</h1>
          <div className="connection-status">
            <div className={`status-indicator ${gameState.unityLoaded ? 'connected' : 'disconnected'}`}>
              Unity: {gameState.unityLoaded ? 'READY' : 'LOADING'}
            </div>
            <div className={`status-indicator ${flutterConnected ? 'connected' : 'disconnected'}`}>
              Flutter: {flutterConnected ? 'CONNECTED' : 'DISCONNECTED'}
            </div>
          </div>
        </div>

        {/* 게임 시작 인터페이스 */}
        {!isGameStarted && (
          <div className="game-start-overlay">
            <div className="start-container">
              <h2>ENTER THE GAME</h2>
              <input
                type="text"
                placeholder="Enter your name..."
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                className="player-name-input"
                maxLength={20}
              />
              <button
                onClick={startGame}
                disabled={!playerName.trim() || !gameState.unityLoaded}
                className="start-game-button"
              >
                {gameState.unityLoaded ? 'START GAME' : 'INITIALIZING...'}
              </button>
            </div>
          </div>
        )}

        {/* 게임 제어 버튼 */}
        {isGameStarted && (
          <div className="game-controls">
            <button onClick={pauseGame} className="control-button pause">
              ⏸ PAUSE
            </button>
            <button onClick={resumeGame} className="control-button resume">
              ▶ RESUME
            </button>
            <button
              onClick={() => {
                UnityMessaging.endGame()
                setIsGameStarted(false)
              }}
              className="control-button end"
            >
              🚪 END GAME
            </button>
          </div>
        )}

        {/* Unity WebGL 게임 영역 */}
        <div className="game-area">
          <UnityWebGLWrapper
            config={unityConfig}
            width={1024}
            height={768}
            onLoaded={handleUnityLoaded}
            onError={handleUnityError}
            onMessage={handleUnityMessage}
            className="unity-game"
          />
        </div>

        {/* Flutter 브리지 상태 */}
        <div className="bridge-status">
          <div className="status-panel">
            <h3>BRIDGE STATUS</h3>
            <div>Game Mode: {gameState.gameMode.toUpperCase()}</div>
            <div>Session: {gameState.session?.id || 'None'}</div>
            <div>Player: {gameState.session?.playerName || 'Anonymous'}</div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .hybrid-game-container {
          min-height: 100vh;
          background: #000;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          padding: 20px;
        }

        .game-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px 0;
          border-bottom: 2px solid #00ffff;
          margin-bottom: 20px;
        }

        .game-title {
          font-size: 32px;
          font-weight: bold;
          margin: 0;
          text-shadow: 0 0 10px #00ffff;
        }

        .connection-status {
          display: flex;
          gap: 15px;
        }

        .status-indicator {
          padding: 8px 12px;
          border: 1px solid;
          font-size: 12px;
          font-weight: bold;
        }

        .status-indicator.connected {
          color: #00ff00;
          border-color: #00ff00;
          box-shadow: 0 0 5px rgba(0, 255, 0, 0.3);
        }

        .status-indicator.disconnected {
          color: #ff0080;
          border-color: #ff0080;
          box-shadow: 0 0 5px rgba(255, 0, 128, 0.3);
        }

        .game-start-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 100;
        }

        .start-container {
          text-align: center;
          max-width: 400px;
          padding: 40px;
          border: 2px solid #00ffff;
          background: rgba(0, 0, 0, 0.8);
        }

        .start-container h2 {
          margin-bottom: 30px;
          font-size: 24px;
          text-shadow: 0 0 10px #00ffff;
        }

        .player-name-input {
          width: 100%;
          padding: 15px;
          background: #000;
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          margin-bottom: 20px;
          outline: none;
        }

        .player-name-input:focus {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        .start-game-button {
          width: 100%;
          padding: 15px;
          background: linear-gradient(45deg, #ff0080, #00ffff);
          border: none;
          color: #000;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .start-game-button:hover:not(:disabled) {
          transform: scale(1.05);
          box-shadow: 0 0 20px rgba(255, 0, 128, 0.5);
        }

        .start-game-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .game-controls {
          display: flex;
          gap: 10px;
          margin-bottom: 20px;
          justify-content: center;
        }

        .control-button {
          padding: 10px 20px;
          border: 2px solid;
          background: transparent;
          color: inherit;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .control-button.pause {
          border-color: #ffff00;
          color: #ffff00;
        }

        .control-button.resume {
          border-color: #00ff00;
          color: #00ff00;
        }

        .control-button.end {
          border-color: #ff0080;
          color: #ff0080;
        }

        .control-button:hover {
          background: currentColor;
          color: #000;
          box-shadow: 0 0 15px currentColor;
        }

        .game-area {
          display: flex;
          justify-content: center;
          margin-bottom: 20px;
        }

        .unity-game {
          max-width: 100%;
          height: auto;
        }

        .bridge-status {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 200px;
        }

        .status-panel {
          background: rgba(0, 0, 0, 0.8);
          border: 1px solid #00ffff;
          padding: 15px;
          font-size: 12px;
        }

        .status-panel h3 {
          margin: 0 0 10px 0;
          font-size: 14px;
        }

        .status-panel div {
          margin-bottom: 5px;
        }

        @media (max-width: 768px) {
          .game-header {
            flex-direction: column;
            gap: 10px;
          }

          .game-title {
            font-size: 24px;
          }

          .connection-status {
            flex-direction: column;
            align-items: center;
          }

          .bridge-status {
            position: relative;
            bottom: auto;
            right: auto;
            width: 100%;
            margin-top: 20px;
          }
        }
      `}</style>
    </>
  )
}
