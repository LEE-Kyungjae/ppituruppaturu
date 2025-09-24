import dynamic from 'next/dynamic';

// GameCanvas를 dynamic import로 로드 (SSR 방지)
const GameCanvas = dynamic(() => import('../../components/Game/GameCanvas'), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center h-screen bg-gray-900">
      <div className="text-center text-white">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500 mx-auto mb-4"></div>
        <p className="text-lg">게임 로딩 중...</p>
      </div>
    </div>
  )
});

export default function PaintGamePage() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* 헤더 */}
      <header className="bg-black bg-opacity-50 text-white p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">삐뚜루빠뚜루 페인트 게임</h1>
            <p className="text-sm text-gray-300">스플래툰 스타일 물감 영역 확장 게임</p>
          </div>
          <div className="flex gap-4">
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors">
              게임 재시작
            </button>
          </div>
        </div>
      </header>

      {/* 게임 영역 */}
      <main className="relative">
        <div className="w-full h-screen">
          <GameCanvas
            width={1200}
            height={800}
            className="w-full h-full"
          />
        </div>

        {/* 게임 정보 패널 */}
        <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white p-4 rounded-lg max-w-xs">
          <h3 className="font-bold mb-2">게임 정보</h3>
          <div className="text-sm space-y-1">
            <p>• 이동: WASD 또는 화살표 키</p>
            <p>• 시점 회전: 마우스 이동</p>
            <p>• 페인트 발사: 마우스 클릭 또는 스페이스바</p>
            <p>• 재장전: R 키</p>
            <p>• 게임 시작: 화면 클릭</p>
          </div>

          <div className="mt-4 pt-2 border-t border-gray-600">
            <p className="text-xs text-gray-400">
              목표: 최대한 많은 영역을 자신의 색으로 칠하세요!
            </p>
          </div>
        </div>

        {/* 성능 정보 */}
        <div className="absolute top-4 right-4 bg-black bg-opacity-50 text-white p-2 rounded text-xs">
          <div>Engine: Three.js WebGL</div>
          <div>Status: Beta v0.1</div>
        </div>
      </main>

      {/* 푸터 */}
      <footer className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-2 text-center text-xs">
        <p>삐뚜루빠뚜루 © 2024 - 스플래툰 스타일의 페인트 영역 확장 게임</p>
      </footer>
    </div>
  );
}
