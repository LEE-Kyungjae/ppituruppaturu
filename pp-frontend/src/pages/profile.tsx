import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from '@/components/layout/Navbar';
import SEOHead from '@/components/SEOHead';
import { generateSEO } from '@/utils/seo';
import {
  User,
  Trophy,
  Gamepad2,
  Calendar,
  Star,
  Edit3,
  Camera,
  TrendingUp,
  Award,
  Target,
  Clock
} from 'lucide-react';

interface GameHistory {
  gameId: string;
  gameName: string;
  score: number;
  maxScore: number;
  playedAt: string;
  rank: number;
  duration: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress?: number;
  maxProgress?: number;
}

interface UserStats {
  totalGamesPlayed: number;
  totalScore: number;
  averageScore: number;
  bestStreak: number;
  currentStreak: number;
  timeSpent: string;
  level: number;
  experience: number;
  nextLevelExp: number;
  globalRank: number;
  favoriteGame: string;
  joinedAt: string;
}

const ProfilePage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'stats' | 'games' | 'achievements'>('stats');
  const [isEditing, setIsEditing] = useState(false);
  const [userProfile, setUserProfile] = useState({
    username: 'Player1',
    nickname: '게임마스터',
    profilePicture: '',
    statusMessage: '오늘도 신기록 도전 중! 💪',
    level: 18,
    joinedAt: '2024-01-15'
  });

  const [userStats, setUserStats] = useState<UserStats>({
    totalGamesPlayed: 89,
    totalScore: 15320,
    averageScore: 172,
    bestStreak: 12,
    currentStreak: 3,
    timeSpent: '24시간 30분',
    level: 18,
    experience: 8450,
    nextLevelExp: 10000,
    globalRank: 25,
    favoriteGame: '클릭 스피드',
    joinedAt: '2024-01-15'
  });

  const [gameHistory, setGameHistory] = useState<GameHistory[]>([
    {
      gameId: 'click-speed',
      gameName: '클릭 스피드',
      score: 456,
      maxScore: 500,
      playedAt: '2024-09-24 14:30',
      rank: 3,
      duration: '30초'
    },
    {
      gameId: 'memory-match',
      gameName: '메모리 매치',
      score: 890,
      maxScore: 890,
      playedAt: '2024-09-24 13:15',
      rank: 1,
      duration: '2분 45초'
    },
    {
      gameId: 'number-guess',
      gameName: '숫자 맞추기',
      score: 234,
      maxScore: 280,
      playedAt: '2024-09-23 19:22',
      rank: 7,
      duration: '1분 20초'
    }
  ]);

  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: 'first-win',
      name: '첫 승리',
      description: '첫 번째 게임에서 승리하세요',
      icon: '🏆',
      unlockedAt: '2024-01-15'
    },
    {
      id: 'speed-demon',
      name: '스피드 악마',
      description: '클릭 스피드 게임에서 400점 이상 획득',
      icon: '⚡',
      unlockedAt: '2024-03-10'
    },
    {
      id: 'memory-master',
      name: '기억력 마스터',
      description: '메모리 매치 게임을 5회 연속 완벽하게 클리어',
      icon: '🧠',
      unlockedAt: '2024-05-22'
    },
    {
      id: 'streak-master',
      name: '연승왕',
      description: '10연승 달성',
      icon: '🔥',
      progress: 3,
      maxProgress: 10
    },
    {
      id: 'dedication',
      name: '헌신자',
      description: '총 플레이 시간 100시간 달성',
      icon: '⏰',
      progress: 24,
      maxProgress: 100
    }
  ]);

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    setIsLoggedIn(!!token);
  }, []);

  const handleSaveProfile = () => {
    // API call to save profile
    setIsEditing(false);
  };

  const experienceProgress = (userStats.experience / userStats.nextLevelExp) * 100;

  const tabs = [
    { id: 'stats', name: '통계', icon: TrendingUp },
    { id: 'games', name: '게임 기록', icon: Gamepad2 },
    { id: 'achievements', name: '업적', icon: Award }
  ];

  const seoProps = generateSEO({
    title: '프로필 - 삐뚜루빠뚜루',
    description: '내 게임 통계와 기록을 확인하고 프로필을 관리해보세요.',
    keywords: ['profile', 'stats', 'achievements', 'game history'],
    url: '/profile'
  });

  if (!isLoggedIn) {
    return (
      <>
        <SEOHead {...seoProps} />
        <Navbar isLoggedIn={false} />
        <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20 flex items-center justify-center">
          <div className="text-center text-white">
            <User className="w-24 h-24 mx-auto mb-4 text-gray-400" />
            <h1 className="text-3xl font-bold mb-4">로그인이 필요합니다</h1>
            <p className="text-gray-300 mb-8">프로필을 보려면 먼저 로그인해주세요.</p>
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
      <Navbar isLoggedIn={isLoggedIn} username={userProfile.username} />

      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 pt-20">
        <div className="max-w-6xl mx-auto px-4 py-8">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Profile Picture */}
              <div className="relative">
                <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white text-3xl font-bold">
                  {userProfile.username.charAt(0).toUpperCase()}
                </div>
                {isEditing && (
                  <button className="absolute -bottom-2 -right-2 bg-blue-500 text-white p-2 rounded-full hover:bg-blue-600 transition-colors">
                    <Camera className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-3">
                    <input
                      type="text"
                      value={userProfile.nickname}
                      onChange={(e) => setUserProfile({...userProfile, nickname: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-white text-xl font-bold w-full"
                      placeholder="닉네임"
                    />
                    <input
                      type="text"
                      value={userProfile.statusMessage}
                      onChange={(e) => setUserProfile({...userProfile, statusMessage: e.target.value})}
                      className="bg-white/10 border border-white/20 rounded-lg px-4 py-2 text-gray-300 w-full"
                      placeholder="상태 메시지"
                    />
                  </div>
                ) : (
                  <div>
                    <h1 className="text-3xl font-bold text-white mb-2">{userProfile.nickname}</h1>
                    <p className="text-gray-300 mb-2">@{userProfile.username}</p>
                    <p className="text-gray-400 italic">{userProfile.statusMessage}</p>
                  </div>
                )}

                {/* Level & Experience */}
                <div className="mt-4">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="text-yellow-400 font-bold text-lg">레벨 {userStats.level}</span>
                    <span className="text-gray-300 text-sm">전체 랭킹 #{userStats.globalRank}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-3">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-500"
                      style={{ width: `${experienceProgress}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-sm text-gray-400 mt-1">
                    <span>{userStats.experience.toLocaleString()} XP</span>
                    <span>{userStats.nextLevelExp.toLocaleString()} XP</span>
                  </div>
                </div>
              </div>

              {/* Edit Button */}
              <div>
                {isEditing ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveProfile}
                      className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                    >
                      저장
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg transition-colors"
                    >
                      취소
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                    편집
                  </button>
                )}
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex justify-center mb-8"
          >
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-2 border border-white/20">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 flex items-center gap-2 ${
                      activeTab === tab.id
                        ? 'bg-white text-gray-900 shadow-lg'
                        : 'text-white hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {tab.name}
                  </button>
                );
              })}
            </div>
          </motion.div>

          {/* Tab Content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20"
            >
              {activeTab === 'stats' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <TrendingUp className="w-6 h-6" />
                    게임 통계
                  </h2>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-400 mb-2">{userStats.totalGamesPlayed}</div>
                      <div className="text-gray-300">총 게임 수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-green-400 mb-2">{userStats.totalScore.toLocaleString()}</div>
                      <div className="text-gray-300">총 점수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-yellow-400 mb-2">{userStats.averageScore}</div>
                      <div className="text-gray-300">평균 점수</div>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-400 mb-2">{userStats.bestStreak}</div>
                      <div className="text-gray-300">최고 연승</div>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">현재 상태</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">현재 연승</span>
                          <span className="text-orange-400 font-bold">{userStats.currentStreak}승</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">선호 게임</span>
                          <span className="text-blue-400">{userStats.favoriteGame}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">플레이 시간</span>
                          <span className="text-green-400">{userStats.timeSpent}</span>
                        </div>
                      </div>
                    </div>

                    <div className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-lg font-semibold text-white mb-3">가입 정보</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-300">가입일</span>
                          <span className="text-gray-400">{userStats.joinedAt}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-300">활동 일수</span>
                          <span className="text-blue-400">
                            {Math.floor((new Date().getTime() - new Date(userStats.joinedAt).getTime()) / (1000 * 60 * 60 * 24))}일
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'games' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Gamepad2 className="w-6 h-6" />
                    최근 게임 기록
                  </h2>

                  <div className="space-y-4">
                    {gameHistory.map((game, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="bg-white/5 rounded-lg p-4 hover:bg-white/10 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="text-2xl">{game.gameId === 'click-speed' ? '⚡' : game.gameId === 'memory-match' ? '🧠' : '🔢'}</div>
                            <div>
                              <h3 className="text-lg font-semibold text-white">{game.gameName}</h3>
                              <p className="text-sm text-gray-400">{game.playedAt} • {game.duration}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-xl font-bold text-blue-400">{game.score.toLocaleString()}점</div>
                            <div className="text-sm text-gray-400">
                              {game.score === game.maxScore && <span className="text-yellow-400">🏆 신기록!</span>}
                              {game.rank <= 3 && <span className="text-orange-400">#{game.rank} 순위</span>}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'achievements' && (
                <div>
                  <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
                    <Award className="w-6 h-6" />
                    업적
                  </h2>

                  <div className="grid md:grid-cols-2 gap-6">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={achievement.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border-2 transition-colors ${
                          achievement.unlockedAt
                            ? 'bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30'
                            : 'bg-white/5 border-gray-600'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div className="text-3xl">{achievement.icon}</div>
                          <div className="flex-1">
                            <h3 className={`text-lg font-semibold ${achievement.unlockedAt ? 'text-yellow-400' : 'text-gray-300'}`}>
                              {achievement.name}
                            </h3>
                            <p className="text-gray-400 text-sm mb-2">{achievement.description}</p>

                            {achievement.unlockedAt ? (
                              <div className="text-xs text-yellow-500">
                                <Calendar className="w-3 h-3 inline mr-1" />
                                {achievement.unlockedAt}에 달성
                              </div>
                            ) : achievement.progress !== undefined ? (
                              <div className="mt-2">
                                <div className="w-full bg-gray-700 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${(achievement.progress! / achievement.maxProgress!) * 100}%` }}
                                  />
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {achievement.progress} / {achievement.maxProgress}
                                </div>
                              </div>
                            ) : (
                              <div className="text-xs text-gray-500">미달성</div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </>
  );
};

export default ProfilePage;