/**
 * Game Analytics Dashboard
 * 실시간 게임 분석 대시보드 - 사이버펑크 UI
 */

import React, { useState, useEffect, useRef } from 'react'
import { gameAnalytics } from '../../lib/analytics/GameAnalyticsEngine'
import { usePerformanceMonitor } from '../../lib/monitoring/PerformanceMonitor'

interface AnalyticsDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const GameAnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ isOpen, onClose }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [currentMetrics, setCurrentMetrics] = useState(gameAnalytics.getCurrentMetrics())
  const [realTimeData, setRealTimeData] = useState(gameAnalytics.getRealTimeAnalytics())
  const [performanceHistory, setPerformanceHistory] = useState(gameAnalytics.getPerformanceHistory())
  const [heatmapData, setHeatmapData] = useState(gameAnalytics.getHeatmapData())
  const [activeTab, setActiveTab] = useState<'overview' | 'performance' | 'behavior' | 'heatmap'>('overview')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const { metrics: liveMetrics } = usePerformanceMonitor()

  // Update data every second
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      setCurrentMetrics(gameAnalytics.getCurrentMetrics())
      setRealTimeData(gameAnalytics.getRealTimeAnalytics())
      setPerformanceHistory(gameAnalytics.getPerformanceHistory())
      setHeatmapData(gameAnalytics.getHeatmapData())
    }, 1000)

    return () => clearInterval(interval)
  }, [autoRefresh])

  // Render heatmap on canvas
  useEffect(() => {
    if (activeTab !== 'heatmap' || !canvasRef.current || !heatmapData.length) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')!

    // Clear canvas
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw heatmap points
    heatmapData.forEach(point => {
      const intensity = Math.min(1, point.intensity)
      const radius = 20 * intensity

      // Create radial gradient
      const gradient = ctx.createRadialGradient(point.x, point.y, 0, point.x, point.y, radius)

      const color = getActivityColor(point.activity)
      gradient.addColorStop(0, `${color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`)
      gradient.addColorStop(1, `${color}00`)

      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(point.x, point.y, radius, 0, Math.PI * 2)
      ctx.fill()
    })
  }, [activeTab, heatmapData])

  const getActivityColor = (activity: string): string => {
    switch (activity) {
      case 'painting': return '#4080ff'
      case 'movement': return '#00ff80'
      case 'combat': return '#ff0040'
      case 'powerup': return '#ffff00'
      default: return '#ffffff'
    }
  }

  const renderTabButton = (tab: string, label: string, count?: number) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`
        px-4 py-2 text-sm font-mono border-b-2 transition-all duration-200 flex items-center space-x-2
        ${activeTab === tab
          ? 'text-cyber-blue border-cyber-blue'
          : 'text-gray-400 border-transparent hover:text-gray-200'
        }
      `}
    >
      <span>{label}</span>
      {count !== undefined && (
        <span className="bg-gray-700 px-2 py-1 rounded text-xs">{count}</span>
      )}
    </button>
  )

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Current Session */}
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">CURRENT SESSION</h3>
        {currentMetrics ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Game Mode:</span>
              <span className="text-white">{currentMetrics.gameMode.toUpperCase()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Duration:</span>
              <span className="text-white">{Math.floor(currentMetrics.duration / 1000)}s</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Players:</span>
              <span className="text-white">{currentMetrics.playerCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Paint Strokes:</span>
              <span className="text-cyber-pink">{currentMetrics.paintStrokes}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Territory:</span>
              <span className="text-cyber-green">{currentMetrics.territoryControlled.toFixed(1)}%</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No active session</div>
        )}
      </div>

      {/* Live Performance */}
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">LIVE PERFORMANCE</h3>
        {liveMetrics && (
          <div className="space-y-3">
            <div className="performance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>FPS</span>
                <span className={liveMetrics.fps >= 50 ? 'text-green-400' : liveMetrics.fps >= 30 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(liveMetrics.fps)}
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    liveMetrics.fps >= 50 ? 'bg-green-400' : liveMetrics.fps >= 30 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.min(100, (liveMetrics.fps / 60) * 100)}%` }}
                />
              </div>
            </div>

            <div className="performance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Memory</span>
                <span className="text-white">{Math.round(liveMetrics.memoryUsage)}MB</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-400 transition-all duration-300"
                  style={{ width: `${Math.min(100, (liveMetrics.memoryUsage / 500) * 100)}%` }}
                />
              </div>
            </div>

            <div className="performance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Network</span>
                <span className={liveMetrics.networkLatency < 100 ? 'text-green-400' : liveMetrics.networkLatency < 200 ? 'text-yellow-400' : 'text-red-400'}>
                  {Math.round(liveMetrics.networkLatency)}ms
                </span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    liveMetrics.networkLatency < 100 ? 'bg-green-400' : liveMetrics.networkLatency < 200 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${Math.max(10, Math.min(100, 100 - (liveMetrics.networkLatency / 500) * 100))}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Real-time Stats */}
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">REAL-TIME STATS</h3>
        {realTimeData ? (
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-400">Active Players:</span>
              <span className="text-white">{realTimeData.activePlayers}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Avg Skill Level:</span>
              <span className="text-white">{Math.round(realTimeData.averageSkillLevel)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Server Load:</span>
              <span className={realTimeData.serverLoad < 50 ? 'text-green-400' : realTimeData.serverLoad < 80 ? 'text-yellow-400' : 'text-red-400'}>
                {Math.round(realTimeData.serverLoad)}%
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Hot Zones:</span>
              <span className="text-cyber-pink">{realTimeData.hotZones.length}</span>
            </div>
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">Loading...</div>
        )}
      </div>

      {/* Session Events */}
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4 col-span-full">
        <h3 className="text-cyber-blue font-bold mb-3">RECENT EVENTS</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {gameAnalytics.getSessionHistory().slice(-10).reverse().map((event, index) => (
            <div key={index} className="text-xs bg-gray-800 p-2 rounded flex justify-between">
              <span className="text-gray-400">{new Date(event.timestamp).toLocaleTimeString()}</span>
              <span className="text-white">{event.type}</span>
              <span className="text-cyber-green">{JSON.stringify(event.data).slice(0, 50)}...</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPerformanceTab = () => (
    <div className="space-y-6">
      {/* Performance Chart */}
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">PERFORMANCE HISTORY</h3>
        <div className="performance-chart h-64 relative">
          <svg width="100%" height="100%" className="absolute inset-0">
            {/* Grid lines */}
            <defs>
              <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#1a1a2e" strokeWidth="1"/>
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />

            {/* FPS Line */}
            {performanceHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="#4080ff"
                strokeWidth="2"
                points={performanceHistory.slice(-50).map((p, i) =>
                  `${(i / 49) * 100},${100 - (p.averageFPS / 60) * 100}`
                ).join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            )}

            {/* Memory Usage Line */}
            {performanceHistory.length > 1 && (
              <polyline
                fill="none"
                stroke="#00ff80"
                strokeWidth="2"
                points={performanceHistory.slice(-50).map((p, i) =>
                  `${(i / 49) * 100},${100 - (p.memoryUsage / 500) * 100}`
                ).join(' ')}
                vectorEffect="non-scaling-stroke"
              />
            )}
          </svg>

          {/* Legend */}
          <div className="absolute top-2 right-2 text-xs space-y-1">
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-cyber-blue"></div>
              <span className="text-gray-400">FPS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-3 h-0.5 bg-cyber-green"></div>
              <span className="text-gray-400">Memory</span>
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyber-blue">
            {liveMetrics ? Math.round(liveMetrics.fps) : '--'}
          </div>
          <div className="text-sm text-gray-400">Current FPS</div>
        </div>

        <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyber-green">
            {liveMetrics ? Math.round(liveMetrics.memoryUsage) : '--'}MB
          </div>
          <div className="text-sm text-gray-400">Memory Usage</div>
        </div>

        <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-cyber-pink">
            {liveMetrics ? Math.round(liveMetrics.networkLatency) : '--'}ms
          </div>
          <div className="text-sm text-gray-400">Network Latency</div>
        </div>
      </div>
    </div>
  )

  const renderBehaviorTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">PAINTING STYLE</h3>
        <div className="space-y-3">
          <div className="behavior-metric">
            <span className="text-gray-400">Brush Size Preference</span>
            <div className="h-2 bg-gray-800 rounded-full mt-1">
              <div className="h-full bg-cyber-blue rounded-full" style={{ width: '70%' }}></div>
            </div>
          </div>

          <div className="behavior-metric">
            <span className="text-gray-400">Stroke Frequency</span>
            <div className="h-2 bg-gray-800 rounded-full mt-1">
              <div className="h-full bg-cyber-green rounded-full" style={{ width: '85%' }}></div>
            </div>
          </div>

          <div className="behavior-metric">
            <span className="text-gray-400">Creativity Score</span>
            <div className="h-2 bg-gray-800 rounded-full mt-1">
              <div className="h-full bg-cyber-pink rounded-full" style={{ width: '60%' }}></div>
            </div>
          </div>
        </div>
      </div>

      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">STRATEGY ANALYSIS</h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Primary Strategy:</span>
            <span className="text-white">Territorial Builder</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Risk Taking:</span>
            <span className="text-yellow-400">Medium</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Adaptability:</span>
            <span className="text-green-400">High</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Social Score:</span>
            <span className="text-blue-400">Collaborative</span>
          </div>
        </div>
      </div>

      <div className="metric-card bg-gray-900 border border-gray-600 rounded-lg p-4 col-span-full">
        <h3 className="text-cyber-blue font-bold mb-3">SKILL PROGRESSION</h3>
        <div className="skill-chart h-32 relative">
          <svg width="100%" height="100%" className="absolute inset-0">
            <polyline
              fill="none"
              stroke="#ffff00"
              strokeWidth="3"
              points="0,100 20,85 40,70 60,50 80,40 100,30"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute bottom-2 left-2 text-xs text-gray-400">Skill Level: 1247 (+15 this session)</div>
        </div>
      </div>
    </div>
  )

  const renderHeatmapTab = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-cyber-blue font-bold">ACTIVITY HEATMAP</h3>
        <div className="flex space-x-4 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyber-blue"></div>
            <span className="text-gray-400">Painting</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyber-green"></div>
            <span className="text-gray-400">Movement</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cyber-pink"></div>
            <span className="text-gray-400">Combat</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <span className="text-gray-400">Power-ups</span>
          </div>
        </div>
      </div>

      <div className="heatmap-container bg-gray-900 border border-gray-600 rounded-lg p-4">
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="w-full h-96 border border-gray-700 rounded"
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-xl font-bold text-cyber-blue">{heatmapData.filter(p => p.activity === 'painting').length}</div>
          <div className="text-xs text-gray-400">Paint Points</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-cyber-green">{heatmapData.filter(p => p.activity === 'movement').length}</div>
          <div className="text-xs text-gray-400">Movement Points</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-cyber-pink">{heatmapData.filter(p => p.activity === 'combat').length}</div>
          <div className="text-xs text-gray-400">Combat Points</div>
        </div>
        <div className="text-center">
          <div className="text-xl font-bold text-yellow-400">{heatmapData.filter(p => p.activity === 'powerup').length}</div>
          <div className="text-xs text-gray-400">Power-up Points</div>
        </div>
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="analytics-dashboard fixed inset-0 z-40 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="dashboard-panel bg-black border border-cyber-blue rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden shadow-cyber-blue">
        {/* Header */}
        <div className="panel-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-cyber-blue font-mono">GAME ANALYTICS</h2>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${autoRefresh ? 'bg-green-400 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-gray-400">{autoRefresh ? 'LIVE' : 'PAUSED'}</span>
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                autoRefresh
                  ? 'bg-green-600 text-white border-green-500'
                  : 'bg-gray-700 text-gray-300 border-gray-600 hover:border-gray-400'
              }`}
            >
              {autoRefresh ? 'PAUSE' : 'RESUME'}
            </button>

            <button
              onClick={() => {
                const data = gameAnalytics.exportAnalytics()
                const blob = new Blob([data], { type: 'application/json' })
                const url = URL.createObjectURL(blob)
                const a = document.createElement('a')
                a.href = url
                a.download = `analytics-${Date.now()}.json`
                a.click()
              }}
              className="px-3 py-1 text-xs font-mono bg-gray-700 text-gray-300 border border-gray-600 rounded hover:border-gray-400 transition-colors"
            >
              EXPORT
            </button>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white text-xl"
            >
              ×
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav bg-gray-900 border-b border-gray-700 px-4 flex space-x-4">
          {renderTabButton('overview', 'OVERVIEW')}
          {renderTabButton('performance', 'PERFORMANCE', performanceHistory.length)}
          {renderTabButton('behavior', 'BEHAVIOR')}
          {renderTabButton('heatmap', 'HEATMAP', heatmapData.length)}
        </div>

        {/* Content */}
        <div className="panel-content p-6 overflow-y-auto h-full">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'performance' && renderPerformanceTab()}
          {activeTab === 'behavior' && renderBehaviorTab()}
          {activeTab === 'heatmap' && renderHeatmapTab()}
        </div>
      </div>

      <style jsx>{`
        .analytics-dashboard {
          font-family: 'JetBrains Mono', monospace;
        }

        .shadow-cyber-blue {
          box-shadow: 0 0 20px rgba(64, 128, 255, 0.3);
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

        .bg-cyber-blue {
          background-color: #4080ff;
        }

        .border-cyber-blue {
          border-color: #4080ff;
        }

        /* Custom scrollbar */
        .panel-content::-webkit-scrollbar {
          width: 8px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: #4080ff;
          border-radius: 4px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: #5090ff;
        }

        .metric-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .metric-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(64, 128, 255, 0.1);
        }

        .performance-chart svg {
          background: linear-gradient(45deg, #0a0a0a 25%, transparent 25%),
                      linear-gradient(-45deg, #0a0a0a 25%, transparent 25%),
                      linear-gradient(45deg, transparent 75%, #0a0a0a 75%),
                      linear-gradient(-45deg, transparent 75%, #0a0a0a 75%);
          background-size: 20px 20px;
          background-position: 0 0, 0 10px, 10px -10px, -10px 0px;
        }

        .heatmap-container canvas {
          background: radial-gradient(circle at center, #1a1a2e 0%, #0a0a0a 100%);
        }
      `}</style>
    </div>
  )
}

export default GameAnalyticsDashboard