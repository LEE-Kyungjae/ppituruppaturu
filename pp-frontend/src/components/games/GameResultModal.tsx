'use client'

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { GameType } from '@/lib/game-engine/types'
import { GameStatsManager, GameStorageManager, GameUtils, LeaderboardEntry } from '@/lib/game-utils'
import {
  Trophy,
  Crown,
  Medal,
  Award,
  Star,
  Target,
  Clock,
  TrendingUp,
  Share2,
  RotateCcw,
  Home,
  Users,
  Zap,
  X
} from 'lucide-react'

interface GameResultModalProps {
  isOpen: boolean
  gameType: GameType
  score: number
  gameTime: number
  isWin: boolean
  rank?: number
  totalPlayers?: number
  stats?: {
    accuracy?: number
    combo?: number
    perfect?: number
    good?: number
    miss?: number
    [key: string]: any
  }
  onRestart: () => void
  onHome: () => void
  onClose: () => void
}

interface ScoreAnalysis {
  grade: string
  gradeColor: string
  isPersonalBest: boolean
  rankImprovement: number
  experienceGained: number
  levelUp: boolean
  newAchievements: string[]
}

export function GameResultModal({
  isOpen,
  gameType,
  score,
  gameTime,
  isWin,
  rank = 1,
  totalPlayers = 1,
  stats = {},
  onRestart,
  onHome,
  onClose
}: GameResultModalProps) {
  const [scoreAnalysis, setScoreAnalysis] = useState<ScoreAnalysis | null>(null)
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [showStats, setShowStats] = useState(false)

  useEffect(() => {
    if (isOpen && score > 0) {
      // 게임 결과를 저장하고 분석
      const userStatsBefore = GameStorageManager.getUserStats()

      // 게임 결과 업데이트
      GameStatsManager.updateGameResult(gameType, score, isWin, gameTime)

      const userStatsAfter = GameStorageManager.getUserStats()

      // 점수 분석 생성
      const analysis: ScoreAnalysis = {
        grade: getScoreGrade(score),
        gradeColor: getGradeColor(getScoreGrade(score)),
        isPersonalBest: score > (userStatsBefore.gameTypeStats[gameType]?.bestScore || 0),
        rankImprovement: userStatsAfter.level - userStatsBefore.level,
        experienceGained: userStatsAfter.experience - userStatsBefore.experience +
                         (userStatsAfter.level - userStatsBefore.level) * 1000,
        levelUp: userStatsAfter.level > userStatsBefore.level,
        newAchievements: [] // 실제로는 업적 시스템에서 가져와야 함
      }

      setScoreAnalysis(analysis)

      // 리더보드 업데이트
      const newLeaderboard = GameStorageManager.getLeaderboard(gameType, 10)
      setLeaderboard(newLeaderboard)
    }
  }, [isOpen, score, gameType, isWin, gameTime])

  const getScoreGrade = (score: number): string => {
    if (score >= 950000) return 'SSS'
    if (score >= 900000) return 'SS'
    if (score >= 850000) return 'S'
    if (score >= 800000) return 'A'
    if (score >= 700000) return 'B'
    if (score >= 600000) return 'C'
    return 'D'
  }

  const getGradeColor = (grade: string): string => {
    const colors: Record<string, string> = {
      'SSS': 'text-purple-600',
      'SS': 'text-blue-600',
      'S': 'text-green-600',
      'A': 'text-yellow-600',
      'B': 'text-orange-600',
      'C': 'text-red-600',
      'D': 'text-gray-600'
    }
    return colors[grade] || 'text-gray-600'
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="w-6 h-6 text-yellow-500" />
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />
    if (rank === 3) return <Award className="w-6 h-6 text-orange-500" />
    return <Trophy className="w-6 h-6 text-blue-500" />
  }

  const handleShare = () => {
    const shareText = `PittuRu에서 ${GameUtils.getGameTypeIcon(gameType)} ${getGameTypeName(gameType)}을(를) 플레이했어요!\n점수: ${GameUtils.formatScore(score)}\n등급: ${scoreAnalysis?.grade}\n#PittuRu #게임`

    if (navigator.share) {
      navigator.share({
        title: 'PittuRu 게임 결과',
        text: shareText
      })
    } else {
      navigator.clipboard.writeText(shareText)
    }
  }

  const getGameTypeName = (type: GameType): string => {
    const names: Record<GameType, string> = {
      'physics_battle_royale': '물리 배틀로얄',
      'team_strategy': '팀 전략',
      'puzzle_race': '퍼즐 레이스',
      'rhythm_action': '리듬 액션',
      'physics_destruction': '물리 파괴',
      'click_speed': '클릭 스피드',
      'memory_match': '기억력 매치',
      'number_guess': '숫자 맞히기'
    }
    return names[type] || '알 수 없는 게임'
  }

  if (!isOpen || !scoreAnalysis) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.8, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.8, y: 20 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <Card variant="glass" className="relative">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 z-10"
          >
            <X className="w-4 h-4" />
          </Button>

          <CardHeader className="text-center pb-4">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
            >
              {getRankIcon(rank)}
            </motion.div>

            <CardTitle level={2} className="mt-2">
              {isWin ? '🎉 승리!' : '🎮 게임 완료!'}
            </CardTitle>

            <CardDescription>
              {getGameTypeName(gameType)} 결과
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* 점수 및 등급 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-center space-y-4"
            >
              <div>
                <div className={`text-5xl font-bold mb-2 ${scoreAnalysis.gradeColor}`}>
                  {scoreAnalysis.grade}
                </div>
                <div className="text-3xl font-bold text-gray-800 mb-1">
                  {GameUtils.formatScore(score)}
                </div>
                <div className="text-sm text-gray-600">
                  {scoreAnalysis.isPersonalBest && (
                    <span className="bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full mr-2">
                      🏆 개인 최고 기록!
                    </span>
                  )}
                  {totalPlayers > 1 && (
                    <span>
                      {rank}/{totalPlayers} 위
                    </span>
                  )}
                </div>
              </div>

              {/* 레벨업 효과 */}
              {scoreAnalysis.levelUp && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-gradient-to-r from-purple-100 to-blue-100 p-4 rounded-lg"
                >
                  <div className="text-lg font-bold text-purple-600">
                    🎉 레벨 업!
                  </div>
                  <div className="text-sm text-gray-600">
                    +{scoreAnalysis.experienceGained} 경험치 획득
                  </div>
                </motion.div>
              )}
            </motion.div>

            {/* 게임 통계 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold">게임 통계</h4>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowStats(!showStats)}
                >
                  {showStats ? '간단히' : '자세히'}
                </Button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-xl font-bold text-blue-600">
                    {GameUtils.formatTime(gameTime)}
                  </div>
                  <div className="text-xs text-gray-600">게임 시간</div>
                </div>

                {stats.accuracy !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-green-600">
                      {stats.accuracy}%
                    </div>
                    <div className="text-xs text-gray-600">정확도</div>
                  </div>
                )}

                {stats.combo !== undefined && (
                  <div className="text-center">
                    <div className="text-xl font-bold text-purple-600">
                      {stats.combo}
                    </div>
                    <div className="text-xs text-gray-600">최대 콤보</div>
                  </div>
                )}

                <div className="text-center">
                  <div className="text-xl font-bold text-yellow-600">
                    +{scoreAnalysis.experienceGained}
                  </div>
                  <div className="text-xs text-gray-600">경험치</div>
                </div>
              </div>

              {/* 상세 통계 */}
              {showStats && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  transition={{ delay: 0.2 }}
                  className="mt-4 p-4 bg-gray-50 rounded-lg space-y-2"
                >
                  {Object.entries(stats).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                      <span className="font-medium">{value}</span>
                    </div>
                  ))}
                </motion.div>
              )}
            </motion.div>

            {/* 리더보드 */}
            {leaderboard.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
              >
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  리더보드 TOP 5
                </h4>
                <div className="space-y-2">
                  {leaderboard.slice(0, 5).map((entry, index) => (
                    <div
                      key={entry.rank}
                      className={`flex items-center justify-between p-2 rounded-lg ${
                        entry.score === score ? 'bg-blue-100 border border-blue-300' : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-yellow-500 text-white' :
                          index === 1 ? 'bg-gray-400 text-white' :
                          index === 2 ? 'bg-orange-500 text-white' :
                          'bg-gray-200 text-gray-600'
                        }`}>
                          {entry.rank}
                        </div>
                        <span className="font-medium">
                          {entry.username}
                          {entry.score === score && ' (나)'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{GameUtils.formatScore(entry.score)}</div>
                        <div className="text-xs text-gray-500">
                          {entry.date.toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 액션 버튼들 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex flex-col sm:flex-row gap-3 pt-4 border-t"
            >
              <Button
                onClick={onRestart}
                leftIcon={<RotateCcw className="w-4 h-4" />}
                className="flex-1"
              >
                다시 플레이
              </Button>

              <Button
                variant="outline"
                onClick={handleShare}
                leftIcon={<Share2 className="w-4 h-4" />}
                className="flex-1"
              >
                결과 공유
              </Button>

              <Button
                variant="outline"
                onClick={onHome}
                leftIcon={<Home className="w-4 h-4" />}
                className="flex-1"
              >
                홈으로
              </Button>
            </motion.div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  )
}