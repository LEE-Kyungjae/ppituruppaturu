'use client'

import { motion } from 'framer-motion'
import { Progress, HealthBar, ManaBar, EnergyBar } from '@/components/ui/progress'
import { Trophy, Zap, Target, Clock, TrendingUp, Award, Star, Crown } from 'lucide-react'
import { cn } from '@/lib/utils'

interface UserStatsData {
  totalGames: number
  winRate: number
  averageScore: number
  bestStreak: number
  totalPlayTime: string
  favoriteGame: string
  rank: string
  rankProgress: number
  achievements: number
  todayStats: {
    gamesPlayed: number
    xpGained: number
    timeSpent: string
  }
  gameStats: {
    name: string
    plays: number
    winRate: number
    bestScore: number
    icon: string
  }[]
}

const mockUserStats: UserStatsData = {
  totalGames: 247,
  winRate: 73.2,
  averageScore: 8540,
  bestStreak: 12,
  totalPlayTime: '48Ü 32„',
  favoriteGame: ']Ð‡0 0À',
  rank: 'Gold III',
  rankProgress: 65,
  achievements: 18,
  todayStats: {
    gamesPlayed: 8,
    xpGained: 340,
    timeSpent: '2Ü 15„'
  },
  gameStats: [
    { name: ']Ð‡0', plays: 89, winRate: 78, bestScore: 12450, icon: '=$' },
    { name: '¤<Ü 4ˆ', plays: 67, winRate: 71, bestScore: 9880, icon: '¡' },
    { name: 'ø¼ Þ”0', plays: 45, winRate: 69, bestScore: 7320, icon: '<¨' },
    { name: '¬ì í', plays: 46, winRate: 82, bestScore: 15600, icon: '<µ' }
  ]
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
}

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: "easeOut"
    }
  }
}

const getRankColor = (rank: string) => {
  if (rank.includes('Gold')) return 'text-yellow-400'
  if (rank.includes('Silver')) return 'text-gray-400'
  if (rank.includes('Bronze')) return 'text-orange-400'
  if (rank.includes('Diamond')) return 'text-cyan-400'
  if (rank.includes('Master')) return 'text-purple-400'
  return 'text-muted-foreground'
}

const getRankIcon = (rank: string) => {
  if (rank.includes('Gold')) return '>G'
  if (rank.includes('Silver')) return '>H'
  if (rank.includes('Bronze')) return '>I'
  if (rank.includes('Diamond')) return '=Ž'
  if (rank.includes('Master')) return '=Q'
  return '<Æ'
}

export function UserStats() {
  const stats = mockUserStats

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* ­l ô */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center gap-3 p-3 rounded-lg bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
          <div className="text-2xl">{getRankIcon(stats.rank)}</div>
          <div className="flex-1">
            <div className={cn("font-bold text-sm", getRankColor(stats.rank))}>
              {stats.rank}
            </div>
            <Progress 
              variant="xp"
              value={stats.rankProgress}
              max={100}
              size="sm"
              className="mt-1"
              animated
            />
            <div className="text-xs text-muted-foreground mt-1">
              äL ­lLÀ {100 - stats.rankProgress}% ¨L
            </div>
          </div>
        </div>
      </motion.div>

      {/* $˜X µÄ */}
      <motion.div variants={itemVariants}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Zap className="w-4 h-4 text-primary" />
            $˜X \Ù
          </h3>
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 rounded bg-background/50 border border-border/50">
              <div className="text-lg font-bold text-primary">{stats.todayStats.gamesPlayed}</div>
              <div className="text-xs text-muted-foreground">Œ„</div>
            </div>
            <div className="text-center p-2 rounded bg-background/50 border border-border/50">
              <div className="text-lg font-bold text-secondary">+{stats.todayStats.xpGained}</div>
              <div className="text-xs text-muted-foreground">XP</div>
            </div>
            <div className="text-center p-2 rounded bg-background/50 border border-border/50">
              <div className="text-lg font-bold text-accent">{stats.todayStats.timeSpent}</div>
              <div className="text-xs text-muted-foreground">t</div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ü” µÄ */}
      <motion.div variants={itemVariants}>
        <div className="space-y-3">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Trophy className="w-4 h-4 text-primary" />
            Œ„ µÄ
          </h3>
          
          <div className="space-y-3">
            {/* ¹` */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium">¹`</span>
                <span className="text-muted-foreground">{stats.winRate}%</span>
              </div>
              <Progress 
                variant="success"
                value={stats.winRate}
                max={100}
                size="sm"
                animated
              />
            </div>

            {/* ð¹ 0] */}
            <div className="flex items-center justify-between p-2 rounded bg-background/30 border border-border/30">
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-orange-400" />
                <span className="text-sm">\à ð¹</span>
              </div>
              <span className="font-bold text-orange-400">{stats.bestStreak}ð¹</span>
            </div>

            {/*  Œ„  */}
            <div className="flex items-center justify-between p-2 rounded bg-background/30 border border-border/30">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-400" />
                <span className="text-sm"> Œ„</span>
              </div>
              <span className="font-bold text-blue-400">{stats.totalGames}Œ„</span>
            </div>

            {/* Éà  */}
            <div className="flex items-center justify-between p-2 rounded bg-background/30 border border-border/30">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-green-400" />
                <span className="text-sm">Éà </span>
              </div>
              <span className="font-bold text-green-400">{stats.averageScore.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Œ„Ä µÄ */}
      <motion.div variants={itemVariants}>
        <div className="space-y-2">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Œ„Ä 1ü
          </h3>
          <div className="space-y-2">
            {stats.gameStats.map((game, index) => (
              <motion.div
                key={game.name}
                variants={itemVariants}
                className="flex items-center gap-3 p-2 rounded bg-background/30 border border-border/30 hover:bg-background/50 transition-colors"
              >
                <div className="text-lg">{game.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-medium truncate">{game.name}</span>
                    <span className="text-xs text-muted-foreground">{game.plays}Œ</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress 
                      variant="xp"
                      value={game.winRate}
                      max={100}
                      size="sm"
                      className="flex-1"
                    />
                    <span className="text-xs font-medium">{game.winRate}%</span>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    \à: {game.bestScore.toLocaleString()}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Å */}
      <motion.div variants={itemVariants}>
        <div className="flex items-center justify-between p-3 rounded-lg bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-400/20">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-purple-400" />
            <div>
              <div className="text-sm font-medium">Å</div>
              <div className="text-xs text-muted-foreground">ì1\ Å </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-purple-400">{stats.achievements}</div>
            <div className="text-xs text-muted-foreground">/ 50</div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}