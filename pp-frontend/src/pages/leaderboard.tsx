import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import SEOHead from '@/components/SEOHead';
import { generateSEO } from '@/utils/seo';
import { Trophy, Medal, Crown, TrendingUp, Calendar, Gamepad2, Users } from 'lucide-react';

interface LeaderboardUser {
  rank: number;
  username: string;
  profilePicture?: string;
  totalScore: number;
  gamesPlayed: number;
  lastActive: string;
  level: number;
  badge?: string;
}

interface GameLeaderboard {
  gameId: string;
  gameName: string;
  icon: string;
  users: LeaderboardUser[];
}

const LeaderboardPage = () => {
  const [selectedCategory, setSelectedCategory] = useState<'overall' | 'weekly' | 'monthly'>('overall');
  const [selectedGame, setSelectedGame] = useState<string>('all');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<LeaderboardUser | null>(null);

  // Mock data - 실제로는 API에서 가져올 데이터
  const [overallLeaderboard, setOverallLeaderboard] = useState<LeaderboardUser[]>([
    {
      rank: 1,
      username: "SpeedMaster99",
      totalScore: 45680,
      gamesPlayed: 234,
      lastActive: "2024-09-24",
      level: 47,
      badge: "🏆"
    },
    {
      rank: 2,
      username: "MemoryGenius",
      totalScore: 42150,
      gamesPlayed: 198,
      lastActive: "2024-09-24",
      level: 43,
      badge: "🥈"
    },
    {
      rank: 3,
      username: "PuzzleWizard",
      totalScore: 38920,
      gamesPlayed: 176,
      lastActive: "2024-09-23",
      level: 39,
      badge: "🥉"
    },
    {
      rank: 4,
      username: "QuickThinking",
      totalScore: 35600,
      gamesPlayed: 154,
      lastActive: "2024-09-23",
      level: 35,
    },
    {
      rank: 5,
      username: "GameChampion",
      totalScore: 32450,
      gamesPlayed: 142,
      lastActive: "2024-09-22",
      level: 32,
    }
  ]);

  const gameLeaderboards: GameLeaderboard[] = [
    {
      gameId: 'click-speed',
      gameName: '클릭 스피드',
      icon: '⚡',
      users: overallLeaderboard.slice(0, 5)
    },
    {
      gameId: 'memory-match',
      gameName: '메모리 매치',
      icon: '🧠',
      users: [...overallLeaderboard].reverse().slice(0, 5)
    },
    {
      gameId: 'number-guess',
      gameName: '숫자 맞추기',
      icon: '🔢',
      users: [...overallLeaderboard].sort(() => Math.random() - 0.5).slice(0, 5)
    }
  ];

  useEffect(() => {
    // Check login status and fetch user data
    const token = localStorage.getItem('auth_token');
    if (token) {
      setIsLoggedIn(true);
      // Mock current user data
      setCurrentUser({
        rank: 25,
        username: "Player1",
        totalScore: 15320,
        gamesPlayed: 89,
        lastActive: "2024-09-24",
        level: 18
      });
    }
  }, []);

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Medal className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const getScoreColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-500';
      case 2:
        return 'text-gray-400';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-blue-500';
    }
  };

  const categories = [
    { id: 'overall', name: '전체', icon: Trophy },
    { id: 'weekly', name: '주간', icon: Calendar },
    { id: 'monthly', name: '월간', icon: TrendingUp }
  ];

  const seoProps = generateSEO({
    title: '리더보드 - 삐뚜루빠뚜루',
    description: '전체 플레이어 랭킹을 확인하고 최고 점수에 도전해보세요!',
    keywords: ['leaderboard', 'ranking', 'top players', 'high scores'],
    url: '/leaderboard'
  });

  return (
    <>
      <SEOHead {...seoProps} />
      <Navbar isLoggedIn={isLoggedIn} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
              <Trophy className="w-12 h-12 text-yellow-500" />
              리더보드
            </h1>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              최고의 플레이어들과 경쟁하고 랭킹을 올려보세요!
            </p>
          </motion.div>

          {/* Current User Stats */}
          {isLoggedIn && currentUser && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
            >
              <h2 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                내 순위
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-500">#{currentUser.rank}</div>
                  <div className="text-gray-300 text-sm">전체 순위</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{currentUser.totalScore.toLocaleString()}</div>
                  <div className="text-gray-300 text-sm">총 점수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{currentUser.gamesPlayed}</div>
                  <div className="text-gray-300 text-sm">플레이 횟수</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-400">LV.{currentUser.level}</div>
                  <div className="text-gray-300 text-sm">레벨</div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Category Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
              {categories.map((category) => {
                const Icon = category.icon;
                return (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id as any)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      selectedCategory === category.id
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {category.name}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Game Filter */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <div className="flex flex-wrap justify-center gap-3">
              <button
                onClick={() => setSelectedGame('all')}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  selectedGame === 'all'
                    ? 'bg-blue-500 text-white shadow-lg'
                    : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                }`}
              >
                <Gamepad2 className="w-4 h-4 inline mr-2" />
                전체 게임
              </button>
              {gameLeaderboards.map((game) => (
                <button
                  key={game.gameId}
                  onClick={() => setSelectedGame(game.gameId)}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                    selectedGame === game.gameId
                      ? 'bg-blue-500 text-white shadow-lg'
                      : 'bg-white/10 text-white hover:bg-white/20 border border-white/20'
                  }`}
                >
                  {game.icon} {game.gameName}
                </button>
              ))}
            </div>
          </motion.div>

          {/* Leaderboard */}
          <AnimatePresence mode="wait">
            <motion.div
              key={`${selectedCategory}-${selectedGame}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: 0.1 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-2xl font-bold text-white mb-6">
                  {selectedGame === 'all' ? '전체 랭킹' :
                   gameLeaderboards.find(g => g.gameId === selectedGame)?.gameName + ' 랭킹'}
                </h2>

                <div className="space-y-4">
                  {(selectedGame === 'all' ? overallLeaderboard :
                    gameLeaderboards.find(g => g.gameId === selectedGame)?.users || []
                  ).map((user, index) => (
                    <motion.div
                      key={user.username}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 hover:bg-white/5 ${
                        user.rank <= 3 ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20' : 'bg-white/5'
                      }`}
                    >
                      {/* Rank */}
                      <div className="flex items-center justify-center w-12 h-12">
                        {getRankIcon(user.rank)}
                      </div>

                      {/* Profile */}
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                          {user.username.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-semibold text-white flex items-center gap-2">
                            {user.username}
                            {user.badge && <span>{user.badge}</span>}
                          </div>
                          <div className="text-sm text-gray-400">
                            레벨 {user.level} • {user.gamesPlayed}회 플레이
                          </div>
                        </div>
                      </div>

                      {/* Score */}
                      <div className="text-right">
                        <div className={`text-2xl font-bold ${getScoreColor(user.rank)}`}>
                          {user.totalScore.toLocaleString()}
                        </div>
                        <div className="text-sm text-gray-400">
                          {user.lastActive}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default LeaderboardPage;