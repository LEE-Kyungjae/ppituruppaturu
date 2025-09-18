'use client'

import { useEffect, useRef, useState } from 'react'

interface SimpleGameCanvasProps {
  gameType: string
  onGameEnd?: (score: number) => void
  onError?: (error: Error) => void
  className?: string
}

export function SimpleGameCanvas({
  gameType,
  onGameEnd,
  onError,
  className = ''
}: SimpleGameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'ended'>('loading')
  const [score, setScore] = useState(0)
  const [gameStarted, setGameStarted] = useState(false)

  // 간단한 물리 시뮬레이션 변수들
  const gameObjects = useRef<any[]>([])
  const animationId = useRef<number>()

  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 크기 설정
    canvas.width = canvas.offsetWidth
    canvas.height = canvas.offsetHeight

    // 초기 게임 오브젝트 생성
    initializeGame()

    setGameState('ready')

    return () => {
      if (animationId.current) {
        cancelAnimationFrame(animationId.current)
      }
    }
  }, [gameType])

  const initializeGame = () => {
    // 게임 타입에 따른 초기화
    switch (gameType) {
      case 'physics_battle_royale':
        initializeBattleRoyale()
        break
      case 'physics_jump':
        initializeJumpGame()
        break
      default:
        initializeDefaultGame()
    }
  }

  const initializeBattleRoyale = () => {
    gameObjects.current = [
      {
        type: 'player',
        x: 400,
        y: 300,
        vx: 0,
        vy: 0,
        width: 20,
        height: 20,
        color: '#ff4444'
      },
      {
        type: 'zone',
        x: 200,
        y: 150,
        radius: 250,
        shrinkRate: 0.5,
        color: '#4444ff'
      }
    ]
  }

  const initializeJumpGame = () => {
    gameObjects.current = [
      {
        type: 'player',
        x: 100,
        y: 400,
        vx: 0,
        vy: 0,
        width: 20,
        height: 20,
        color: '#44ff44',
        onGround: true
      },
      {
        type: 'platform',
        x: 0,
        y: 450,
        width: 800,
        height: 50,
        color: '#888888'
      },
      {
        type: 'platform',
        x: 200,
        y: 350,
        width: 100,
        height: 20,
        color: '#888888'
      }
    ]
  }

  const initializeDefaultGame = () => {
    gameObjects.current = [
      {
        type: 'ball',
        x: Math.random() * 400 + 100,
        y: Math.random() * 300 + 100,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        radius: 10,
        color: `hsl(${Math.random() * 360}, 70%, 60%)`
      }
    ]
  }

  const startGame = () => {
    setGameStarted(true)
    setGameState('playing')
    setScore(0)
    gameLoop()
  }

  const gameLoop = () => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    // 캔버스 클리어
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // 물리 업데이트
    updatePhysics()

    // 렌더링
    renderGame(ctx)

    // 점수 업데이트
    if (gameStarted) {
      setScore(prev => prev + 1)
    }

    // 게임 루프 계속
    if (gameState === 'playing') {
      animationId.current = requestAnimationFrame(gameLoop)
    }
  }

  const updatePhysics = () => {
    gameObjects.current.forEach((obj, index) => {
      switch (obj.type) {
        case 'ball':
          // 기본 물리: 중력과 벽 충돌
          obj.vy += 0.2 // 중력
          obj.x += obj.vx
          obj.y += obj.vy

          // 벽 충돌
          if (obj.x - obj.radius <= 0 || obj.x + obj.radius >= canvasRef.current!.width) {
            obj.vx *= -0.8
            obj.x = Math.max(obj.radius, Math.min(canvasRef.current!.width - obj.radius, obj.x))
          }
          if (obj.y - obj.radius <= 0 || obj.y + obj.radius >= canvasRef.current!.height) {
            obj.vy *= -0.8
            obj.y = Math.max(obj.radius, Math.min(canvasRef.current!.height - obj.radius, obj.y))
          }
          break

        case 'player':
          // 플레이어 물리
          if (gameType === 'physics_jump') {
            obj.vy += 0.5 // 중력
            obj.x += obj.vx
            obj.y += obj.vy

            // 플랫폼 충돌 검사
            gameObjects.current.forEach(platform => {
              if (platform.type === 'platform') {
                if (obj.x < platform.x + platform.width &&
                    obj.x + obj.width > platform.x &&
                    obj.y + obj.height > platform.y &&
                    obj.y + obj.height < platform.y + platform.height + 10) {
                  obj.y = platform.y - obj.height
                  obj.vy = 0
                  obj.onGround = true
                }
              }
            })
          } else {
            // 배틀로얄: 기본 이동
            obj.x += obj.vx * 0.95
            obj.y += obj.vy * 0.95
          }
          break

        case 'zone':
          // 구역 축소
          if (gameType === 'physics_battle_royale') {
            obj.radius = Math.max(50, obj.radius - obj.shrinkRate * 0.01)
          }
          break
      }
    })
  }

  const renderGame = (ctx: CanvasRenderingContext2D) => {
    gameObjects.current.forEach(obj => {
      ctx.save()

      switch (obj.type) {
        case 'ball':
          ctx.fillStyle = obj.color
          ctx.beginPath()
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'player':
          ctx.fillStyle = obj.color
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          break

        case 'platform':
          ctx.fillStyle = obj.color
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height)
          break

        case 'zone':
          ctx.strokeStyle = obj.color
          ctx.lineWidth = 3
          ctx.setLineDash([5, 5])
          ctx.beginPath()
          ctx.arc(obj.x, obj.y, obj.radius, 0, Math.PI * 2)
          ctx.stroke()
          break
      }

      ctx.restore()
    })

    // UI 렌더링
    ctx.fillStyle = '#ffffff'
    ctx.font = '20px Arial'
    ctx.fillText(`점수: ${score}`, 10, 30)

    if (gameType === 'physics_battle_royale') {
      const zone = gameObjects.current.find(obj => obj.type === 'zone')
      if (zone) {
        ctx.fillText(`구역 크기: ${Math.round(zone.radius)}`, 10, 60)
      }
    }
  }

  const handleKeyDown = (e: KeyboardEvent) => {
    if (gameState !== 'playing') return

    const player = gameObjects.current.find(obj => obj.type === 'player')
    if (!player) return

    switch (e.key) {
      case 'ArrowLeft':
      case 'a':
      case 'A':
        player.vx = Math.max(player.vx - 1, -5)
        break
      case 'ArrowRight':
      case 'd':
      case 'D':
        player.vx = Math.min(player.vx + 1, 5)
        break
      case 'ArrowUp':
      case 'w':
      case 'W':
      case ' ':
        if (gameType === 'physics_jump' && player.onGround) {
          player.vy = -12
          player.onGround = false
        } else if (gameType === 'physics_battle_royale') {
          player.vy = Math.max(player.vy - 1, -5)
        }
        break
      case 'ArrowDown':
      case 's':
      case 'S':
        if (gameType === 'physics_battle_royale') {
          player.vy = Math.min(player.vy + 1, 5)
        }
        break
    }
  }

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState, gameType])

  const handleEndGame = () => {
    setGameState('ended')
    if (animationId.current) {
      cancelAnimationFrame(animationId.current)
    }
    onGameEnd?.(score)
  }

  const handleRestartGame = () => {
    initializeGame()
    startGame()
  }

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        className="w-full h-full bg-gray-900 rounded-lg border border-gray-700"
        style={{ minHeight: '400px' }}
      />

      {/* 게임 컨트롤 */}
      <div className="absolute top-4 right-4 flex gap-2">
        {gameState === 'ready' && (
          <button
            onClick={startGame}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            게임 시작
          </button>
        )}

        {gameState === 'playing' && (
          <button
            onClick={handleEndGame}
            className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            게임 종료
          </button>
        )}

        {gameState === 'ended' && (
          <button
            onClick={handleRestartGame}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
          >
            다시하기
          </button>
        )}
      </div>

      {/* 로딩 상태 */}
      {gameState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">게임 초기화 중...</p>
          </div>
        </div>
      )}

      {/* 게임 종료 오버레이 */}
      {gameState === 'ended' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
          <div className="bg-white p-6 rounded-lg text-center">
            <h3 className="text-xl font-bold mb-2">게임 종료!</h3>
            <p className="text-lg mb-4">최종 점수: {score}</p>
            <button
              onClick={handleRestartGame}
              className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              다시하기
            </button>
          </div>
        </div>
      )}

      {/* 조작법 안내 */}
      {gameState === 'ready' && (
        <div className="absolute bottom-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded-lg text-sm">
          <div className="font-semibold mb-2">조작법:</div>
          {gameType === 'physics_jump' ? (
            <div>
              <div>← → : 좌우 이동</div>
              <div>스페이스 : 점프</div>
            </div>
          ) : gameType === 'physics_battle_royale' ? (
            <div>
              <div>WASD : 이동</div>
              <div>구역 밖으로 나가지 마세요!</div>
            </div>
          ) : (
            <div>클릭하여 상호작용</div>
          )}
        </div>
      )}
    </div>
  )
}