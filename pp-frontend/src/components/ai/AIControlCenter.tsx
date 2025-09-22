/**
 * AI Control Center
 * 실시간 AI 엔진 제어 및 모니터링 대시보드 - 사이버펑크 스타일
 */

import React, { useState, useEffect, useRef } from 'react'
import { useGameAI } from '../../lib/ai/GameAIEngine'
import { AIPlayerBehavior, GameBalance, PredictiveModel, AIDecision } from '../../lib/ai/GameAIEngine'

interface AIControlCenterProps {
  isOpen: boolean
  onClose: () => void
}

const AIControlCenter: React.FC<AIControlCenterProps> = ({ isOpen, onClose }) => {
  const {
    gameBalance,
    predictions,
    aiPlayers,
    spawnAIPlayer,
    getDecisionHistory,
    getStrategyClusters,
    forceBalanceCheck,
    updateAISkillLevel
  } = useGameAI()

  const [activeTab, setActiveTab] = useState<'overview' | 'players' | 'balance' | 'predictions' | 'decisions'>('overview')
  const [selectedAIPlayer, setSelectedAIPlayer] = useState<string | null>(null)
  const [decisionHistory, setDecisionHistory] = useState<AIDecision[]>([])
  const [strategyClusters, setStrategyClusters] = useState<any[]>([])
  const [autoBalance, setAutoBalance] = useState(true)
  const [aiSpawnCount, setAiSpawnCount] = useState(2)
  const visualizationRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const interval = setInterval(() => {
      setDecisionHistory(getDecisionHistory())
      setStrategyClusters(getStrategyClusters())
    }, 1000)

    return () => clearInterval(interval)
  }, [getDecisionHistory, getStrategyClusters])

  useEffect(() => {
    if (activeTab === 'predictions' && visualizationRef.current) {
      renderPredictionVisualization()
    }
  }, [activeTab, predictions])

  const renderPredictionVisualization = () => {
    const canvas = visualizationRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#0a0a0a'
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    // Draw prediction graphs
    predictions.forEach((model, type) => {
      const y = Array.from(predictions.keys()).indexOf(type) * 60 + 40

      // Model accuracy bar
      ctx.fillStyle = '#4080ff'
      ctx.fillRect(20, y, model.accuracy * 200, 20)

      // Model name and accuracy
      ctx.fillStyle = '#ffffff'
      ctx.font = '12px monospace'
      ctx.fillText(`${type.toUpperCase()}: ${(model.accuracy * 100).toFixed(1)}%`, 230, y + 15)

      // Prediction timeline
      if (model.predictions.length > 0) {
        ctx.strokeStyle = '#00ff80'
        ctx.lineWidth = 2
        ctx.beginPath()

        model.predictions.forEach((prediction, index) => {
          const x = 300 + index * 30
          const predY = y + 10 - prediction.probability * 15

          if (index === 0) {
            ctx.moveTo(x, predY)
          } else {
            ctx.lineTo(x, predY)
          }
        })
        ctx.stroke()
      }
    })
  }

  const handleSpawnAI = () => {
    for (let i = 0; i < aiSpawnCount; i++) {
      const aiId = `ai_${Date.now()}_${i}`
      const skillLevel = 300 + Math.random() * 400
      spawnAIPlayer(aiId, skillLevel)
    }
  }

  const renderTabButton = (tab: string, label: string, indicator?: string) => (
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
      {indicator && (
        <span className="bg-cyber-pink px-2 py-1 rounded text-xs text-black">{indicator}</span>
      )}
    </button>
  )

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* AI System Status */}
      <div className="ai-card bg-gray-900 border border-cyber-blue rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3 flex items-center">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          AI SYSTEM STATUS
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Active AI Players:</span>
            <span className="text-white">{Array.from(aiPlayers.keys()).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Strategy Clusters:</span>
            <span className="text-white">{strategyClusters.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Decisions/min:</span>
            <span className="text-cyber-green">{decisionHistory.filter(d => Date.now() - (d as any).timestamp < 60000).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Learning Rate:</span>
            <span className="text-yellow-400">
              {aiPlayers.size > 0 ? (Array.from(aiPlayers.values())[0].learning_rate * 100).toFixed(1) : 0}%
            </span>
          </div>
        </div>
      </div>

      {/* Game Balance Monitor */}
      <div className="ai-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">GAME BALANCE</h3>
        {gameBalance ? (
          <div className="space-y-3">
            <div className="balance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Skill Variance</span>
                <span>{(gameBalance.skill_variance * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gameBalance.skill_variance > 0.7 ? 'bg-red-400' :
                    gameBalance.skill_variance > 0.4 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${gameBalance.skill_variance * 100}%` }}
                />
              </div>
            </div>

            <div className="balance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Territory Fairness</span>
                <span>{(gameBalance.territory_fairness * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    gameBalance.territory_fairness < 0.3 ? 'bg-red-400' :
                    gameBalance.territory_fairness < 0.6 ? 'bg-yellow-400' : 'bg-green-400'
                  }`}
                  style={{ width: `${gameBalance.territory_fairness * 100}%` }}
                />
              </div>
            </div>

            <div className="balance-meter">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Engagement Level</span>
                <span>{(gameBalance.engagement_level * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-cyber-pink transition-all duration-300"
                  style={{ width: `${gameBalance.engagement_level * 100}%` }}
                />
              </div>
            </div>

            {gameBalance.recommended_adjustments.length > 0 && (
              <div className="mt-3">
                <div className="text-xs text-gray-400 mb-1">RECOMMENDED ADJUSTMENTS</div>
                <div className="space-y-1">
                  {gameBalance.recommended_adjustments.map((adj, index) => (
                    <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                      <span className="text-yellow-400">{adj.type.toUpperCase()}</span>
                      <span className="text-gray-300 ml-2">{adj.reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 text-center py-4">No balance data available</div>
        )}
      </div>

      {/* AI Controls */}
      <div className="ai-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-cyber-blue font-bold mb-3">AI CONTROLS</h3>
        <div className="space-y-3">
          <div className="spawn-control">
            <label className="block text-xs text-gray-400 mb-1">SPAWN AI PLAYERS</label>
            <div className="flex space-x-2">
              <input
                type="number"
                min="1"
                max="6"
                value={aiSpawnCount}
                onChange={(e) => setAiSpawnCount(parseInt(e.target.value))}
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              />
              <button
                onClick={handleSpawnAI}
                className="px-3 py-1 bg-cyber-blue text-black rounded text-xs font-bold hover:bg-blue-600 transition-colors"
              >
                SPAWN
              </button>
            </div>
          </div>

          <div className="auto-balance">
            <label className="flex items-center space-x-2 text-xs text-gray-400">
              <input
                type="checkbox"
                checked={autoBalance}
                onChange={(e) => setAutoBalance(e.target.checked)}
                className="form-checkbox text-cyber-blue"
              />
              <span>Auto Balance</span>
            </label>
          </div>

          <button
            onClick={forceBalanceCheck}
            className="w-full px-3 py-2 bg-gray-700 text-white border border-gray-600 rounded text-xs hover:border-gray-400 transition-colors"
          >
            FORCE BALANCE CHECK
          </button>

          <div className="ai-difficulty">
            <label className="block text-xs text-gray-400 mb-1">AI DIFFICULTY</label>
            <input
              type="range"
              min="100"
              max="900"
              step="50"
              className="w-full accent-cyber-blue"
              onChange={(e) => {
                const newSkillLevel = parseInt(e.target.value)
                aiPlayers.forEach((_, playerId) => {
                  updateAISkillLevel(playerId, newSkillLevel)
                })
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>Easy</span>
              <span>Hard</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent AI Decisions */}
      <div className="ai-card bg-gray-900 border border-gray-600 rounded-lg p-4 col-span-full">
        <h3 className="text-cyber-blue font-bold mb-3">RECENT AI DECISIONS</h3>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {decisionHistory.slice(-8).reverse().map((decision, index) => (
            <div key={index} className="text-xs bg-gray-800 p-2 rounded flex justify-between items-center">
              <div className="flex space-x-3">
                <span className="text-cyber-green">{decision.action.toUpperCase()}</span>
                <span className="text-gray-300">{decision.reasoning}</span>
              </div>
              <div className="flex items-center space-x-2">
                <span className={`px-2 py-1 rounded ${
                  decision.confidence > 0.8 ? 'bg-green-600' :
                  decision.confidence > 0.6 ? 'bg-yellow-600' : 'bg-red-600'
                } text-white`}>
                  {(decision.confidence * 100).toFixed(0)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )

  const renderPlayersTab = () => (
    <div className="space-y-4">
      <div className="ai-players-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(aiPlayers.entries()).map(([playerId, behavior]) => (
          <div
            key={playerId}
            className={`ai-player-card bg-gray-900 border rounded-lg p-4 cursor-pointer transition-all ${
              selectedAIPlayer === playerId ? 'border-cyber-blue' : 'border-gray-600'
            }`}
            onClick={() => setSelectedAIPlayer(playerId)}
          >
            <div className="flex justify-between items-start mb-3">
              <h4 className="text-white font-bold">{playerId}</h4>
              <div className="text-xs bg-gray-700 px-2 py-1 rounded">
                LVL {Math.floor(behavior.skill_level / 100)}
              </div>
            </div>

            <div className="space-y-2">
              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Aggressiveness</span>
                  <span>{(behavior.aggressiveness * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${behavior.aggressiveness * 100}%` }}
                  />
                </div>
              </div>

              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Creativity</span>
                  <span>{(behavior.creativity * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-purple-400 rounded-full"
                    style={{ width: `${behavior.creativity * 100}%` }}
                  />
                </div>
              </div>

              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Teamwork</span>
                  <span>{(behavior.teamwork * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${behavior.teamwork * 100}%` }}
                  />
                </div>
              </div>

              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Adaptability</span>
                  <span>{(behavior.adaptability * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-green-400 rounded-full"
                    style={{ width: `${behavior.adaptability * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-1">
              {behavior.personality_traits.map((trait, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-700 text-gray-300 px-2 py-1 rounded"
                >
                  {trait.name}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>

      {Array.from(aiPlayers.keys()).length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🤖</div>
          <div>No AI players active</div>
          <div className="text-sm mt-2">Use the controls to spawn AI players</div>
        </div>
      )}
    </div>
  )

  const renderPredictionsTab = () => (
    <div className="space-y-6">
      <div className="prediction-visualization">
        <h3 className="text-cyber-blue font-bold mb-3">PREDICTIVE MODELS VISUALIZATION</h3>
        <canvas
          ref={visualizationRef}
          width={800}
          height={300}
          className="w-full border border-gray-600 rounded bg-black"
        />
      </div>

      <div className="prediction-cards grid grid-cols-1 md:grid-cols-2 gap-4">
        {Array.from(predictions.entries()).map(([type, model]) => (
          <div key={type} className="prediction-card bg-gray-900 border border-gray-600 rounded-lg p-4">
            <h4 className="text-white font-bold mb-2">{type.toUpperCase()} MODEL</h4>

            <div className="model-accuracy mb-3">
              <div className="flex justify-between text-xs text-gray-400 mb-1">
                <span>Accuracy</span>
                <span>{(model.accuracy * 100).toFixed(1)}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full">
                <div
                  className={`h-full rounded-full ${
                    model.accuracy > 0.8 ? 'bg-green-400' :
                    model.accuracy > 0.6 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${model.accuracy * 100}%` }}
                />
              </div>
            </div>

            <div className="predictions-list">
              <div className="text-xs text-gray-400 mb-2">ACTIVE PREDICTIONS</div>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {model.predictions.slice(0, 3).map((prediction, index) => (
                  <div key={index} className="text-xs bg-gray-800 p-2 rounded">
                    <div className="flex justify-between">
                      <span className="text-white">{prediction.metric}</span>
                      <span className="text-cyber-green">{prediction.value.toFixed(1)}</span>
                    </div>
                    <div className="text-gray-400">
                      Confidence: {(prediction.probability * 100).toFixed(0)}%
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="ai-control-center fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="control-panel bg-black border border-cyber-blue rounded-lg w-full max-w-7xl h-full max-h-[90vh] overflow-hidden shadow-cyber-blue">
        {/* Header */}
        <div className="panel-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-cyber-blue font-mono">AI CONTROL CENTER</h2>
            <div className="ai-status flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              <span className="text-xs text-gray-400">NEURAL NETWORKS ACTIVE</span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav bg-gray-900 border-b border-gray-700 px-4 flex space-x-4">
          {renderTabButton('overview', 'OVERVIEW')}
          {renderTabButton('players', 'AI PLAYERS', Array.from(aiPlayers.keys()).length.toString())}
          {renderTabButton('balance', 'BALANCE')}
          {renderTabButton('predictions', 'PREDICTIONS')}
          {renderTabButton('decisions', 'DECISIONS', decisionHistory.length.toString())}
        </div>

        {/* Content */}
        <div className="panel-content p-6 overflow-y-auto h-full">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'players' && renderPlayersTab()}
          {activeTab === 'predictions' && renderPredictionsTab()}
        </div>
      </div>

      <style jsx>{`
        .ai-control-center {
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

        .accent-cyber-blue {
          accent-color: #4080ff;
        }

        .ai-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .ai-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(64, 128, 255, 0.1);
        }

        .ai-player-card:hover {
          border-color: #4080ff !important;
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

        .form-checkbox {
          width: 16px;
          height: 16px;
          background-color: #374151;
          border: 1px solid #6b7280;
          border-radius: 0.25rem;
        }

        .form-checkbox:checked {
          background-color: #4080ff;
          border-color: #4080ff;
        }
      `}</style>
    </div>
  )
}

export default AIControlCenter