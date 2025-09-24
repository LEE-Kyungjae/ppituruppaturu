import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import SEOHead from '@/components/SEOHead';
import { generateSEO } from '@/utils/seo';
import {
  Trophy,
  Gamepad2,
  Users,
  Calendar,
  TrendingUp,
  Star,
  Play,
  Clock,
  Target,
  Award,
  Zap,
  Crown
} from 'lucide-react';

interface QuickStats {
  gamesPlayed: number;
  wins: number;
  currentStreak: number;
  bestStreak: number;
  totalPoints: number;
  level: number;
  rank: number;
  winRate: number;
}

interface RecentGame {
  id: string;
  name: string;
  icon: string;
  score: number;
  result: 'win' | 'loss';
  playedAt: string;
  duration: string;
}

interface PopularGame {
  id: string;
  name: string;
  icon: string;
  players: number;
  category: string;
  difficulty: 'easy' | 'medium' | 'hard';
  route: string;
}

const DashboardPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');

  const [quickStats, setQuickStats] = useState<QuickStats>({
    gamesPlayed: 89,
    wins: 52,
    currentStreak: 3,
    bestStreak: 12,
    totalPoints: 15320,
    level: 18,
    rank: 25,
    winRate: 58.4
  });

  const [recentGames, setRecentGames] = useState<RecentGame[]>([
    {
      id: 'click-speed',
      name: '클릭 스피드',
      icon: '⚡',
      score: 456,
      result: 'win',
      playedAt: '10분 전',
      duration: '30초'
    },
    {
      id: 'memory-match',
      name: '메모리 매치',
      icon: '🧠',
      score: 890,
      result: 'win',
      playedAt: '1시간 전',
      duration: '2분 45초'
    },
    {
      id: 'number-guess',
      name: '숫자 맞추기',
      icon: '🔢',
      score: 234,
      result: 'loss',
      playedAt: '3시간 전',
      duration: '1분 20초'
    }
  ]);

  const [popularGames, setPopularGames] = useState<PopularGame[]>([
    {
      id: 'battle-royale',
      name: '물리 배틀로얄',
      icon: '⚔️',
      players: 24,
      category: 'action',
      difficulty: 'hard',
      route: '/games/battle-royale'
    },
    {
      id: 'puzzle-race',
      name: '퍼즐 레이스',
      icon: '🧩',
      players: 18,
      category: 'puzzle',
      difficulty: 'medium',
      route: '/games/puzzle-race'
    },
    {
      id: 'rhythm-action',
      name: '리듬 액션',
      icon: '🎵',
      players: 15,
      category: 'rhythm',
      difficulty: 'hard',
      route: '/games/rhythm-action'
    }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      setUsername('Player1');
    }
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-500 bg-green-500/10';
      case 'medium': return 'text-yellow-500 bg-yellow-500/10';
      case 'hard': return 'text-red-500 bg-red-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return '쉬움';
      case 'medium': return '보통';
      case 'hard': return '어려움';
      default: return '알 수 없음';
    }
  };

  const seoProps = generateSEO({
    title: '대시보드 - 삐뚜루빠뚜루',
    description: '게임 통계와 최근 활동을 확인하고 인기 게임을 플레이해보세요.',
    keywords: ['dashboard', 'game stats', 'recent games', 'popular games'],
    url: '/dashboard'
  });

  if (!isLoggedIn) {
    return (
      <>
        <SEOHead {...seoProps} />
        <Navbar isLoggedIn={false} />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20 flex items-center justify-center">
          <div className="text-center text-white">
            <Gamepad2 className="w-24 h-24 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-300 mb-8">대시보드를 보려면 먼저 로그인해주세요.</p>
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-8 py-3 rounded-lg font-medium transition-colors">
              로그인하기
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <SEOHead {...seoProps} />
      <Navbar isLoggedIn={isLoggedIn} username={username} points={quickStats.totalPoints} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20">
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Welcome Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-4xl font-bold text-white mb-2">
              안녕하세요, {username}님! 👋
            </h1>
            <p className="text-gray-300 text-lg">
              오늘도 게임을 즐기러 오셨군요! 최근 활동을 확인해보세요.
            </p>
          </motion.div>

          {/* Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <div className="text-2xl font-bold text-blue-400 mb-1">{quickStats.level}</div>
              <div className="text-gray-300 text-sm">레벨</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <div className="text-2xl font-bold text-yellow-400 mb-1">#{quickStats.rank}</div>
              <div className="text-gray-300 text-sm">순위</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <div className="text-2xl font-bold text-green-400 mb-1">{quickStats.winRate.toFixed(1)}%</div>
              <div className="text-gray-300 text-sm">승률</div>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20 text-center">
              <div className="text-2xl font-bold text-purple-400 mb-1">{quickStats.currentStreak}</div>
              <div className="text-gray-300 text-sm">연승</div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Recent Games */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:col-span-2"
            >
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                  <Clock className="w-6 h-6" />
                  최근 게임 기록
                </h2>

                <div className="space-y-4">
                  {recentGames.map((game, index) => (
                    <motion.div
                      key={game.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-2xl">{game.icon}</div>
                        <div>
                          <h3 className="text-white font-semibold">{game.name}</h3>
                          <p className="text-gray-400 text-sm">{game.playedAt} • {game.duration}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold text-blue-400">{game.score.toLocaleString()}점</div>
                        <div className={`text-xs font-medium px-2 py-1 rounded ${
                          game.result === 'win'
                            ? 'text-green-400 bg-green-500/20'
                            : 'text-red-400 bg-red-500/20'
                        }`}>
                          {game.result === 'win' ? '승리' : '패배'}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <button className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg font-medium transition-colors">
                    더 많은 기록 보기
                  </button>
                </div>
              </div>
            </motion.div>

            {/* Sidebar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-6"
            >
              {/* Today's Challenge */}
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 backdrop-blur-sm rounded-xl p-6 border border-yellow-500/30">
                <h3 className="text-xl font-bold text-yellow-400 mb-2 flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  오늘의 도전
                </h3>
                <p className="text-gray-300 text-sm mb-4">
                  클릭 스피드 게임에서 500점 이상 달성하기!
                </p>
                <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                  <div className="bg-gradient-to-r from-yellow-500 to-orange-500 h-2 rounded-full" style={{width: '75%'}}></div>
                </div>
                <p className="text-xs text-gray-400">75% 완료 (456/500점)</p>
              </div>

              {/* Popular Games */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5" />
                  인기 게임
                </h3>

                <div className="space-y-3">
                  {popularGames.map((game, index) => (
                    <div key={game.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3">
                        <div className="text-xl">{game.icon}</div>
                        <div>
                          <h4 className="text-white text-sm font-semibold">{game.name}</h4>
                          <div className="flex items-center gap-2 text-xs">
                            <span className="text-gray-400">{game.players}명 플레이 중</span>
                            <span className={`px-2 py-0.5 rounded text-xs ${getDifficultyColor(game.difficulty)}`}>
                              {getDifficultyText(game.difficulty)}
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => window.location.href = game.route}
                        className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-lg transition-colors"
                      >
                        <Play className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                <h3 className="text-xl font-bold text-white mb-4">빠른 액션</h3>
                <div className="space-y-2">
                  <button
                    onClick={() => window.location.href = '/games'}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Gamepad2 className="w-4 h-4" />
                    게임 플레이하기
                  </button>
                  <button
                    onClick={() => window.location.href = '/leaderboard'}
                    className="w-full bg-purple-500 hover:bg-purple-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Trophy className="w-4 h-4" />
                    리더보드 보기
                  </button>
                  <button
                    onClick={() => window.location.href = '/profile'}
                    className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                  >
                    <Award className="w-4 h-4" />
                    프로필 보기
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default DashboardPage;