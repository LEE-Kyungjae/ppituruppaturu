// frontend/src/pages/chat.tsx
import { useState } from 'react'
import { motion } from 'framer-motion'
import ChatSystem from '@/components/chat/ChatSystem'

export default function Chat() {
  const [selectedRoom, setSelectedRoom] = useState('global')

  const chatRooms = [
    { id: 'global', name: '전체 채팅', icon: '🌍', description: '모든 유저와 채팅' },
    { id: 'game_tips', name: '게임 팁', icon: '🎯', description: '게임 공략 및 팁 공유' },
    { id: 'newbie', name: '초보자', icon: '🌱', description: '초보자를 위한 채팅' },
    { id: 'premium', name: '프리미엄', icon: '👑', description: '프리미엄 회원 전용' },
    { id: 'click_speed', name: '클릭 스피드', icon: '⚡', description: '클릭 스피드 게임 방' },
    { id: 'memory_match', name: '메모리 매치', icon: '🧠', description: '메모리 매치 게임 방' },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900">
      <div className="container mx-auto px-4 py-8">
        {/* 헤더 */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h1 className="text-4xl font-bold text-white mb-4">💬 게임 채팅</h1>
          <p className="text-white/70">다른 플레이어들과 소통하고 게임 팁을 공유하세요!</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* 채팅방 목록 */}
          <motion.div
            className="lg:col-span-1"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <div className="bg-white/10 backdrop-blur-md rounded-xl p-4">
              <h3 className="text-lg font-bold text-white mb-4">채팅방</h3>
              <div className="space-y-2">
                {chatRooms.map((room) => (
                  <button
                    key={room.id}
                    onClick={() => setSelectedRoom(room.id)}
                    className={`w-full text-left p-3 rounded-lg transition-all ${
                      selectedRoom === room.id
                        ? 'bg-purple-600 text-white'
                        : 'bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-1">
                      <span>{room.icon}</span>
                      <span className="font-medium">{room.name}</span>
                    </div>
                    <div className="text-xs opacity-80 pl-6">
                      {room.description}
                    </div>
                  </button>
                ))}
              </div>

              {/* 채팅 규칙 */}
              <div className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                <h4 className="text-yellow-400 font-bold text-sm mb-2">📋 채팅 규칙</h4>
                <ul className="text-yellow-200 text-xs space-y-1">
                  <li>• 욕설, 비하 금지</li>
                  <li>• 스팸, 광고 금지</li>
                  <li>• 개인정보 공유 금지</li>
                  <li>• 게임과 관련된 대화 권장</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* 메인 채팅 영역 */}
          <motion.div
            className="lg:col-span-3"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <ChatSystem 
              gameRoom={selectedRoom}
              maxHeight="600px"
              className="h-full"
            />
          </motion.div>
        </div>

        {/* 채팅 통계 */}
        <motion.div
          className="mt-8 grid grid-cols-1 md:grid-cols-4 gap-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-green-400">245</div>
            <div className="text-white/70 text-sm">온라인 사용자</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-blue-400">1.2K</div>
            <div className="text-white/70 text-sm">오늘 메시지</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-purple-400">6</div>
            <div className="text-white/70 text-sm">활성 채팅방</div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 text-center">
            <div className="text-3xl font-bold text-yellow-400">98%</div>
            <div className="text-white/70 text-sm">가동률</div>
          </div>
        </motion.div>

        {/* 프리미엄 광고 */}
        <motion.div
          className="mt-8 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-white mb-2">
                👑 프리미엄 채팅 혜택
              </h3>
              <p className="text-white/70 mb-4">
                프리미엄 회원만의 특별한 채팅 기능을 경험해보세요!
              </p>
              <ul className="text-white/80 text-sm space-y-1">
                <li>• 프리미엄 전용 채팅방 접근</li>
                <li>• 특별한 닉네임 색상과 배지</li>
                <li>• 메시지 우선 표시</li>
                <li>• 이모지 및 스티커 사용</li>
              </ul>
            </div>
            <div className="text-6xl opacity-20">👑</div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}