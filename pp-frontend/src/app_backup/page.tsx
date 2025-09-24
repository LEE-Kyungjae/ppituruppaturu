import { Metadata } from 'next'

export const metadata: Metadata = {
  title: '홈',
  description: '삐뚜루빠뚜루 메인 게임 플랫폼',
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-8">
      <div className="container mx-auto max-w-4xl">
        <header className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent mb-4">
            🎮 삐뚜루빠뚜루
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            실시간 채팅과 소셜 기능이 있는 미니게임 플랫폼
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-8 py-3 rounded-lg font-semibold hover:scale-105 transform transition-all duration-200 shadow-lg">
              지금 플레이
            </button>
            <button className="border border-gray-300 bg-white text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              리더보드
            </button>
            <button className="text-gray-600 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-all duration-200">
              친구 찾기
            </button>
          </div>
        </header>

        <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* 게임 영역 */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                🎯 인기 게임
              </h2>
              <p className="text-gray-600 mb-6">
                지금 가장 핫한 게임들을 플레이해보세요!
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🎲</div>
                  <h3 className="font-semibold">주사위 게임</h3>
                  <p className="text-sm text-gray-600">운을 시험해보세요</p>
                </div>
                <div className="bg-gradient-to-br from-green-100 to-green-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🃏</div>
                  <h3 className="font-semibold">카드 게임</h3>
                  <p className="text-sm text-gray-600">전략을 세워보세요</p>
                </div>
                <div className="bg-gradient-to-br from-purple-100 to-purple-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🧩</div>
                  <h3 className="font-semibold">퍼즐 게임</h3>
                  <p className="text-sm text-gray-600">두뇌를 훈련하세요</p>
                </div>
                <div className="bg-gradient-to-br from-yellow-100 to-yellow-200 p-4 rounded-lg">
                  <div className="text-2xl mb-2">🏃</div>
                  <h3 className="font-semibold">액션 게임</h3>
                  <p className="text-sm text-gray-600">빠른 반응이 필요해요</p>
                </div>
              </div>
            </div>
          </div>

          {/* 사이드바 */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">⚡ 내 상태</h3>
              <div className="text-center mb-4">
                <div className="text-2xl font-bold text-purple-600 mb-2">레벨 42</div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-3 rounded-full" style={{width: '75%'}}></div>
                </div>
                <div className="text-sm text-gray-600 mt-1">750 / 1000 XP</div>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-blue-600">1,234</div>
                  <div className="text-xs text-gray-600">승리</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-green-600">42</div>
                  <div className="text-xs text-gray-600">연승</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-purple-600">98.5%</div>
                  <div className="text-xs text-gray-600">승률</div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">💬 실시간 채팅</h3>
              <div className="space-y-3 h-40 overflow-y-auto mb-4 text-sm">
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <div className="font-semibold text-gray-800">플레이어1</div>
                    <div className="text-gray-600">누구 게임할래?</div>
                  </div>
                </div>
                <div className="flex items-start space-x-2">
                  <div className="w-6 h-6 bg-green-500 rounded-full flex-shrink-0"></div>
                  <div>
                    <div className="font-semibold text-gray-800">게이머99</div>
                    <div className="text-gray-600">주사위 게임 고고!</div>
                  </div>
                </div>
              </div>
              
              <div className="flex space-x-2">
                <input 
                  type="text" 
                  placeholder="메시지를 입력하세요..." 
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
                <button className="bg-purple-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-purple-600 transition-colors">
                  전송
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* 하단 섹션 */}
        <footer className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 text-center mb-6">
              🚀 최신 업데이트
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-3xl mb-2">🎲</div>
                <div className="font-semibold">새로운 게임</div>
                <div className="text-sm text-gray-600">주사위 배틀</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-3xl mb-2">🏆</div>
                <div className="font-semibold">토너먼트</div>
                <div className="text-sm text-gray-600">주간 챔피언십</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-3xl mb-2">🎁</div>
                <div className="font-semibold">이벤트</div>
                <div className="text-sm text-gray-600">로그인 보너스</div>
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}