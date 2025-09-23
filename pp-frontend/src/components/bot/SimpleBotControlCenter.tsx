/**
 * Simple Bot Control Center
 * AI 엔진 대신 사용하는 간단한 봇 제어 센터
 */

import React, { useState, useEffect } from 'react'
import { useSimpleBot } from '../../lib/game-engine/SimpleBotEngine'
import { BotPlayer } from '../../lib/game-engine/SimpleBotEngine'

interface SimpleBotControlCenterProps {
  isOpen: boolean
  onClose: () => void
}

const SimpleBotControlCenter: React.FC<SimpleBotControlCenterProps> = ({ isOpen, onClose }) => {
  const {
    bots,
    isRunning,
    spawnBot,
    removeBot,
    start,
    stop,
    setBotActive
  } = useSimpleBot()

  const [activeTab, setActiveTab] = useState<'overview' | 'bots' | 'settings'>('overview')
  const [botSpawnCount, setBotSpawnCount] = useState(2)
  const [defaultDifficulty, setDefaultDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')

  const handleSpawnBots = () => {
    for (let i = 0; i < botSpawnCount; i++) {
      const botId = `bot_${Date.now()}_${i}`
      spawnBot(botId, defaultDifficulty)
    }
  }

  const handleRemoveBot = (botId: string) => {
    removeBot(botId)
  }

  const handleToggleBotActive = (botId: string, active: boolean) => {
    setBotActive(botId, active)
  }

  const renderTabButton = (tab: string, label: string, indicator?: string) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`
        px-4 py-2 text-sm font-mono border-b-2 transition-all duration-200 flex items-center space-x-2
        ${activeTab === tab
          ? 'text-blue-400 border-blue-400'
          : 'text-gray-400 border-transparent hover:text-gray-200'
        }
      `}
    >
      <span>{label}</span>
      {indicator && (
        <span className="bg-blue-500 px-2 py-1 rounded text-xs text-white">{indicator}</span>
      )}
    </button>
  )

  const renderOverviewTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* Bot System Status */}
      <div className="bot-card bg-gray-900 border border-blue-400 rounded-lg p-4">
        <h3 className="text-blue-400 font-bold mb-3 flex items-center">
          <span className={`w-2 h-2 rounded-full mr-2 ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></span>
          BOT SYSTEM STATUS
        </h3>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Active Bots:</span>
            <span className="text-white">{bots.filter(bot => bot.isActive).length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Total Bots:</span>
            <span className="text-white">{bots.length}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">System Status:</span>
            <span className={isRunning ? 'text-green-400' : 'text-red-400'}>
              {isRunning ? 'RUNNING' : 'STOPPED'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">CPU Usage:</span>
            <span className="text-green-400">LOW</span>
          </div>
        </div>
      </div>

      {/* Bot Controls */}
      <div className="bot-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-blue-400 font-bold mb-3">BOT CONTROLS</h3>
        <div className="space-y-3">
          <div className="system-control">
            <div className="flex space-x-2 mb-3">
              <button
                onClick={start}
                disabled={isRunning}
                className="flex-1 px-3 py-2 bg-green-600 text-white rounded text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                START
              </button>
              <button
                onClick={stop}
                disabled={!isRunning}
                className="flex-1 px-3 py-2 bg-red-600 text-white rounded text-xs disabled:bg-gray-600 disabled:cursor-not-allowed"
              >
                STOP
              </button>
            </div>
          </div>

          <div className="spawn-control">
            <label className="block text-xs text-gray-400 mb-1">SPAWN BOTS</label>
            <div className="flex space-x-2 mb-2">
              <input
                type="number"
                min="1"
                max="6"
                value={botSpawnCount}
                onChange={(e) => setBotSpawnCount(parseInt(e.target.value))}
                className="flex-1 px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
              />
              <button
                onClick={handleSpawnBots}
                className="px-3 py-1 bg-blue-500 text-white rounded text-xs font-bold hover:bg-blue-600 transition-colors"
              >
                SPAWN
              </button>
            </div>

            <select
              value={defaultDifficulty}
              onChange={(e) => setDefaultDifficulty(e.target.value as any)}
              className="w-full px-2 py-1 bg-gray-800 border border-gray-600 rounded text-white text-xs"
            >
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bot Statistics */}
      <div className="bot-card bg-gray-900 border border-gray-600 rounded-lg p-4">
        <h3 className="text-blue-400 font-bold mb-3">BOT STATISTICS</h3>
        <div className="space-y-2 text-sm">
          {['easy', 'medium', 'hard'].map(difficulty => {
            const count = bots.filter(bot => bot.difficulty === difficulty).length
            return (
              <div key={difficulty} className="flex justify-between">
                <span className="text-gray-400 capitalize">{difficulty} Bots:</span>
                <span className="text-white">{count}</span>
              </div>
            )
          })}
          <div className="flex justify-between">
            <span className="text-gray-400">Avg Score:</span>
            <span className="text-white">
              {bots.length > 0 ? (bots.reduce((sum, bot) => sum + bot.score, 0) / bots.length).toFixed(0) : '0'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  const renderBotsTab = () => (
    <div className="space-y-4">
      <div className="bot-grid grid grid-cols-1 md:grid-cols-2 gap-4">
        {bots.map((bot) => (
          <div
            key={bot.id}
            className="bot-card bg-gray-900 border border-gray-600 rounded-lg p-4"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <h4 className="text-white font-bold">{bot.name}</h4>
                <span className={`text-xs px-2 py-1 rounded ${
                  bot.difficulty === 'easy' ? 'bg-green-600' :
                  bot.difficulty === 'medium' ? 'bg-yellow-600' : 'bg-red-600'
                } text-white`}>
                  {bot.difficulty.toUpperCase()}
                </span>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleToggleBotActive(bot.id, !bot.isActive)}
                  className={`text-xs px-2 py-1 rounded ${
                    bot.isActive ? 'bg-green-600 text-white' : 'bg-gray-600 text-gray-300'
                  }`}
                >
                  {bot.isActive ? 'ACTIVE' : 'INACTIVE'}
                </button>
                <button
                  onClick={() => handleRemoveBot(bot.id)}
                  className="text-xs px-2 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  REMOVE
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Speed</span>
                  <span>{(bot.personality.speed * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-blue-400 rounded-full"
                    style={{ width: `${(bot.personality.speed / 1.5) * 100}%` }}
                  />
                </div>
              </div>

              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Aggression</span>
                  <span>{(bot.personality.aggression * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-red-400 rounded-full"
                    style={{ width: `${bot.personality.aggression * 100}%` }}
                  />
                </div>
              </div>

              <div className="trait-bar">
                <div className="flex justify-between text-xs text-gray-400 mb-1">
                  <span>Precision</span>
                  <span>{(bot.personality.precision * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 bg-gray-800 rounded-full">
                  <div
                    className="h-full bg-green-400 rounded-full"
                    style={{ width: `${bot.personality.precision * 100}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Score</div>
                <div className="text-white font-bold">{bot.score}</div>
              </div>
              <div className="bg-gray-800 p-2 rounded">
                <div className="text-gray-400">Coverage</div>
                <div className="text-white font-bold">{bot.paintCoverage.toFixed(1)}%</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {bots.length === 0 && (
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-2">🤖</div>
          <div>No bots active</div>
          <div className="text-sm mt-2">Use the controls to spawn bots</div>
        </div>
      )}
    </div>
  )

  if (!isOpen) return null

  return (
    <div className="bot-control-center fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4">
      <div className="control-panel bg-black border border-blue-400 rounded-lg w-full max-w-6xl h-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="panel-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h2 className="text-xl font-bold text-blue-400 font-mono">SIMPLE BOT CONTROL</h2>
            <div className="bot-status flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`}></div>
              <span className="text-xs text-gray-400">
                {isRunning ? 'SYSTEM ACTIVE' : 'SYSTEM INACTIVE'}
              </span>
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
          {renderTabButton('bots', 'BOTS', bots.length.toString())}
          {renderTabButton('settings', 'SETTINGS')}
        </div>

        {/* Content */}
        <div className="panel-content p-6 overflow-y-auto h-full">
          {activeTab === 'overview' && renderOverviewTab()}
          {activeTab === 'bots' && renderBotsTab()}
          {activeTab === 'settings' && (
            <div className="text-center text-gray-500 py-8">
              <div>Settings panel coming soon...</div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .bot-control-center {
          font-family: 'JetBrains Mono', monospace;
        }

        .bot-card {
          transition: transform 0.2s ease, box-shadow 0.2s ease;
        }

        .bot-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(59, 130, 246, 0.1);
        }

        /* Custom scrollbar */
        .panel-content::-webkit-scrollbar {
          width: 8px;
        }

        .panel-content::-webkit-scrollbar-track {
          background: #1a1a1a;
        }

        .panel-content::-webkit-scrollbar-thumb {
          background: #3b82f6;
          border-radius: 4px;
        }

        .panel-content::-webkit-scrollbar-thumb:hover {
          background: #60a5fa;
        }
      `}</style>
    </div>
  )
}

export default SimpleBotControlCenter