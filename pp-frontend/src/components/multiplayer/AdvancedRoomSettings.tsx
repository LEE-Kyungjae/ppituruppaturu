/**
 * Advanced Room Settings Component
 * 고급 멀티플레이어 방 설정 - 사이버펑크 스타일
 */

import React, { useState } from 'react'
import { GameMode } from '../../lib/multiplayer/MultiplayerManager'

interface ExtendedGameSettings {
  roomName: string
  password?: string
  isPrivate: boolean
  allowSpectators: boolean
  roundLimit: number
  paintDecayRate: number
  powerUpSpawnRate: number
  territoryBonus: boolean
  chatEnabled: boolean
  voiceChatEnabled: boolean
  autoMatchmaking: boolean
  skillBasedMatching: boolean
  regionRestriction: string
  customMapId?: string
  timeLimit: number
  maxPlayers: number
  paintTarget: number
  powerUpsEnabled: boolean
  friendlyFire: boolean
  gameMode: GameMode
}

interface AdvancedRoomSettingsProps {
  settings: ExtendedGameSettings
  onChange: (settings: ExtendedGameSettings) => void
  onClose: () => void
  onConfirm: () => void
  isCreating?: boolean
}

const AdvancedRoomSettings: React.FC<AdvancedRoomSettingsProps> = ({
  settings,
  onChange,
  onClose,
  onConfirm,
  isCreating = false
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'gameplay' | 'advanced' | 'social'>('general')

  const updateSetting = (key: keyof ExtendedGameSettings, value: any) => {
    onChange({
      ...settings,
      [key]: value
    })
  }

  const gameModeDescriptions = {
    [GameMode.PAINT_BATTLE]: 'Classic paint territory control',
    [GameMode.TERRITORY_CONTROL]: 'Capture and hold strategic points',
    [GameMode.PAINT_RACE]: 'First to reach paint target wins',
    [GameMode.TEAM_DEATHMATCH]: 'Team vs team elimination'
  }

  const regionOptions = [
    { value: 'global', label: 'Global (No Restriction)' },
    { value: 'na', label: 'North America' },
    { value: 'eu', label: 'Europe' },
    { value: 'asia', label: 'Asia-Pacific' },
    { value: 'kr', label: 'Korea' },
    { value: 'jp', label: 'Japan' }
  ]

  const renderTabButton = (tab: string, label: string) => (
    <button
      onClick={() => setActiveTab(tab as any)}
      className={`
        px-4 py-2 text-sm font-mono border-b-2 transition-all duration-200
        ${activeTab === tab
          ? 'text-cyber-blue border-cyber-blue'
          : 'text-gray-400 border-transparent hover:text-gray-200'
        }
      `}
    >
      {label}
    </button>
  )

  const renderGeneralTab = () => (
    <div className="space-y-6">
      {/* Room Name */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-2">ROOM NAME</label>
        <input
          type="text"
          value={settings.roomName}
          onChange={(e) => updateSetting('roomName', e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
          placeholder="Enter room name..."
          maxLength={50}
        />
      </div>

      {/* Game Mode */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-2">GAME MODE</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {Object.values(GameMode).map(mode => (
            <div
              key={mode}
              onClick={() => updateSetting('gameMode', mode)}
              className={`
                p-4 border rounded cursor-pointer transition-all duration-200
                ${settings.gameMode === mode
                  ? 'border-cyber-blue bg-cyber-blue bg-opacity-20'
                  : 'border-gray-600 hover:border-gray-400'
                }
              `}
            >
              <div className="font-bold text-white mb-1">{mode.toUpperCase()}</div>
              <div className="text-xs text-gray-400">{gameModeDescriptions[mode]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Player Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="setting-group">
          <label className="block text-sm font-bold text-cyber-blue mb-2">MAX PLAYERS</label>
          <select
            value={settings.maxPlayers}
            onChange={(e) => updateSetting('maxPlayers', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
          >
            {[2, 3, 4, 6, 8, 12].map(num => (
              <option key={num} value={num}>{num} Players</option>
            ))}
          </select>
        </div>

        <div className="setting-group">
          <label className="block text-sm font-bold text-cyber-blue mb-2">TIME LIMIT</label>
          <select
            value={settings.timeLimit}
            onChange={(e) => updateSetting('timeLimit', parseInt(e.target.value))}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
          >
            <option value={60}>1 Minute</option>
            <option value={180}>3 Minutes</option>
            <option value={300}>5 Minutes</option>
            <option value={600}>10 Minutes</option>
            <option value={900}>15 Minutes</option>
            <option value={0}>No Limit</option>
          </select>
        </div>
      </div>

      {/* Privacy Settings */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">PRIVACY SETTINGS</label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.isPrivate}
              onChange={(e) => updateSetting('isPrivate', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Private Room</span>
            <span className="text-xs text-gray-400">(Requires invitation or password)</span>
          </label>

          {settings.isPrivate && (
            <div className="ml-6">
              <input
                type="password"
                value={settings.password || ''}
                onChange={(e) => updateSetting('password', e.target.value)}
                placeholder="Room password (optional)"
                className="w-full max-w-xs px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
              />
            </div>
          )}

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.allowSpectators}
              onChange={(e) => updateSetting('allowSpectators', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Allow Spectators</span>
          </label>
        </div>
      </div>
    </div>
  )

  const renderGameplayTab = () => (
    <div className="space-y-6">
      {/* Victory Conditions */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">VICTORY CONDITIONS</label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">PAINT TARGET (%)</label>
            <input
              type="range"
              min="50"
              max="100"
              step="5"
              value={settings.paintTarget}
              onChange={(e) => updateSetting('paintTarget', parseInt(e.target.value))}
              className="w-full accent-cyber-blue"
            />
            <div className="text-center text-sm text-cyber-blue">{settings.paintTarget}%</div>
          </div>

          <div>
            <label className="block text-xs text-gray-400 mb-1">ROUND LIMIT</label>
            <select
              value={settings.roundLimit}
              onChange={(e) => updateSetting('roundLimit', parseInt(e.target.value))}
              className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
            >
              <option value={1}>Best of 1</option>
              <option value={3}>Best of 3</option>
              <option value={5}>Best of 5</option>
            </select>
          </div>
        </div>
      </div>

      {/* Paint Mechanics */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">PAINT MECHANICS</label>
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-gray-400 mb-2">PAINT DECAY RATE</label>
            <input
              type="range"
              min="0"
              max="10"
              step="1"
              value={settings.paintDecayRate}
              onChange={(e) => updateSetting('paintDecayRate', parseInt(e.target.value))}
              className="w-full accent-cyber-blue"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>No Decay</span>
              <span className="text-cyber-blue">{settings.paintDecayRate}% per minute</span>
              <span>Fast Decay</span>
            </div>
          </div>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.territoryBonus}
              onChange={(e) => updateSetting('territoryBonus', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Territory Control Bonus</span>
            <span className="text-xs text-gray-400">(Extra points for controlling areas)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.friendlyFire}
              onChange={(e) => updateSetting('friendlyFire', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Friendly Fire</span>
            <span className="text-xs text-gray-400">(Players can overwrite teammate paint)</span>
          </label>
        </div>
      </div>

      {/* Power-ups */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">POWER-UPS</label>
        <div className="space-y-4">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.powerUpsEnabled}
              onChange={(e) => updateSetting('powerUpsEnabled', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Enable Power-ups</span>
          </label>

          {settings.powerUpsEnabled && (
            <div className="ml-6">
              <label className="block text-xs text-gray-400 mb-2">SPAWN RATE</label>
              <input
                type="range"
                min="10"
                max="120"
                step="10"
                value={settings.powerUpSpawnRate}
                onChange={(e) => updateSetting('powerUpSpawnRate', parseInt(e.target.value))}
                className="w-full accent-cyber-blue"
              />
              <div className="text-center text-sm text-cyber-blue">Every {settings.powerUpSpawnRate} seconds</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderAdvancedTab = () => (
    <div className="space-y-6">
      {/* Matchmaking */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">MATCHMAKING</label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.autoMatchmaking}
              onChange={(e) => updateSetting('autoMatchmaking', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Auto-fill with Bots</span>
            <span className="text-xs text-gray-400">(Fill empty slots with AI players)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.skillBasedMatching}
              onChange={(e) => updateSetting('skillBasedMatching', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Skill-based Matching</span>
            <span className="text-xs text-gray-400">(Match players of similar skill level)</span>
          </label>
        </div>
      </div>

      {/* Region Settings */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-2">REGION RESTRICTION</label>
        <select
          value={settings.regionRestriction}
          onChange={(e) => updateSetting('regionRestriction', e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
        >
          {regionOptions.map(region => (
            <option key={region.value} value={region.value}>{region.label}</option>
          ))}
        </select>
      </div>

      {/* Custom Map */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-2">CUSTOM MAP</label>
        <div className="flex space-x-3">
          <input
            type="text"
            value={settings.customMapId || ''}
            onChange={(e) => updateSetting('customMapId', e.target.value)}
            placeholder="Map ID (optional)"
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white font-mono focus:border-cyber-blue focus:outline-none"
          />
          <button className="px-4 py-2 bg-gray-700 border border-gray-600 rounded text-white hover:border-gray-400 transition-colors">
            Browse
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-1">Leave empty for random map selection</p>
      </div>
    </div>
  )

  const renderSocialTab = () => (
    <div className="space-y-6">
      {/* Communication */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">COMMUNICATION</label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.chatEnabled}
              onChange={(e) => updateSetting('chatEnabled', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Text Chat</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.voiceChatEnabled}
              onChange={(e) => updateSetting('voiceChatEnabled', e.target.checked)}
              className="form-checkbox text-cyber-blue"
            />
            <span className="text-white">Voice Chat</span>
            <span className="text-xs text-gray-400">(Beta feature)</span>
          </label>
        </div>
      </div>

      {/* Content Filters */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">CONTENT MODERATION</label>
        <div className="space-y-3">
          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="form-checkbox text-cyber-blue opacity-50"
            />
            <span className="text-gray-400">Profanity Filter (Always On)</span>
          </label>

          <label className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={true}
              disabled
              className="form-checkbox text-cyber-blue opacity-50"
            />
            <span className="text-gray-400">Auto-kick Toxic Players (Always On)</span>
          </label>
        </div>
      </div>

      {/* Room Statistics */}
      <div className="setting-group">
        <label className="block text-sm font-bold text-cyber-blue mb-3">ROOM STATISTICS</label>
        <div className="bg-gray-800 rounded p-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-gray-400">Estimated Match Duration:</span>
            <span className="text-white">{Math.ceil(settings.timeLimit / 60)} minutes</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Competitive Rating:</span>
            <span className="text-cyan-400">
              {settings.skillBasedMatching ? 'Ranked' : 'Casual'}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-400">Room Complexity:</span>
            <span className="text-yellow-400">
              {settings.powerUpsEnabled && settings.territoryBonus ? 'Advanced' : 'Standard'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="advanced-room-settings fixed inset-0 z-50 bg-black bg-opacity-80 flex items-center justify-center p-4">
      <div className="settings-panel bg-black border border-cyber-blue rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-cyber-blue">
        {/* Header */}
        <div className="panel-header bg-gray-900 border-b border-gray-700 p-4 flex items-center justify-between">
          <h2 className="text-xl font-bold text-cyber-blue font-mono">
            {isCreating ? 'CREATE ROOM' : 'ROOM SETTINGS'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white text-xl"
          >
            ×
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="tab-nav bg-gray-900 border-b border-gray-700 px-4 flex space-x-4">
          {renderTabButton('general', 'GENERAL')}
          {renderTabButton('gameplay', 'GAMEPLAY')}
          {renderTabButton('advanced', 'ADVANCED')}
          {renderTabButton('social', 'SOCIAL')}
        </div>

        {/* Content */}
        <div className="panel-content p-6 overflow-y-auto max-h-[60vh]">
          {activeTab === 'general' && renderGeneralTab()}
          {activeTab === 'gameplay' && renderGameplayTab()}
          {activeTab === 'advanced' && renderAdvancedTab()}
          {activeTab === 'social' && renderSocialTab()}
        </div>

        {/* Footer */}
        <div className="panel-footer bg-gray-900 border-t border-gray-700 p-4 flex justify-between">
          <button
            onClick={onClose}
            className="px-6 py-2 text-gray-400 border border-gray-600 rounded font-mono hover:border-gray-400 transition-colors"
          >
            CANCEL
          </button>
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-cyber-blue text-black border border-cyber-blue rounded font-bold hover:bg-blue-600 transition-colors"
          >
            {isCreating ? 'CREATE ROOM' : 'SAVE SETTINGS'}
          </button>
        </div>
      </div>

      <style jsx>{`
        .advanced-room-settings {
          font-family: 'JetBrains Mono', monospace;
        }

        .shadow-cyber-blue {
          box-shadow: 0 0 20px rgba(64, 128, 255, 0.3);
        }

        .text-cyber-blue {
          color: #4080ff;
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

export default AdvancedRoomSettings