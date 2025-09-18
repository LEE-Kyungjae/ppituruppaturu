import React from 'react';
import { motion } from 'framer-motion';
import { FaDownload, FaGamepad, FaMobile, FaApple, FaGooglePlay } from 'react-icons/fa';

interface MobileAppPromotionProps {
  gameName: string;
  gameDescription: string;
  gameIcon: string;
}

const MobileAppPromotion: React.FC<MobileAppPromotionProps> = ({ 
  gameName, 
  gameDescription, 
  gameIcon 
}) => {
  const handleDownload = (platform: 'ios' | 'android') => {
    // 실제 앱스토어 링크로 교체
    if (platform === 'ios') {
      window.open('https://apps.apple.com/app/pitturu-ppaturu', '_blank');
    } else {
      window.open('https://play.google.com/store/apps/details?id=com.pitturu.ppaturu', '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-700 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="relative">
          {/* 헤더 배경 */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 p-8 text-white text-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="text-6xl mb-4"
            >
              {gameIcon}
            </motion.div>
            <h1 className="text-4xl font-bold mb-2">{gameName}</h1>
            <p className="text-xl opacity-90">{gameDescription}</p>
          </div>

          {/* 메인 콘텐츠 */}
          <div className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* 왼쪽: 모바일 앱 정보 */}
              <div className="space-y-6">
                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.4 }}
                  className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl"
                >
                  <FaMobile className="text-3xl text-blue-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">모바일 전용 게임</h3>
                    <p className="text-gray-600">터치 컨트롤에 최적화된 네이티브 게임</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.5 }}
                  className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl"
                >
                  <FaGamepad className="text-3xl text-green-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">60fps 부드러운 게임플레이</h3>
                    <p className="text-gray-600">Flutter 엔진으로 구현한 고성능 물리 게임</p>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6, delay: 0.6 }}
                  className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl"
                >
                  <FaDownload className="text-3xl text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">무료 다운로드</h3>
                    <p className="text-gray-600">지금 바로 미니게임 천국을 경험하세요</p>
                  </div>
                </motion.div>
              </div>

              {/* 오른쪽: 모바일 목업 */}
              <motion.div
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.6, delay: 0.4 }}
                className="flex justify-center"
              >
                <div className="relative">
                  {/* 모바일 프레임 */}
                  <div className="w-64 h-[500px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl">
                    <div className="w-full h-full bg-white rounded-[2.5rem] overflow-hidden relative">
                      {/* 상태바 */}
                      <div className="h-6 bg-gray-100 flex items-center justify-center">
                        <div className="w-20 h-1 bg-gray-400 rounded-full"></div>
                      </div>
                      
                      {/* 게임 스크린샷 영역 */}
                      <div className="h-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center">
                        <div className="text-white text-center">
                          <div className="text-4xl mb-2">{gameIcon}</div>
                          <div className="text-sm font-medium">{gameName}</div>
                          <div className="text-xs opacity-80 mt-1">모바일에서 플레이</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* 플로팅 아이콘들 */}
                  <motion.div
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute -top-4 -left-4 w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg"
                  >
                    ⭐
                  </motion.div>
                  <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 1 }}
                    className="absolute -bottom-4 -right-4 w-12 h-12 bg-pink-400 rounded-full flex items-center justify-center shadow-lg"
                  >
                    🎮
                  </motion.div>
                </div>
              </motion.div>
            </div>

            {/* 다운로드 버튼 */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="mt-8 flex flex-col sm:flex-row gap-4 justify-center"
            >
              <button
                onClick={() => handleDownload('ios')}
                className="flex items-center justify-center space-x-3 bg-black text-white px-8 py-4 rounded-xl hover:bg-gray-800 transition-colors"
              >
                <FaApple className="text-2xl" />
                <div className="text-left">
                  <div className="text-xs">Download on the</div>
                  <div className="text-lg font-semibold">App Store</div>
                </div>
              </button>

              <button
                onClick={() => handleDownload('android')}
                className="flex items-center justify-center space-x-3 bg-green-600 text-white px-8 py-4 rounded-xl hover:bg-green-700 transition-colors"
              >
                <FaGooglePlay className="text-2xl" />
                <div className="text-left">
                  <div className="text-xs">GET IT ON</div>
                  <div className="text-lg font-semibold">Google Play</div>
                </div>
              </button>
            </motion.div>

            {/* 웹에서 할 수 있는 것들 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.8 }}
              className="mt-12 p-6 bg-gray-50 rounded-xl"
            >
              <h3 className="text-xl font-semibold text-gray-800 mb-4 text-center">
                웹에서는 이런 것들을 할 수 있어요!
              </h3>
              <div className="grid sm:grid-cols-3 gap-4 text-center">
                <div className="p-4">
                  <div className="text-2xl mb-2">📊</div>
                  <div className="font-medium text-gray-800">게임 통계</div>
                  <div className="text-sm text-gray-600">점수와 순위 확인</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2">👥</div>
                  <div className="font-medium text-gray-800">커뮤니티</div>
                  <div className="text-sm text-gray-600">다른 유저들과 소통</div>
                </div>
                <div className="p-4">
                  <div className="text-2xl mb-2">⚙️</div>
                  <div className="font-medium text-gray-800">계정 관리</div>
                  <div className="text-sm text-gray-600">프로필과 설정</div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default MobileAppPromotion;