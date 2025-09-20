import React, { useEffect, useRef, useState, useCallback } from 'react'
import { WebSocketGameManager, GameEventType, ConnectionState, GamePlatform, GameMessage, PlayerState } from '../../lib/cross-platform/WebSocketGameManager'

interface GameObject {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  type: 'player' | 'platform' | 'remote_player'
  platform?: GamePlatform
  username?: string
  active: boolean
}

interface RemotePlayer {
  username: string
  platform: GamePlatform
  position: { x: number; y: number }
  score: number
  lastUpdate: number
  isActive: boolean
}

export default function CrossPlatformPhysicsJump() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()

  // Game state
  const [gameState, setGameState] = useState<'menu' | 'connecting' | 'playing' | 'gameOver'>('menu')
  const [score, setScore] = useState(0)
  const [connectionState, setConnectionState] = useState<ConnectionState>(ConnectionState.DISCONNECTED)
  const [remotePlayers, setRemotePlayers] = useState<Map<string, RemotePlayer>>(new Map())
  const [playerCount, setPlayerCount] = useState(0)

  // Game objects
  const gameObjects = useRef<GameObject[]>([])
  const platforms = useRef<GameObject[]>([])
  const localPlayer = useRef<GameObject | null>(null)

  // Game mechanics
  const gravity = 0.5
  const jumpForce = -12
  const playerSpeed = 5

  // WebSocket manager
  const wsManager = useRef<WebSocketGameManager | null>(null)
  const username = useRef(`WebPlayer_${Math.floor(Math.random() * 1000)}`)
  const roomId = useRef<string>()

  // Initialize WebSocket manager
  useEffect(() => {
    wsManager.current = new WebSocketGameManager()

    // Setup message handlers
    wsManager.current.addMessageHandler(GameEventType.GAME_STATE, handleGameStateMessage)
    wsManager.current.addMessageHandler(GameEventType.PLAYER_JOIN, handlePlayerJoin)
    wsManager.current.addMessageHandler(GameEventType.PLAYER_LEAVE, handlePlayerLeave)
    wsManager.current.addMessageHandler(GameEventType.PLAYER_ACTION, handlePlayerAction)

    // Setup connection listener
    wsManager.current.addEventListener('connectionChange', (event: any) => {
      const state = event.detail as ConnectionState
      setConnectionState(state)

      if (state === ConnectionState.CONNECTED) {
        joinCrossPlatformGame()
      }
    })

    return () => {
      wsManager.current?.disconnect()
    }
  }, [])

  const handleGameStateMessage = useCallback((message: GameMessage) => {
    const data = message.data

    if (data.action === 'sync_response' && data.gameState) {
      const gameState = data.gameState

      // Update remote players
      const updatedRemotePlayers = new Map<string, RemotePlayer>()

      for (const [playerName, playerState] of Object.entries(gameState.players)) {
        if (playerName !== username.current) {
          const state = playerState as PlayerState
          updatedRemotePlayers.set(playerName, {
            username: state.username,
            platform: state.platform,
            position: state.position,
            score: state.score,
            lastUpdate: state.lastUpdate,
            isActive: state.isActive
          })
        }
      }

      setRemotePlayers(updatedRemotePlayers)
      setPlayerCount(Object.keys(gameState.players).length)
    }
  }, [])

  const handlePlayerJoin = useCallback((message: GameMessage) => {
    if (message.data.playerState && message.data.playerState.username !== username.current) {
      const playerState = message.data.playerState as PlayerState

      setRemotePlayers(prev => {
        const updated = new Map(prev)
        updated.set(playerState.username, {
          username: playerState.username,
          platform: playerState.platform,
          position: playerState.position,
          score: playerState.score,
          lastUpdate: playerState.lastUpdate,
          isActive: playerState.isActive
        })
        return updated
      })

      setPlayerCount(prev => prev + 1)

      // Show notification
      showNotification(`${playerState.username} joined from ${playerState.platform}!`)
    }
  }, [])

  const handlePlayerLeave = useCallback((message: GameMessage) => {
    const playerName = message.data.username
    if (playerName && playerName !== username.current) {
      setRemotePlayers(prev => {
        const updated = new Map(prev)
        updated.delete(playerName)
        return updated
      })

      setPlayerCount(prev => Math.max(0, prev - 1))
      showNotification(`${playerName} left the game`)
    }
  }, [])

  const handlePlayerAction = useCallback((message: GameMessage) => {
    const action = message.data.action
    const from = message.from

    if (from && from !== username.current) {
      switch (action) {
        case 'jump':
          // Trigger visual feedback for remote player jump
          showJumpEffect(from, message.data.actionData?.position)
          break
        case 'game_end':
          showNotification(`${from} finished with score ${message.data.actionData?.finalScore}!`)
          break
      }
    }
  }, [])

  const showNotification = (message: string) => {
    // You could implement a toast notification system here
    console.log('Notification:', message)
  }

  const showJumpEffect = (playerName: string, position?: { x: number; y: number }) => {
    // Add visual effect for remote player jump
    console.log(`${playerName} jumped!`, position)
  }

  const connectToServer = async () => {
    setGameState('connecting')

    const connected = await wsManager.current?.connect({
      serverUrl: 'ws://localhost:8082',
      username: username.current,
      roomId: 'physics_jump_room'
    })

    if (!connected) {
      setGameState('menu')
      alert('Failed to connect to game server')
    }
  }

  const joinCrossPlatformGame = async () => {
    roomId.current = `cross_platform_jump_${Date.now()}`

    const joined = await wsManager.current?.joinCrossPlatformGame(
      roomId.current,
      'physics_jump',
      {
        position: { x: 400, y: 300 },
        velocity: { x: 0, y: 0 },
        onGround: false
      }
    )

    if (joined) {
      initializeGame()
      setGameState('playing')
    }
  }

  const initializeGame = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    // Clear previous game objects
    gameObjects.current = []
    platforms.current = []

    // Create platforms
    const platformPositions = [
      { x: 200, y: 500 },
      { x: 600, y: 450 },
      { x: 400, y: 400 },
      { x: 800, y: 350 },
      { x: 100, y: 300 },
      { x: 700, y: 250 },
      { x: 300, y: 200 },
      { x: 900, y: 150 },
      { x: 500, y: 100 }
    ]

    platformPositions.forEach((pos, index) => {
      const platform: GameObject = {
        id: `platform_${index}`,
        x: pos.x,
        y: pos.y,
        vx: 0,
        vy: 0,
        width: 120,
        height: 20,
        color: '#8B4513',
        type: 'platform',
        active: true
      }
      platforms.current.push(platform)
      gameObjects.current.push(platform)
    })

    // Create local player
    localPlayer.current = {
      id: 'local_player',
      x: 400,
      y: 450,
      vx: 0,
      vy: 0,
      width: 30,
      height: 30,
      color: '#4285f4',
      type: 'player',
      active: true
    }
    gameObjects.current.push(localPlayer.current)

    setScore(0)
    startGameLoop()
  }

  const startGameLoop = () => {
    const gameLoop = () => {
      updateGame()
      renderGame()
      animationRef.current = requestAnimationFrame(gameLoop)
    }
    gameLoop()
  }

  const updateGame = () => {
    if (!localPlayer.current || gameState !== 'playing') return

    const player = localPlayer.current

    // Apply gravity
    player.vy += gravity

    // Apply horizontal movement (could be keyboard controlled)
    // For now, we'll use simple physics

    // Update position
    player.x += player.vx
    player.y += player.vy

    // Platform collision detection
    let onGround = false
    platforms.current.forEach(platform => {
      if (player.x < platform.x + platform.width &&
          player.x + player.width > platform.x &&
          player.y < platform.y + platform.height &&
          player.y + player.height > platform.y &&
          player.vy > 0) {
        player.y = platform.y - player.height
        player.vy = 0
        onGround = true
      }
    })

    // Horizontal velocity damping
    player.vx *= 0.95

    // Boundary check
    const canvas = canvasRef.current
    if (!canvas) return

    if (player.x < 0) player.x = 0
    if (player.x + player.width > canvas.width) player.x = canvas.width - player.width

    // Game over check (fall below screen)
    if (player.y > canvas.height + 100) {
      endGame()
      return
    }

    // Update score based on height
    const heightScore = Math.max(0, Math.floor((500 - player.y) / 50))
    if (heightScore > score) {
      setScore(heightScore)

      // Send score update to other players
      wsManager.current?.sendScoreUpdate(heightScore)
    }

    // Send player state to other players
    wsManager.current?.updateLocalPlayerState(
      { x: player.x, y: player.y },
      {
        velocity: { x: player.vx, y: player.vy },
        onGround,
        score: heightScore
      },
      heightScore
    )
  }

  const renderGame = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Clear canvas
    ctx.fillStyle = '#87CEEB'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Render platforms
    platforms.current.forEach(platform => {
      ctx.fillStyle = platform.color
      ctx.fillRect(platform.x, platform.y, platform.width, platform.height)

      // Add platform border
      ctx.strokeStyle = '#654321'
      ctx.lineWidth = 2
      ctx.strokeRect(platform.x, platform.y, platform.width, platform.height)
    })

    // Render local player
    if (localPlayer.current) {
      const player = localPlayer.current
      ctx.fillStyle = player.color
      ctx.fillRect(player.x, player.y, player.width, player.height)

      // Add player border
      ctx.strokeStyle = '#1a73e8'
      ctx.lineWidth = 2
      ctx.strokeRect(player.x, player.y, player.width, player.height)

      // Add "WEB" label
      ctx.fillStyle = 'white'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('WEB', player.x + player.width / 2, player.y + player.height / 2 + 4)
    }

    // Render remote players
    remotePlayers.forEach(remotePlayer => {
      if (remotePlayer.isActive) {
        const color = getPlatformColor(remotePlayer.platform)
        ctx.fillStyle = color
        ctx.fillRect(remotePlayer.position.x, remotePlayer.position.y, 30, 30)

        // Add border
        ctx.strokeStyle = color
        ctx.lineWidth = 2
        ctx.strokeRect(remotePlayer.position.x, remotePlayer.position.y, 30, 30)

        // Add platform label
        ctx.fillStyle = 'white'
        ctx.font = '10px Arial'
        ctx.textAlign = 'center'
        const label = remotePlayer.platform.toUpperCase()
        ctx.fillText(label, remotePlayer.position.x + 15, remotePlayer.position.y + 18)

        // Add username
        ctx.fillStyle = 'black'
        ctx.font = '12px Arial'
        ctx.fillText(
          `${remotePlayer.username} (${remotePlayer.score})`,
          remotePlayer.position.x + 15,
          remotePlayer.position.y - 5
        )
      }
    })

    // Render UI
    renderUI(ctx, canvas)
  }

  const renderUI = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) => {
    // Score
    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px Arial'
    ctx.textAlign = 'left'
    ctx.fillText(`Score: ${score}`, 20, 40)

    // Connection status
    const statusColor = connectionState === ConnectionState.CONNECTED ? '#4CAF50' : '#f44336'
    ctx.fillStyle = statusColor
    ctx.fillRect(20, 60, 12, 12)

    ctx.fillStyle = 'white'
    ctx.font = '14px Arial'
    ctx.fillText(`${connectionState} (${playerCount} players)`, 40, 71)

    // Controls instruction
    ctx.fillStyle = 'white'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('Click to jump! Play with mobile users in real-time!', canvas.width / 2, canvas.height - 30)
  }

  const getPlatformColor = (platform: GamePlatform): string => {
    switch (platform) {
      case GamePlatform.MOBILE:
        return '#FF6B6B'
      case GamePlatform.WEB:
        return '#4285f4'
      case GamePlatform.DESKTOP:
        return '#9C27B0'
      default:
        return '#757575'
    }
  }

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing' || !localPlayer.current) return

    const player = localPlayer.current

    // Make player jump
    if (Math.abs(player.vy) < 2) { // Only jump if not already jumping fast
      player.vy = jumpForce

      // Send jump action to other players
      wsManager.current?.sendPlayerAction('jump', {
        position: { x: player.x, y: player.y },
        timestamp: Date.now()
      })
    }
  }

  const endGame = () => {
    setGameState('gameOver')

    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    // Send game end event
    wsManager.current?.sendPlayerAction('game_end', {
      finalScore: score,
      reason: 'fell_off_screen'
    })
  }

  const restartGame = () => {
    if (gameState === 'gameOver') {
      initializeGame()
      setGameState('playing')
    }
  }

  const leaveGame = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current)
    }

    wsManager.current?.leaveRoom()
    setGameState('menu')
    setRemotePlayers(new Map())
    setPlayerCount(0)
  }

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-400 to-blue-600 flex flex-col items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-2xl p-6 max-w-4xl w-full">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            🎮 Cross-Platform Physics Jump
          </h1>
          <p className="text-lg text-gray-600">
            Play with mobile and web users in real-time!
          </p>
        </div>

        {gameState === 'menu' && (
          <div className="text-center space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-blue-800 mb-2">
                Cross-Platform Multiplayer
              </h3>
              <p className="text-blue-600">
                Connect with players on mobile devices and other web browsers.
                Jump together and compete for the highest score!
              </p>
            </div>

            <button
              onClick={connectToServer}
              className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-8 rounded-lg text-xl transition-colors"
            >
              🌐 Connect & Play
            </button>

            <div className="text-sm text-gray-500 space-y-1">
              <p>👤 Your username: {username.current}</p>
              <p>🎯 Platform: Web Browser</p>
            </div>
          </div>
        )}

        {gameState === 'connecting' && (
          <div className="text-center space-y-4">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-lg">Connecting to game server...</p>
          </div>
        )}

        {(gameState === 'playing' || gameState === 'gameOver') && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <div className="text-lg font-semibold">
                  Score: {score}
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${
                    connectionState === ConnectionState.CONNECTED ? 'bg-green-500' : 'bg-red-500'
                  }`}></div>
                  <span className="text-sm">
                    {playerCount} player{playerCount !== 1 ? 's' : ''} online
                  </span>
                </div>
              </div>

              <button
                onClick={leaveGame}
                className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded transition-colors"
              >
                Leave Game
              </button>
            </div>

            <div className="border-2 border-gray-300 rounded-lg overflow-hidden">
              <canvas
                ref={canvasRef}
                width={1000}
                height={600}
                onClick={handleCanvasClick}
                className="w-full h-auto cursor-pointer bg-sky-200"
                style={{ maxHeight: '60vh' }}
              />
            </div>

            {remotePlayers.size > 0 && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <h4 className="font-semibold text-gray-700 mb-2">Connected Players:</h4>
                <div className="flex flex-wrap gap-2">
                  {Array.from(remotePlayers.values()).map(player => (
                    <div
                      key={player.username}
                      className="flex items-center space-x-2 bg-white px-3 py-1 rounded-full text-sm"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: getPlatformColor(player.platform) }}
                      ></div>
                      <span>{player.username}</span>
                      <span className="text-gray-500">({player.platform})</span>
                      <span className="font-semibold">{player.score}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {gameState === 'gameOver' && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-center">
                <h3 className="text-xl font-bold text-red-800 mb-2">Game Over!</h3>
                <p className="text-red-600 mb-4">Final Score: {score}</p>
                <button
                  onClick={restartGame}
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded transition-colors"
                >
                  🔄 Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}