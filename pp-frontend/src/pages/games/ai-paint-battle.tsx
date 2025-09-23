import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import CollaborativePaintCanvas from '../../components/Game/CollaborativePaintCanvas';
import PerformanceMonitor from '../../monitoring/PerformanceMonitor';

export default function AIPaintBattle() {
  const router = useRouter();
  const [gameState, setGameState] = useState<'waiting' | 'playing' | 'finished'>('waiting');
  const [players, setPlayers] = useState<Array<{ id: string; name: string; score: number }>>([]);
  const [currentPlayer] = useState({ id: 'player1', name: 'Player 1' });

  useEffect(() => {
    // Initialize game
    setGameState('playing');
    setPlayers([
      { id: 'player1', name: 'Player 1', score: 0 },
      { id: 'ai', name: 'AI Painter', score: 0 }
    ]);
  }, []);

  const handleTerritoryUpdate = (stats: any[]) => {
    // Update player scores based on territory control
    console.log('Territory stats:', stats);
  };

  const handleGameEnd = () => {
    setGameState('finished');
  };

  return (
    <>
      <Head>
        <title>AI Paint Battle - PittuRu PpattuRu</title>
        <meta name="description" content="AI와 함께하는 실시간 페인팅 배틀" />
      </Head>
      <div className="ai-paint-battle min-h-screen bg-gray-900 text-white p-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-3xl font-bold text-cyber-blue">AI Paint Battle</h1>
            <div className="flex items-center gap-4">
              <PerformanceMonitor />
              <button
                onClick={() => router.push('/games')}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded transition-colors"
              >
                게임 목록
              </button>
            </div>
          </div>

          {/* Game Status */}
          <div className="mb-4 p-4 bg-gray-800 rounded-lg border border-gray-600">
            <div className="flex items-center justify-between">
              <div className="text-lg">
                상태: <span className="text-cyber-green">{gameState}</span>
              </div>
              <div className="flex gap-4">
                {players.map(player => (
                  <div key={player.id} className="text-center">
                    <div className="text-sm text-gray-400">{player.name}</div>
                    <div className="text-xl font-bold">{player.score}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Main Game Canvas */}
          <CollaborativePaintCanvas
            width={800}
            height={600}
            onTerritoryUpdate={handleTerritoryUpdate}
            className="mb-6"
          />

          {/* Game Controls */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-3">게임 정보</h3>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• AI와 실시간 페인팅 대결</li>
                <li>• 더 많은 영역을 칠하세요</li>
                <li>• 시간 제한: 3분</li>
                <li>• 네온 브러시 효과 사용 가능</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-3">조작법</h3>
              <ul className="text-sm space-y-2 text-gray-300">
                <li>• 마우스 드래그로 그리기</li>
                <li>• 브러시 타입 변경</li>
                <li>• 글리치 모드 토글</li>
                <li>• 네온 강도 조절</li>
              </ul>
            </div>

            <div className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h3 className="text-lg font-semibold mb-3">게임 옵션</h3>
              <div className="space-y-3">
                <button
                  onClick={handleGameEnd}
                  className="w-full px-4 py-2 bg-red-600 hover:bg-red-700 rounded transition-colors"
                >
                  게임 종료
                </button>
                <button
                  onClick={() => window.location.reload()}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                >
                  새 게임
                </button>
              </div>
            </div>
          </div>

          {/* Game Finished Modal */}
          {gameState === 'finished' && (
            <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50">
              <div className="bg-gray-800 p-8 rounded-lg border border-gray-600 text-center">
                <h2 className="text-2xl font-bold mb-4">게임 종료!</h2>
                <div className="mb-6">
                  {players.map(player => (
                    <div key={player.id} className="mb-2">
                      <span className="text-lg">{player.name}: </span>
                      <span className="text-xl font-bold text-cyber-blue">{player.score}점</span>
                    </div>
                  ))}
                </div>
                <div className="space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded transition-colors"
                  >
                    다시 플레이
                  </button>
                  <button
                    onClick={() => router.push('/games')}
                    className="px-6 py-2 bg-gray-600 hover:bg-gray-700 rounded transition-colors"
                  >
                    게임 목록
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <style jsx>{`
          .text-cyber-blue {
            color: #4080ff;
          }
          .text-cyber-green {
            color: #00ff80;
          }
        `}</style>
      </div>
    </>
  );
}