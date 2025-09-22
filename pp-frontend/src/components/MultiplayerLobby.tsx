import React, { useState, useEffect } from 'react'
import { useMultiplayer, GameRoom, GameMode, GamePlatform, GameSettings } from '../lib/multiplayer/MultiplayerManager'

interface MultiplayerLobbyProps {
  onGameStart: (roomId: string) => void
  onClose: () => void
}

interface ExtendedGameSettings extends GameSettings {
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
}

export default function MultiplayerLobby({ onGameStart, onClose }: MultiplayerLobbyProps) {
  const {
    isConnected,
    currentRoom,
    currentPlayer,
    connect,
    disconnect,
    createRoom,
    joinRoom,
    leaveRoom,
    getRoomList,
    startGame,
    on,
    off
  } = useMultiplayer()

  const [rooms, setRooms] = useState<GameRoom[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [playerName, setPlayerName] = useState('')
  const [showCreateRoom, setShowCreateRoom] = useState(false)
  const [showRoomSettings, setShowRoomSettings] = useState(false)
  const [showJoinRoom, setShowJoinRoom] = useState(false)
  const [selectedRoom, setSelectedRoom] = useState<GameRoom | null>(null)
  const [newRoomSettings, setNewRoomSettings] = useState<ExtendedGameSettings>({
    roomName: 'New Paint Battle',
    timeLimit: 300,
    maxPlayers: 4,
    paintTarget: 80,
    powerUpsEnabled: true,
    friendlyFire: false,
    gameMode: GameMode.PAINT_BATTLE,
    isPrivate: false,
    allowSpectators: true,
    roundLimit: 1,
    paintDecayRate: 0,
    powerUpSpawnRate: 30,
    territoryBonus: true,
    chatEnabled: true,
    voiceChatEnabled: false,
    autoMatchmaking: false,
    skillBasedMatching: false,
    regionRestriction: 'global'
  })

  // 초기 연결
  useEffect(() => {
    if (!isConnected) {
      setIsLoading(true)
      connect()
        .then(() => {
          setIsLoading(false)
          loadRoomList()
        })
        .catch((err) => {
          setError(`연결 실패: ${err.message}`)
          setIsLoading(false)
        })
    } else {
      loadRoomList()
    }

    // 이벤트 리스너 등록
    const handleRoomUpdate = () => {
      loadRoomList()
    }

    const handleGameStart = () => {
      if (currentRoom) {
        onGameStart(currentRoom.id)
      }
    }

    on('room_joined', handleRoomUpdate)
    on('room_left', handleRoomUpdate)
    on('player_joined', handleRoomUpdate)
    on('player_left', handleRoomUpdate)
    on('game_started', handleGameStart)

    return () => {
      off('room_joined', handleRoomUpdate)
      off('room_left', handleRoomUpdate)
      off('player_joined', handleRoomUpdate)
      off('player_left', handleRoomUpdate)
      off('game_started', handleGameStart)
    }
  }, [isConnected])

  const loadRoomList = async () => {
    try {
      const roomList = await getRoomList()
      setRooms(roomList)
    } catch (err) {
      console.error('Failed to load room list:', err)
    }
  }

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      setError('플레이어 이름을 입력해주세요')
      return
    }

    try {
      setIsLoading(true)
      await createRoom(newRoomSettings)
      setShowCreateRoom(false)
      setIsLoading(false)
    } catch (err) {
      setError(`방 생성 실패: ${err}`)
      setIsLoading(false)
    }
  }

  const handleJoinRoom = async (roomId: string) => {
    if (!playerName.trim()) {
      setError('플레이어 이름을 입력해주세요')
      return
    }

    try {
      setIsLoading(true)
      await joinRoom(roomId, playerName.trim(), GamePlatform.WEB)
      setIsLoading(false)
    } catch (err) {
      setError(`방 참가 실패: ${err}`)
      setIsLoading(false)
    }
  }

  const handleLeaveRoom = async () => {
    try {
      await leaveRoom()
      loadRoomList()
    } catch (err) {
      console.error('Failed to leave room:', err)
    }
  }

  const handleStartGame = async () => {
    try {
      await startGame()
    } catch (err) {
      setError(`게임 시작 실패: ${err}`)
    }
  }

  if (isLoading) {
    return (
      <div className="lobby-container">
        <div className="loading-screen">
          <div className="cyber-loader">
            <div className="cyber-loader-inner"></div>
          </div>
          <div className="loading-text">멀티플레이어 서버 연결중...</div>
        </div>
      </div>
    )
  }

  if (currentRoom) {
    return (
      <div className="lobby-container">
        <div className="room-view">
          <div className="room-header">
            <h2>방: {currentRoom.name}</h2>
            <button onClick={handleLeaveRoom} className="leave-button">
              나가기
            </button>
          </div>

          <div className="room-info">
            <div className="game-settings">
              <h3>게임 설정</h3>
              <div className="setting-item">
                <span>게임 모드:</span>
                <span>{getGameModeName(currentRoom.settings.gameMode)}</span>
              </div>
              <div className="setting-item">
                <span>제한 시간:</span>
                <span>{currentRoom.settings.timeLimit}초</span>
              </div>
              <div className="setting-item">
                <span>페인트 목표:</span>
                <span>{currentRoom.settings.paintTarget}%</span>
              </div>
              <div className="setting-item">
                <span>파워업:</span>
                <span>{currentRoom.settings.powerUpsEnabled ? '활성화' : '비활성화'}</span>
              </div>
            </div>

            <div className="players-list">
              <h3>플레이어 ({currentRoom.players.length}/{currentRoom.maxPlayers})</h3>
              {currentRoom.players.map(player => (
                <div key={player.id} className="player-item">
                  <div className="player-info">
                    <span className="player-name">{player.username}</span>
                    <span className="player-platform">{getPlatformName(player.platform)}</span>
                    {player.id === currentRoom.hostId && <span className="host-badge">HOST</span>}
                  </div>
                  <div className={`player-status ${player.isActive ? 'active' : 'inactive'}`}>
                    {player.isActive ? '준비됨' : '대기중'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {currentPlayer?.id === currentRoom.hostId && (
            <div className="host-controls">
              <button
                onClick={handleStartGame}
                className="start-game-button"
                disabled={currentRoom.players.length < 2}
              >
                게임 시작
              </button>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="lobby-container">
      <div className="lobby-header">
        <h1>멀티플레이어 로비</h1>
        <button onClick={onClose} className="close-button">✕</button>
      </div>

      {error && (
        <div className="error-message">
          {error}
          <button onClick={() => setError(null)} className="error-close">✕</button>
        </div>
      )}

      <div className="player-setup">
        <input
          type="text"
          placeholder="플레이어 이름 입력..."
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="player-name-input"
          maxLength={20}
        />
      </div>

      <div className="lobby-actions">
        <button
          onClick={() => setShowCreateRoom(true)}
          className="create-room-button"
          disabled={!playerName.trim()}
        >
          방 만들기
        </button>
        <button onClick={loadRoomList} className="refresh-button">
          새로고침
        </button>
      </div>

      <div className="rooms-list">
        <h3>사용 가능한 방</h3>
        {rooms.length === 0 ? (
          <div className="no-rooms">사용 가능한 방이 없습니다</div>
        ) : (
          <div className="rooms-grid">
            {rooms.map(room => (
              <div key={room.id} className="room-card">
                <div className="room-card-header">
                  <h4>{room.name}</h4>
                  <span className={`room-status ${room.status}`}>
                    {getRoomStatusName(room.status)}
                  </span>
                </div>
                <div className="room-card-body">
                  <div className="room-detail">
                    <span>모드:</span>
                    <span>{getGameModeName(room.gameMode)}</span>
                  </div>
                  <div className="room-detail">
                    <span>플레이어:</span>
                    <span>{room.players.length}/{room.maxPlayers}</span>
                  </div>
                  <div className="room-detail">
                    <span>시간:</span>
                    <span>{room.settings.timeLimit}초</span>
                  </div>
                </div>
                <div className="room-card-footer">
                  <button
                    onClick={() => handleJoinRoom(room.id)}
                    disabled={!playerName.trim() || room.players.length >= room.maxPlayers || room.status !== 'waiting'}
                    className="join-room-button"
                  >
                    참가하기
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 방 생성 모달 */}
      {showCreateRoom && (
        <div className="modal-overlay">
          <div className="create-room-modal">
            <div className="modal-header">
              <h3>새 방 만들기</h3>
              <button onClick={() => setShowCreateRoom(false)} className="modal-close">✕</button>
            </div>
            <div className="modal-body">
              <div className="setting-group">
                <label>게임 모드</label>
                <select
                  value={newRoomSettings.gameMode}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, gameMode: e.target.value as GameMode }))}
                >
                  <option value={GameMode.PAINT_BATTLE}>페인트 배틀</option>
                  <option value={GameMode.TERRITORY_CONTROL}>영역 장악</option>
                  <option value={GameMode.PAINT_RACE}>페인트 레이스</option>
                  <option value={GameMode.TEAM_DEATHMATCH}>팀 데스매치</option>
                </select>
              </div>
              <div className="setting-group">
                <label>최대 플레이어</label>
                <select
                  value={newRoomSettings.maxPlayers}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, maxPlayers: parseInt(e.target.value) }))}
                >
                  <option value={2}>2명</option>
                  <option value={4}>4명</option>
                  <option value={6}>6명</option>
                  <option value={8}>8명</option>
                </select>
              </div>
              <div className="setting-group">
                <label>제한 시간 (초)</label>
                <input
                  type="number"
                  min={60}
                  max={600}
                  value={newRoomSettings.timeLimit}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, timeLimit: parseInt(e.target.value) }))}
                />
              </div>
              <div className="setting-group">
                <label>페인트 목표 (%)</label>
                <input
                  type="number"
                  min={50}
                  max={100}
                  value={newRoomSettings.paintTarget}
                  onChange={(e) => setNewRoomSettings(prev => ({ ...prev, paintTarget: parseInt(e.target.value) }))}
                />
              </div>
              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newRoomSettings.powerUpsEnabled}
                    onChange={(e) => setNewRoomSettings(prev => ({ ...prev, powerUpsEnabled: e.target.checked }))}
                  />
                  파워업 활성화
                </label>
              </div>
              <div className="setting-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={newRoomSettings.friendlyFire}
                    onChange={(e) => setNewRoomSettings(prev => ({ ...prev, friendlyFire: e.target.checked }))}
                  />
                  팀킬 허용
                </label>
              </div>
            </div>
            <div className="modal-footer">
              <button onClick={() => setShowCreateRoom(false)} className="cancel-button">
                취소
              </button>
              <button onClick={handleCreateRoom} className="confirm-button">
                방 만들기
              </button>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .lobby-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: #000;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          min-height: 100vh;
        }

        .lobby-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-bottom: 20px;
          border-bottom: 2px solid #00ffff;
          margin-bottom: 20px;
        }

        .lobby-header h1 {
          margin: 0;
          font-size: 28px;
          text-shadow: 0 0 10px #00ffff;
        }

        .close-button {
          background: transparent;
          border: 2px solid #ff0080;
          color: #ff0080;
          width: 40px;
          height: 40px;
          font-size: 20px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .close-button:hover {
          background: #ff0080;
          color: #000;
          box-shadow: 0 0 15px #ff0080;
        }

        .loading-screen {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .cyber-loader {
          width: 60px;
          height: 60px;
          border: 3px solid #333;
          border-top: 3px solid #00ffff;
          border-radius: 50%;
          margin-bottom: 20px;
          animation: spin 1s linear infinite;
        }

        .cyber-loader-inner {
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-bottom: 2px solid #ff0080;
          border-radius: 50%;
          animation: spin 0.8s linear infinite reverse;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 16px;
          text-shadow: 0 0 10px #00ffff;
        }

        .error-message {
          background: rgba(255, 0, 128, 0.2);
          border: 1px solid #ff0080;
          padding: 15px;
          margin-bottom: 20px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .error-close {
          background: transparent;
          border: none;
          color: #ff0080;
          font-size: 18px;
          cursor: pointer;
        }

        .player-setup {
          margin-bottom: 20px;
        }

        .player-name-input {
          width: 100%;
          max-width: 400px;
          padding: 15px;
          background: #000;
          border: 2px solid #00ffff;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          font-size: 16px;
          outline: none;
        }

        .player-name-input:focus {
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.5);
        }

        .lobby-actions {
          display: flex;
          gap: 15px;
          margin-bottom: 30px;
        }

        .create-room-button,
        .refresh-button {
          padding: 12px 24px;
          border: 2px solid #00ffff;
          background: transparent;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .create-room-button:hover:not(:disabled),
        .refresh-button:hover {
          background: #00ffff;
          color: #000;
          box-shadow: 0 0 15px #00ffff;
        }

        .create-room-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .rooms-list h3 {
          margin-bottom: 15px;
          font-size: 20px;
        }

        .no-rooms {
          text-align: center;
          padding: 40px;
          color: #888;
          font-style: italic;
        }

        .rooms-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
          gap: 20px;
        }

        .room-card {
          border: 2px solid #333;
          padding: 20px;
          background: rgba(0, 255, 255, 0.05);
          transition: all 0.3s ease;
        }

        .room-card:hover {
          border-color: #00ffff;
          box-shadow: 0 0 15px rgba(0, 255, 255, 0.3);
        }

        .room-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 15px;
        }

        .room-card-header h4 {
          margin: 0;
          font-size: 18px;
        }

        .room-status {
          padding: 4px 8px;
          font-size: 12px;
          border: 1px solid;
        }

        .room-status.waiting {
          color: #00ff00;
          border-color: #00ff00;
        }

        .room-status.in_progress {
          color: #ffff00;
          border-color: #ffff00;
        }

        .room-card-body {
          margin-bottom: 15px;
        }

        .room-detail {
          display: flex;
          justify-content: space-between;
          margin-bottom: 8px;
          font-size: 14px;
        }

        .join-room-button {
          width: 100%;
          padding: 10px;
          border: 2px solid #00ff00;
          background: transparent;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .join-room-button:hover:not(:disabled) {
          background: #00ff00;
          color: #000;
        }

        .join-room-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Room view styles */
        .room-view {
          max-width: 800px;
          margin: 0 auto;
        }

        .room-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
        }

        .room-header h2 {
          margin: 0;
          font-size: 24px;
        }

        .leave-button {
          padding: 10px 20px;
          border: 2px solid #ff0080;
          background: transparent;
          color: #ff0080;
          font-family: 'Courier New', monospace;
          cursor: pointer;
        }

        .leave-button:hover {
          background: #ff0080;
          color: #000;
        }

        .room-info {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 30px;
          margin-bottom: 30px;
        }

        .game-settings h3,
        .players-list h3 {
          margin: 0 0 15px 0;
          font-size: 18px;
          border-bottom: 1px solid #333;
          padding-bottom: 10px;
        }

        .setting-item {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
          padding: 8px 0;
        }

        .player-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px;
          border: 1px solid #333;
          margin-bottom: 5px;
        }

        .player-info {
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .player-name {
          font-weight: bold;
        }

        .player-platform {
          font-size: 12px;
          color: #888;
        }

        .host-badge {
          background: #ffff00;
          color: #000;
          padding: 2px 6px;
          font-size: 10px;
          font-weight: bold;
        }

        .player-status.active {
          color: #00ff00;
        }

        .player-status.inactive {
          color: #888;
        }

        .start-game-button {
          width: 100%;
          padding: 15px;
          border: 2px solid #00ff00;
          background: transparent;
          color: #00ff00;
          font-family: 'Courier New', monospace;
          font-size: 18px;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .start-game-button:hover:not(:disabled) {
          background: #00ff00;
          color: #000;
          box-shadow: 0 0 20px #00ff00;
        }

        .start-game-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        /* Modal styles */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }

        .create-room-modal {
          background: #000;
          border: 2px solid #00ffff;
          max-width: 500px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          border-bottom: 1px solid #333;
        }

        .modal-header h3 {
          margin: 0;
        }

        .modal-close {
          background: transparent;
          border: none;
          color: #ff0080;
          font-size: 20px;
          cursor: pointer;
        }

        .modal-body {
          padding: 20px;
        }

        .setting-group {
          margin-bottom: 20px;
        }

        .setting-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: bold;
        }

        .setting-group select,
        .setting-group input[type="number"] {
          width: 100%;
          padding: 10px;
          background: #000;
          border: 2px solid #333;
          color: #00ffff;
          font-family: 'Courier New', monospace;
          outline: none;
        }

        .setting-group select:focus,
        .setting-group input[type="number"]:focus {
          border-color: #00ffff;
        }

        .checkbox-label {
          display: flex !important;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .checkbox-label input[type="checkbox"] {
          width: auto !important;
        }

        .modal-footer {
          display: flex;
          justify-content: flex-end;
          gap: 15px;
          padding: 20px;
          border-top: 1px solid #333;
        }

        .cancel-button,
        .confirm-button {
          padding: 10px 20px;
          border: 2px solid;
          background: transparent;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .cancel-button {
          border-color: #888;
          color: #888;
        }

        .cancel-button:hover {
          border-color: #fff;
          color: #fff;
        }

        .confirm-button {
          border-color: #00ffff;
          color: #00ffff;
        }

        .confirm-button:hover {
          background: #00ffff;
          color: #000;
        }

        @media (max-width: 768px) {
          .room-info {
            grid-template-columns: 1fr;
          }

          .rooms-grid {
            grid-template-columns: 1fr;
          }

          .lobby-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  )
}

// 헬퍼 함수들
function getGameModeName(mode: GameMode): string {
  switch (mode) {
    case GameMode.PAINT_BATTLE: return '페인트 배틀'
    case GameMode.TERRITORY_CONTROL: return '영역 장악'
    case GameMode.PAINT_RACE: return '페인트 레이스'
    case GameMode.TEAM_DEATHMATCH: return '팀 데스매치'
    default: return '알 수 없음'
  }
}

function getPlatformName(platform: GamePlatform): string {
  switch (platform) {
    case GamePlatform.WEB: return 'WEB'
    case GamePlatform.FLUTTER: return 'FLUTTER'
    case GamePlatform.UNITY_WEBGL: return 'UNITY'
    case GamePlatform.UNITY_MOBILE: return 'MOBILE'
    default: return '알 수 없음'
  }
}

function getRoomStatusName(status: string): string {
  switch (status) {
    case 'waiting': return '대기중'
    case 'starting': return '시작중'
    case 'in_progress': return '게임중'
    case 'finished': return '종료됨'
    default: return '알 수 없음'
  }
}