/**
 * Collaborative Paint Canvas Component
 * 실시간 협업 페인팅 캔버스 - 사이버펑크 스타일
 */

import React, { useRef, useEffect, useState, useCallback } from 'react'
import CollaborativePaintEngine, { BrushType } from '../../lib/game-engine/CollaborativePaintEngine'
import { useMultiplayer } from '../../lib/multiplayer/MultiplayerManager'
import { usePerformanceMonitor } from '../../lib/monitoring/PerformanceMonitor'

interface PaintCanvasProps {
  width?: number
  height?: number
  className?: string
  onTerritoryUpdate?: (stats: any[]) => void
}

const CollaborativePaintCanvas: React.FC<PaintCanvasProps> = ({
  width = 800,
  height = 600,
  className = '',
  onTerritoryUpdate
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const engineRef = useRef<CollaborativePaintEngine | null>(null)
  const [paintLevels, setPaintLevels] = useState<Map<string, number>>(new Map())
  const [currentBrush, setCurrentBrush] = useState<BrushType>(BrushType.NEON)
  const [brushSize, setBrushSize] = useState(8)
  const [glitchMode, setGlitchMode] = useState(false)
  const [neonIntensity, setNeonIntensity] = useState(1.0)

  const { isConnected, currentPlayer, currentRoom } = useMultiplayer()
  const { metrics } = usePerformanceMonitor()

  // Initialize paint engine
  useEffect(() => {
    if (!canvasRef.current) return

    engineRef.current = new CollaborativePaintEngine(canvasRef.current)

    // Update paint levels every second
    const paintInterval = setInterval(() => {
      if (engineRef.current) {
        setPaintLevels(engineRef.current.getPaintLevels())

        // Update territory stats
        if (onTerritoryUpdate) {
          const territoryStats = engineRef.current.getTerritoryStats()
          onTerritoryUpdate(territoryStats)
        }
      }
    }, 1000)

    return () => {
      clearInterval(paintInterval)
      if (engineRef.current) {
        engineRef.current.dispose()
      }
    }
  }, [onTerritoryUpdate])

  // Handle brush changes
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.enableGlitchEffect(glitchMode)
      engineRef.current.setNeonIntensity(neonIntensity)
    }
  }, [glitchMode, neonIntensity])

  const handleClearCanvas = useCallback(() => {
    if (engineRef.current) {
      engineRef.current.clearCanvas()
    }
  }, [])

  const handleBrushTypeChange = useCallback((brushType: BrushType) => {
    setCurrentBrush(brushType)
  }, [])

  const toggleGlitchMode = useCallback(() => {
    setGlitchMode(prev => !prev)
  }, [])

  const adjustNeonIntensity = useCallback((delta: number) => {
    setNeonIntensity(prev => Math.max(0, Math.min(2, prev + delta)))
  }, [])

  const getPlayerColor = useCallback(() => {
    if (!currentPlayer || !engineRef.current) return '#ffffff'
    return engineRef.current.getPlayerColor(currentPlayer.id)
  }, [currentPlayer])

  const getPaintLevelForCurrentPlayer = useCallback(() => {
    const playerColor = getPlayerColor()
    return paintLevels.get(playerColor) || 0
  }, [paintLevels, getPlayerColor])

  const renderBrushSelector = () => (
    <div className="brush-selector">
      <h4 className="text-cyber-blue mb-2">Brush Tools</h4>
      <div className="grid grid-cols-3 gap-2">
        {Object.values(BrushType).map(brushType => (
          <button
            key={brushType}
            onClick={() => handleBrushTypeChange(brushType)}
            className={`
              px-3 py-2 text-xs font-mono rounded
              border transition-all duration-200
              ${currentBrush === brushType
                ? 'bg-cyber-pink text-black border-cyber-pink shadow-cyber-pink'
                : 'bg-gray-800 text-cyber-green border-gray-600 hover:border-cyber-blue'
              }
            `}
          >
            {brushType.toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  )

  const renderPaintMeter = () => {
    const paintLevel = getPaintLevelForCurrentPlayer()
    const playerColor = getPlayerColor()

    return (
      <div className="paint-meter">
        <h4 className="text-cyber-blue mb-2">Paint Level</h4>
        <div className="relative h-4 bg-gray-800 rounded border border-gray-600 overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 transition-all duration-300 rounded"
            style={{
              width: `${paintLevel * 100}%`,
              backgroundColor: playerColor,
              boxShadow: `0 0 10px ${playerColor}`
            }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-mono text-white">
              {Math.round(paintLevel * 100)}%
            </span>
          </div>
        </div>
      </div>
    )
  }

  const renderEffectsControls = () => (
    <div className="effects-controls">
      <h4 className="text-cyber-blue mb-2">Effects</h4>
      <div className="space-y-2">
        <button
          onClick={toggleGlitchMode}
          className={`
            w-full px-3 py-2 text-xs font-mono rounded
            border transition-all duration-200
            ${glitchMode
              ? 'bg-red-500 text-white border-red-500 shadow-red'
              : 'bg-gray-800 text-gray-300 border-gray-600 hover:border-gray-400'
            }
          `}
        >
          GLITCH {glitchMode ? 'ON' : 'OFF'}
        </button>

        <div className="neon-intensity">
          <label className="text-xs text-gray-400 block mb-1">NEON INTENSITY</label>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => adjustNeonIntensity(-0.2)}
              className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:border-gray-400"
            >
              -
            </button>
            <span className="text-xs font-mono flex-1 text-center">
              {(neonIntensity * 100).toFixed(0)}%
            </span>
            <button
              onClick={() => adjustNeonIntensity(0.2)}
              className="px-2 py-1 text-xs bg-gray-700 border border-gray-600 rounded hover:border-gray-400"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  const renderPerformanceIndicator = () => {
    if (!metrics) return null

    const fpsColor = metrics.fps >= 50 ? 'text-green-400' :
                    metrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'

    return (
      <div className="performance-indicator text-xs font-mono">
        <div className={`fps ${fpsColor}`}>
          FPS: {Math.round(metrics.fps)}
        </div>
        <div className="text-gray-400">
          MEM: {Math.round(metrics.memoryUsage)}MB
        </div>
      </div>
    )
  }

  const renderConnectionStatus = () => (
    <div className="connection-status text-xs font-mono">
      <div className={`flex items-center space-x-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
        <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400' : 'bg-red-400'} animate-pulse`} />
        <span>{isConnected ? 'CONNECTED' : 'DISCONNECTED'}</span>
      </div>
      {currentRoom && (
        <div className="text-gray-400 mt-1">
          ROOM: {currentRoom.name} ({currentRoom.players.length}/{currentRoom.maxPlayers})
        </div>
      )}
    </div>
  )

  return (
    <div className={`collaborative-paint-canvas ${className}`}>
      {/* Main Canvas */}
      <div className="canvas-container relative">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="border border-cyber-blue rounded-lg shadow-cyber-blue bg-black cursor-crosshair"
          style={{
            filter: glitchMode ? 'hue-rotate(90deg) saturate(1.5)' : 'none'
          }}
        />

        {/* Overlay UI */}
        <div className="absolute top-4 left-4 bg-black bg-opacity-80 rounded p-3 border border-gray-600">
          {renderConnectionStatus()}
          {renderPerformanceIndicator()}
        </div>

        <div className="absolute top-4 right-4 bg-black bg-opacity-80 rounded p-3 border border-gray-600">
          <button
            onClick={handleClearCanvas}
            className="px-3 py-1 text-xs font-mono bg-red-600 text-white rounded border border-red-500 hover:bg-red-700 transition-colors"
          >
            CLEAR CANVAS
          </button>
        </div>
      </div>

      {/* Control Panel */}
      <div className="control-panel mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black bg-opacity-80 rounded p-4 border border-gray-600">
          {renderBrushSelector()}
        </div>

        <div className="bg-black bg-opacity-80 rounded p-4 border border-gray-600">
          {renderPaintMeter()}
        </div>

        <div className="bg-black bg-opacity-80 rounded p-4 border border-gray-600">
          {renderEffectsControls()}
        </div>
      </div>

      {/* Game Info */}
      {currentRoom && (
        <div className="game-info mt-4 bg-black bg-opacity-80 rounded p-4 border border-gray-600">
          <h4 className="text-cyber-blue mb-2">Game Status</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
            <div>
              <span className="text-gray-400">Mode:</span>
              <div className="text-white">{currentRoom.gameMode}</div>
            </div>
            <div>
              <span className="text-gray-400">Status:</span>
              <div className="text-white">{currentRoom.status}</div>
            </div>
            <div>
              <span className="text-gray-400">Players:</span>
              <div className="text-white">{currentRoom.players.length}/{currentRoom.maxPlayers}</div>
            </div>
            <div>
              <span className="text-gray-400">Your Color:</span>
              <div
                className="w-4 h-4 rounded border border-gray-400 inline-block"
                style={{ backgroundColor: getPlayerColor() }}
              />
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .collaborative-paint-canvas {
          font-family: 'JetBrains Mono', monospace;
        }

        .shadow-cyber-blue {
          box-shadow: 0 0 20px rgba(64, 128, 255, 0.3);
        }

        .shadow-cyber-pink {
          box-shadow: 0 0 10px rgba(255, 0, 64, 0.5);
        }

        .shadow-red {
          box-shadow: 0 0 10px rgba(255, 0, 0, 0.5);
        }

        .text-cyber-blue {
          color: #4080ff;
        }

        .text-cyber-green {
          color: #00ff80;
        }

        .text-cyber-pink {
          color: #ff0040;
        }

        .bg-cyber-pink {
          background-color: #ff0040;
        }

        .border-cyber-blue {
          border-color: #4080ff;
        }

        .border-cyber-pink {
          border-color: #ff0040;
        }
      `}</style>
    </div>
  )
}

export default CollaborativePaintCanvas