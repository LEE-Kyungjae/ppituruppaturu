'use client'

import { useEffect, useRef, useState } from 'react'
import Phaser from 'phaser'
import { GameEngineManager } from './GameEngineManager'
import { GameConfig, GameType } from './types'

interface GameCanvasProps {
  gameType: GameType
  gameConfig?: Partial<GameConfig>
  onGameEnd?: (score: number) => void
  onError?: (error: Error) => void
  className?: string
}

export function GameCanvas({
  gameType,
  gameConfig = {},
  onGameEnd,
  onError,
  className = ''
}: GameCanvasProps) {
  const gameRef = useRef<HTMLDivElement>(null)
  const engineRef = useRef<GameEngineManager | null>(null)
  const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'ended'>('loading')
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!gameRef.current) return

    const initializeGame = async () => {
      try {
        // 게임 엔진 매니저 생성
        const engine = new GameEngineManager({
          parent: gameRef.current!,
          gameType,
          config: gameConfig,
          onGameEnd: (score) => {
            setGameState('ended')
            onGameEnd?.(score)
          },
          onError: (err) => {
            setError(err.message)
            onError?.(err)
          }
        })

        // 게임 초기화
        await engine.initialize()
        engineRef.current = engine
        setGameState('ready')

        // 자동 시작 (필요시)
        if (gameConfig.autoStart) {
          engine.startGame()
          setGameState('playing')
        }
      } catch (err) {
        const error = err as Error
        setError(error.message)
        onError?.(error)
      }
    }

    initializeGame()

    // 클린업
    return () => {
      if (engineRef.current) {
        engineRef.current.destroy()
        engineRef.current = null
      }
    }
  }, [gameType, onGameEnd, onError])

  const handleStartGame = () => {
    if (engineRef.current && gameState === 'ready') {
      engineRef.current.startGame()
      setGameState('playing')
    }
  }

  const handleRestartGame = () => {
    if (engineRef.current) {
      engineRef.current.restartGame()
      setGameState('playing')
    }
  }

  const handlePauseGame = () => {
    if (engineRef.current && gameState === 'playing') {
      engineRef.current.pauseGame()
    }
  }

  if (error) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-[400px] ${className}`}>
        <div className="text-red-500 text-center">
          <h3 className="text-lg font-semibold mb-2">게임 로드 실패</h3>
          <p className="text-sm">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative ${className}`}>
      {/* 게임 캔버스 */}
      <div
        ref={gameRef}
        className="w-full h-full bg-gray-900 rounded-lg overflow-hidden"
        style={{ minHeight: '400px' }}
      />

      {/* 게임 컨트롤 오버레이 */}
      {gameState !== 'loading' && (
        <div className="absolute top-4 right-4 flex gap-2">
          {gameState === 'ready' && (
            <button
              onClick={handleStartGame}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              게임 시작
            </button>
          )}

          {gameState === 'playing' && (
            <button
              onClick={handlePauseGame}
              className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg font-semibold transition-colors"
            >
              일시정지
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
      )}

      {/* 로딩 인디케이터 */}
      {gameState === 'loading' && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-75 rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mb-4"></div>
            <p className="text-white">게임 로딩 중...</p>
          </div>
        </div>
      )}
    </div>
  )
}