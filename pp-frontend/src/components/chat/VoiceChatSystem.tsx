// frontend/src/components/chat/VoiceChatSystem.tsx
import React, { useState, useRef, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface VoiceChatUser {
  id: string
  username: string
  displayName: string
  avatar: string
  isMuted: boolean
  isDeafened: boolean
  isSpeaking: boolean
  volume: number
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting'
}

interface VoiceChannel {
  id: string
  name: string
  description: string
  userLimit: number
  currentUsers: VoiceChatUser[]
  isPrivate: boolean
  requiresPermission: boolean
}

interface AudioDeviceInfo {
  deviceId: string
  label: string
  kind: 'audioinput' | 'audiooutput'
}

export const VoiceChatSystem: React.FC = () => {
  // State management
  const [isConnected, setIsConnected] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [currentChannel, setCurrentChannel] = useState<string | null>(null)
  const [isMuted, setIsMuted] = useState(false)
  const [isDeafened, setIsDeafened] = useState(false)
  const [volume, setVolume] = useState(50)
  const [micVolume, setMicVolume] = useState(50)
  const [voiceUsers, setVoiceUsers] = useState<VoiceChatUser[]>([])
  const [voiceChannels] = useState<VoiceChannel[]>([
    {
      id: 'general_voice',
      name: '일반 음성 채널',
      description: '누구나 참여할 수 있는 음성 채널',
      userLimit: 10,
      currentUsers: [],
      isPrivate: false,
      requiresPermission: false
    },
    {
      id: 'game_voice',
      name: '게임 음성 채널',
      description: '게임 중 음성 대화',
      userLimit: 8,
      currentUsers: [],
      isPrivate: false,
      requiresPermission: false
    },
    {
      id: 'vip_voice',
      name: 'VIP 음성 채널',
      description: 'VIP 회원 전용 채널',
      userLimit: 6,
      currentUsers: [],
      isPrivate: true,
      requiresPermission: true
    }
  ])

  // Audio devices
  const [audioDevices, setAudioDevices] = useState<AudioDeviceInfo[]>([])
  const [selectedMicrophone, setSelectedMicrophone] = useState<string>('')
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('')
  const [showDeviceSettings, setShowDeviceSettings] = useState(false)

  // Voice activity detection
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [voiceActivity, setVoiceActivity] = useState(0)

  // Refs
  const mediaStreamRef = useRef<MediaStream | null>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const microphoneVolumeRef = useRef<GainNode | null>(null)
  const voiceActivityRef = useRef<number>(0)

  // Mock current user
  const currentUser: VoiceChatUser = {
    id: 'current_user',
    username: 'you',
    displayName: 'You',
    avatar: '🎤',
    isMuted,
    isDeafened,
    isSpeaking,
    volume: micVolume,
    connectionStatus: isConnected ? 'connected' : 'disconnected'
  }

  // Get available audio devices
  const getAudioDevices = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter(device => device.kind === 'audioinput')
      const audioOutputs = devices.filter(device => device.kind === 'audiooutput')
      
      setAudioDevices([
        ...audioInputs.map(device => ({ 
          deviceId: device.deviceId, 
          label: device.label || `마이크 ${device.deviceId.slice(0, 8)}`, 
          kind: 'audioinput' as const
        })),
        ...audioOutputs.map(device => ({ 
          deviceId: device.deviceId, 
          label: device.label || `스피커 ${device.deviceId.slice(0, 8)}`, 
          kind: 'audiooutput' as const
        }))
      ])

      if (audioInputs.length > 0 && !selectedMicrophone) {
        setSelectedMicrophone(audioInputs[0].deviceId)
      }
      if (audioOutputs.length > 0 && !selectedSpeaker) {
        setSelectedSpeaker(audioOutputs[0].deviceId)
      }
    } catch (error) {
      console.error('Failed to enumerate audio devices:', error)
    }
  }, [selectedMicrophone, selectedSpeaker])

  // Initialize audio devices on mount
  useEffect(() => {
    getAudioDevices()
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', getAudioDevices)
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', getAudioDevices)
    }
  }, [getAudioDevices])

  // Voice activity detection setup
  const setupVoiceActivityDetection = useCallback((stream: MediaStream) => {
    const audioContext = new AudioContext()
    const analyser = audioContext.createAnalyser()
    const microphone = audioContext.createMediaStreamSource(stream)
    const gainNode = audioContext.createGain()

    analyser.fftSize = 256
    analyser.minDecibels = -90
    analyser.maxDecibels = -10
    analyser.smoothingTimeConstant = 0.85

    microphone.connect(gainNode)
    gainNode.connect(analyser)

    audioContextRef.current = audioContext
    analyserRef.current = analyser
    microphoneVolumeRef.current = gainNode

    // Set initial volume
    gainNode.gain.value = micVolume / 100

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const detectVoiceActivity = () => {
      if (!analyserRef.current) return

      analyserRef.current.getByteFrequencyData(dataArray)
      
      // Calculate average volume
      const average = dataArray.reduce((sum, value) => sum + value, 0) / dataArray.length
      const normalizedVolume = Math.min(average / 128 * 100, 100)
      
      setVoiceActivity(normalizedVolume)
      voiceActivityRef.current = normalizedVolume

      // Detect speaking (threshold can be adjusted)
      const speakingThreshold = 15
      const wasSpeaking = isSpeaking
      const isCurrentlySpeaking = normalizedVolume > speakingThreshold

      if (isCurrentlySpeaking !== wasSpeaking) {
        setIsSpeaking(isCurrentlySpeaking)
      }

      requestAnimationFrame(detectVoiceActivity)
    }

    detectVoiceActivity()
  }, [micVolume, isSpeaking])

  // Connect to voice channel
  const connectToVoiceChannel = useCallback(async (channelId: string) => {
    if (isConnecting || isConnected) return

    setIsConnecting(true)

    try {
      // Request microphone access
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedMicrophone ? { exact: selectedMicrophone } : undefined,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        }
      })

      mediaStreamRef.current = stream
      setupVoiceActivityDetection(stream)

      // Simulate connection delay
      setTimeout(() => {
        setIsConnected(true)
        setIsConnecting(false)
        setCurrentChannel(channelId)

        // Add mock users to the channel
        setVoiceUsers([
          {
            id: 'user1',
            username: 'gamer123',
            displayName: 'Pro Gamer',
            avatar: '🎮',
            isMuted: false,
            isDeafened: false,
            isSpeaking: Math.random() > 0.7,
            volume: 70,
            connectionStatus: 'connected'
          },
          {
            id: 'user2',
            username: 'speedster',
            displayName: 'Speed King',
            avatar: '⚡',
            isMuted: false,
            isDeafened: false,
            isSpeaking: Math.random() > 0.8,
            volume: 85,
            connectionStatus: 'connected'
          }
        ])
      }, 2000)

    } catch (error) {
      console.error('Failed to connect to voice channel:', error)
      setIsConnecting(false)
      alert('마이크 접근 권한이 필요합니다.')
    }
  }, [isConnecting, isConnected, selectedMicrophone, setupVoiceActivityDetection])

  // Disconnect from voice channel
  const disconnectFromVoiceChannel = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop())
      mediaStreamRef.current = null
    }

    if (audioContextRef.current) {
      audioContextRef.current.close()
      audioContextRef.current = null
    }

    setIsConnected(false)
    setIsConnecting(false)
    setCurrentChannel(null)
    setVoiceUsers([])
    setIsSpeaking(false)
    setVoiceActivity(0)
  }, [])

  // Toggle mute
  const toggleMute = useCallback(() => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getAudioTracks().forEach(track => {
        track.enabled = isMuted
      })
    }
    setIsMuted(!isMuted)
  }, [isMuted])

  // Toggle deafen
  const toggleDeafen = useCallback(() => {
    setIsDeafened(!isDeafened)
    // In a real implementation, you'd stop processing incoming audio
  }, [isDeafened])

  // Update microphone volume
  const updateMicVolume = useCallback((newVolume: number) => {
    setMicVolume(newVolume)
    if (microphoneVolumeRef.current) {
      microphoneVolumeRef.current.gain.value = newVolume / 100
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectFromVoiceChannel()
    }
  }, [disconnectFromVoiceChannel])

  // Mock speaking animation for other users
  useEffect(() => {
    if (!isConnected) return

    const interval = setInterval(() => {
      setVoiceUsers(prev => prev.map(user => ({
        ...user,
        isSpeaking: Math.random() > 0.85
      })))
    }, 1000)

    return () => clearInterval(interval)
  }, [isConnected])

  return (
    <div className="bg-gray-800 rounded-xl border border-gray-700 overflow-hidden">
      {/* Voice channels list */}
      <div className="p-4 border-b border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-white">🎤 음성 채널</h3>
          <button
            onClick={() => setShowDeviceSettings(!showDeviceSettings)}
            className="p-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="오디오 설정"
          >
            ⚙️
          </button>
        </div>

        {/* Device settings */}
        <AnimatePresence>
          {showDeviceSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-4 p-3 bg-gray-700 rounded-lg overflow-hidden"
            >
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    마이크
                  </label>
                  <select
                    value={selectedMicrophone}
                    onChange={(e) => setSelectedMicrophone(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {audioDevices.filter(d => d.kind === 'audioinput').map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    스피커
                  </label>
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    className="w-full px-3 py-2 bg-gray-600 border border-gray-500 rounded text-white text-sm focus:outline-none focus:border-blue-500"
                  >
                    {audioDevices.filter(d => d.kind === 'audiooutput').map(device => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    마이크 볼륨: {micVolume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={micVolume}
                    onChange={(e) => updateMicVolume(Number(e.target.value))}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-300 mb-1">
                    출력 볼륨: {volume}%
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(Number(e.target.value))}
                    className="w-full"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Voice channels */}
        <div className="space-y-2">
          {voiceChannels.map(channel => (
            <div
              key={channel.id}
              className={`p-3 rounded-lg border-2 transition-all ${
                currentChannel === channel.id
                  ? 'border-green-500 bg-green-500/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-700/50'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-white">{channel.name}</span>
                    {channel.isPrivate && <span className="text-yellow-400">🔒</span>}
                    {channel.requiresPermission && <span className="text-blue-400">👑</span>}
                  </div>
                  <div className="text-sm text-gray-400">{channel.description}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {channel.currentUsers.length}/{channel.userLimit} 사용자
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {currentChannel === channel.id ? (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={disconnectFromVoiceChannel}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm font-semibold rounded transition-colors"
                    >
                      나가기
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => connectToVoiceChannel(channel.id)}
                      disabled={isConnecting}
                      className="px-3 py-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white text-sm font-semibold rounded transition-colors"
                    >
                      {isConnecting ? '연결 중...' : '참여'}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Voice chat controls (when connected) */}
      <AnimatePresence>
        {isConnected && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="border-b border-gray-700 bg-gray-800/50 overflow-hidden"
          >
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="text-sm font-semibold text-gray-300">
                  연결됨: {voiceChannels.find(c => c.id === currentChannel)?.name}
                </div>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-gray-400">음성 감지:</div>
                  <div className="w-16 h-2 bg-gray-600 rounded-full overflow-hidden">
                    <motion.div
                      animate={{ width: `${voiceActivity}%` }}
                      className={`h-full rounded-full transition-colors ${
                        isSpeaking ? 'bg-green-500' : 'bg-gray-500'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Voice controls */}
              <div className="flex items-center justify-center gap-4 mb-4">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleMute}
                  className={`p-3 rounded-full transition-colors ${
                    isMuted
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                  title={isMuted ? '음소거 해제' : '음소거'}
                >
                  {isMuted ? '🔇' : '🎤'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={toggleDeafen}
                  className={`p-3 rounded-full transition-colors ${
                    isDeafened
                      ? 'bg-red-600 text-white'
                      : 'bg-gray-600 hover:bg-gray-500 text-white'
                  }`}
                  title={isDeafened ? '소리 듣기' : '소리 차단'}
                >
                  {isDeafened ? '🔈' : '🔊'}
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={disconnectFromVoiceChannel}
                  className="p-3 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors"
                  title="음성 채널 나가기"
                >
                  📞
                </motion.button>
              </div>

              {/* Users in voice channel */}
              <div>
                <div className="text-sm font-semibold text-gray-300 mb-2">
                  음성 채널 참여자 ({voiceUsers.length + 1})
                </div>
                <div className="space-y-2">
                  {/* Current user */}
                  <div className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg">
                    <div className="relative">
                      <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-sm font-bold">
                        {currentUser.avatar}
                      </div>
                      {isSpeaking && (
                        <motion.div
                          animate={{ scale: [1, 1.2, 1] }}
                          transition={{ duration: 0.5, repeat: Infinity }}
                          className="absolute -inset-1 border-2 border-green-500 rounded-full"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-white">{currentUser.displayName} (나)</div>
                      <div className="flex items-center gap-2 text-xs">
                        {isMuted && <span className="text-red-400">음소거</span>}
                        {isDeafened && <span className="text-red-400">소리차단</span>}
                        {isSpeaking && <span className="text-green-400">말하는 중</span>}
                      </div>
                    </div>
                    <div className="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                      <motion.div
                        animate={{ width: `${voiceActivity}%` }}
                        className="h-full bg-green-500 rounded-full"
                      />
                    </div>
                  </div>

                  {/* Other users */}
                  {voiceUsers.map(user => (
                    <motion.div
                      key={user.id}
                      layout
                      className="flex items-center gap-3 p-2 bg-gray-700/50 rounded-lg"
                    >
                      <div className="relative">
                        <div className="w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center text-sm">
                          {user.avatar}
                        </div>
                        {user.isSpeaking && (
                          <motion.div
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="absolute -inset-1 border-2 border-green-500 rounded-full"
                          />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="font-semibold text-white">{user.displayName}</div>
                        <div className="flex items-center gap-2 text-xs">
                          {user.isMuted && <span className="text-red-400">음소거</span>}
                          {user.isDeafened && <span className="text-red-400">소리차단</span>}
                          {user.isSpeaking && <span className="text-green-400">말하는 중</span>}
                          <span className={`${
                            user.connectionStatus === 'connected' ? 'text-green-400' :
                            user.connectionStatus === 'connecting' || user.connectionStatus === 'reconnecting' ? 'text-yellow-400' :
                            'text-red-400'
                          }`}>
                            {user.connectionStatus === 'connected' ? '연결됨' :
                             user.connectionStatus === 'connecting' ? '연결 중' :
                             user.connectionStatus === 'reconnecting' ? '재연결 중' : '연결 끊김'}
                          </span>
                        </div>
                      </div>
                      <div className="w-12 h-2 bg-gray-600 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all"
                          style={{ width: `${user.isSpeaking ? Math.random() * 80 + 20 : 0}%` }}
                        />
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Connection status */}
      <div className="p-3 bg-gray-700/30">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${
              isConnected ? 'bg-green-500' :
              isConnecting ? 'bg-yellow-500 animate-pulse' : 
              'bg-gray-500'
            }`} />
            <span className="text-gray-400">
              {isConnected ? '음성 채널 연결됨' :
               isConnecting ? '연결 중...' : 
               '음성 채널 연결 안됨'}
            </span>
          </div>
          
          {isConnected && (
            <div className="text-gray-500 text-xs">
              지연시간: {Math.floor(Math.random() * 50 + 20)}ms
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default VoiceChatSystem