'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'

export interface UnityInstance {
  SendMessage: (objectName: string, methodName: string, value?: any) => void
  Quit: () => Promise<void>
  SetFullscreen: (fullscreen: boolean) => void
}

export interface UnityWebGLContainerProps {
  unityBuildPath?: string
  width?: number | string
  height?: number | string
  className?: string
  onUnityLoaded?: (unityInstance: UnityInstance) => void
  onUnityProgress?: (progress: number) => void
  onUnityError?: (error: string) => void
}

declare global {
  interface Window {
    createUnityInstance: (canvas: HTMLCanvasElement, config: any, onProgress?: (progress: number) => void) => Promise<UnityInstance>
    unityInstances: Map<string, UnityInstance>
    PittuRuUnityBridge: {
      sendToFlutter: (message: any) => void
      receiveFromFlutter: (message: any) => void
    }
  }
}

export function UnityWebGLContainer({
  unityBuildPath = '/unity-builds/pitturu-game',
  width = '100%',
  height = '600px',
  className = '',
  onUnityLoaded,
  onUnityProgress,
  onUnityError
}: UnityWebGLContainerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [unityInstance, setUnityInstance] = useState<UnityInstance | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isUnityAvailable, setIsUnityAvailable] = useState(false)

  // Unity 빌드 파일 존재 확인
  useEffect(() => {
    const checkUnityBuild = async () => {
      try {
        const response = await fetch(`${unityBuildPath}/Build/pitturu-game.loader.js`)
        setIsUnityAvailable(response.ok)

        if (!response.ok) {
          setError('Unity 빌드 파일을 찾을 수 없습니다. 개발용 모의 Unity 인스턴스를 사용합니다.')
          createMockUnityInstance()
        }
      } catch (err) {
        setIsUnityAvailable(false)
        setError('Unity 빌드를 확인할 수 없습니다. 개발용 모의 Unity 인스턴스를 사용합니다.')
        createMockUnityInstance()
      }
    }

    checkUnityBuild()
  }, [unityBuildPath])

  // Unity 로드
  useEffect(() => {
    if (!isUnityAvailable || !canvasRef.current) return

    const loadUnity = async () => {
      try {
        // Unity 로더 스크립트 동적 로드
        if (!window.createUnityInstance) {
          await loadUnityScript(`${unityBuildPath}/Build/pitturu-game.loader.js`)
        }

        const config = {
          dataUrl: `${unityBuildPath}/Build/pitturu-game.data`,
          frameworkUrl: `${unityBuildPath}/Build/pitturu-game.framework.js`,
          codeUrl: `${unityBuildPath}/Build/pitturu-game.wasm`,
          streamingAssetsUrl: 'StreamingAssets',
          companyName: 'PittuRu',
          productName: 'PittuRu Paint Battle',
          productVersion: '1.0.0',
        }

        const progress = (progression: number) => {
          const percent = Math.round(progression * 100)
          setLoadingProgress(percent)
          onUnityProgress?.(percent)
        }

        const instance = await window.createUnityInstance(canvasRef.current, config, progress)

        setUnityInstance(instance)
        setIsLoading(false)
        onUnityLoaded?.(instance)

        // 글로벌 Unity 인스턴스 저장
        if (!window.unityInstances) {
          window.unityInstances = new Map()
        }
        window.unityInstances.set('main', instance)

        console.log('✅ Unity WebGL 로드 완료')

      } catch (err: any) {
        const errorMsg = `Unity 로드 실패: ${err.message}`
        setError(errorMsg)
        onUnityError?.(errorMsg)
        createMockUnityInstance()
      }
    }

    loadUnity()
  }, [isUnityAvailable, unityBuildPath, onUnityLoaded, onUnityProgress, onUnityError])

  // Unity 브리지 설정
  useEffect(() => {
    if (!window.PittuRuUnityBridge) {
      window.PittuRuUnityBridge = {
        sendToFlutter: (message: any) => {
          console.log('Unity → Flutter:', message)
          // Flutter와의 메시지 전달 구현
          window.parent.postMessage({
            type: 'unity-to-flutter',
            data: message,
            timestamp: Date.now()
          }, '*')
        },
        receiveFromFlutter: (message: any) => {
          console.log('Flutter → Unity:', message)
          // Unity에 메시지 전달
          if (unityInstance) {
            unityInstance.SendMessage('GameManager', 'ReceiveFromFlutter', JSON.stringify(message))
          }
        }
      }
    }

    // Flutter에서 온 메시지 수신
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'flutter-to-unity') {
        window.PittuRuUnityBridge.receiveFromFlutter(event.data.data)
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [unityInstance])

  // 개발용 모의 Unity 인스턴스 생성
  const createMockUnityInstance = () => {
    console.log('🎮 Creating mock Unity instance for development')

    const mockInstance: UnityInstance = {
      SendMessage: (objectName: string, methodName: string, value?: any) => {
        console.log(`🎮 Unity Mock: ${objectName}.${methodName}(${value})`)
      },
      Quit: async () => {
        console.log('🎮 Unity Mock: Quit()')
      },
      SetFullscreen: (fullscreen: boolean) => {
        console.log(`🎮 Unity Mock: SetFullscreen(${fullscreen})`)
      }
    }

    setUnityInstance(mockInstance)
    setIsLoading(false)
    onUnityLoaded?.(mockInstance)

    // 모의 게임 화면 렌더링
    if (canvasRef.current) {
      const canvas = canvasRef.current
      const ctx = canvas.getContext('2d')
      if (ctx) {
        renderMockGame(ctx, canvas.width, canvas.height)
      }
    }
  }

  // Unity 스크립트 동적 로드
  const loadUnityScript = (src: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = src
      script.onload = () => resolve()
      script.onerror = () => reject(new Error(`Failed to load ${src}`))
      document.head.appendChild(script)
    })
  }

  // 개발용 모의 게임 렌더링
  const renderMockGame = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    // 배경
    ctx.fillStyle = '#1a1a2e'
    ctx.fillRect(0, 0, width, height)

    // 제목
    ctx.fillStyle = '#00ff88'
    ctx.font = '24px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('PittuRu Unity WebGL', width / 2, 50)

    // 상태 표시
    ctx.fillStyle = '#ffffff'
    ctx.font = '16px Arial'
    ctx.fillText('🎮 Unity 게임이 여기에 로드됩니다', width / 2, 100)
    ctx.fillText('Unity 빌드 파일이 준비되면 실제 게임이 표시됩니다', width / 2, 130)

    // 간단한 애니메이션 (펄스 효과)
    let pulse = 0
    const animate = () => {
      pulse += 0.1
      const alpha = (Math.sin(pulse) + 1) / 2

      ctx.fillStyle = '#16213e'
      ctx.fillRect(0, 0, width, height)

      ctx.fillStyle = '#00ff88'
      ctx.font = '24px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('PittuRu Unity WebGL', width / 2, 50)

      ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`
      ctx.font = '16px Arial'
      ctx.fillText('🎮 개발용 모의 Unity 인스턴스', width / 2, 100)

      // 중앙에 회전하는 정사각형
      ctx.save()
      ctx.translate(width / 2, height / 2)
      ctx.rotate(pulse)
      ctx.fillStyle = '#00ff88'
      ctx.fillRect(-25, -25, 50, 50)
      ctx.restore()

      requestAnimationFrame(animate)
    }
    animate()
  }

  if (error && !unityInstance) {
    return (
      <div className={`unity-container bg-gray-900 rounded-lg p-6 ${className}`} style={{ width, height }}>
        <div className="text-center text-white">
          <div className="text-red-400 mb-4">⚠️ Unity 로드 오류</div>
          <div className="text-sm text-gray-300">{error}</div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
          >
            다시 시도
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className={`unity-container ${className}`} ref={containerRef} style={{ width, height }}>
      {isLoading && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 bg-gray-900 flex items-center justify-center z-10"
        >
          <div className="text-center text-white">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-lg mb-2">Unity 게임 로딩 중...</div>
            <div className="text-sm text-gray-300">{loadingProgress}%</div>
            <div className="w-64 h-2 bg-gray-700 rounded-full mt-2 mx-auto">
              <div
                className="h-full bg-blue-500 rounded-full transition-all duration-300"
                style={{ width: `${loadingProgress}%` }}
              />
            </div>
          </div>
        </motion.div>
      )}

      <canvas
        ref={canvasRef}
        width={typeof width === 'number' ? width : 800}
        height={typeof height === 'number' ? height : 600}
        className="w-full h-full bg-gray-800 rounded"
        style={{ display: 'block' }}
      />

      {error && (
        <div className="absolute bottom-4 left-4 bg-yellow-600 text-white text-xs p-2 rounded">
          {error}
        </div>
      )}
    </div>
  )
}