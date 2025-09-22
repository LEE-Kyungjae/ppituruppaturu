import React, { useEffect, useRef, useState } from 'react'
import Script from 'next/script'

interface UnityWebGLConfig {
  dataUrl: string
  frameworkUrl: string
  codeUrl: string
  streamingAssetsUrl?: string
  companyName?: string
  productName?: string
  productVersion?: string
}

interface UnityWebGLProps {
  config: UnityWebGLConfig
  width?: number
  height?: number
  onLoaded?: () => void
  onError?: (error: string) => void
  onMessage?: (message: any) => void
  className?: string
}

declare global {
  interface Window {
    createUnityInstance: (canvas: HTMLCanvasElement, config: any) => Promise<any>
    unityInstance?: any
    sendMessageToUnity?: (objectName: string, methodName: string, parameter?: any) => void
    receiveMessageFromUnity?: (message: string) => void
  }
}

export default function UnityWebGLWrapper({
  config,
  width = 800,
  height = 600,
  onLoaded,
  onError,
  onMessage,
  className = ''
}: UnityWebGLProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (!canvasRef.current) return

    const loadUnity = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Unity WebGL 설정
        const unityConfig = {
          dataUrl: config.dataUrl,
          frameworkUrl: config.frameworkUrl,
          codeUrl: config.codeUrl,
          streamingAssetsUrl: config.streamingAssetsUrl,
          companyName: config.companyName || 'PittuRu',
          productName: config.productName || 'PittuRu Game',
          productVersion: config.productVersion || '1.0',
          showBanner: false,
          matchWebGLToCanvasSize: true,
          devicePixelRatio: 1,
        }

        // 진행률 콜백
        const progressCallback = (progress: number) => {
          setProgress(progress)
        }

        // Unity 인스턴스 생성
        if (window.createUnityInstance) {
          const unityInstance = await window.createUnityInstance(
            canvasRef.current,
            unityConfig,
            progressCallback
          )

          window.unityInstance = unityInstance

          // Unity에서 메시지 받기 설정
          window.receiveMessageFromUnity = (message: string) => {
            try {
              const parsedMessage = JSON.parse(message)
              onMessage?.(parsedMessage)
            } catch (e) {
              console.warn('Failed to parse Unity message:', message)
              onMessage?.(message)
            }
          }

          // Unity로 메시지 보내기 함수 설정
          window.sendMessageToUnity = (objectName: string, methodName: string, parameter?: any) => {
            if (unityInstance) {
              const paramStr = parameter !== undefined ? JSON.stringify(parameter) : ''
              unityInstance.SendMessage(objectName, methodName, paramStr)
            }
          }

          setIsLoading(false)
          onLoaded?.()
        } else {
          throw new Error('Unity WebGL loader not found')
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load Unity WebGL'
        setError(errorMessage)
        setIsLoading(false)
        onError?.(errorMessage)
      }
    }

    loadUnity()

    return () => {
      // 정리
      if (window.unityInstance) {
        window.unityInstance.Quit()
        window.unityInstance = undefined
      }
    }
  }, [config, onLoaded, onError, onMessage])

  return (
    <div className={`unity-webgl-wrapper ${className}`}>
      {/* Unity WebGL 로더 스크립트 */}
      <Script
        src="/unity/Build/UnityLoader.js"
        onLoad={() => console.log('Unity loader script loaded')}
        onError={() => setError('Failed to load Unity loader script')}
      />

      {/* 로딩 상태 */}
      {isLoading && (
        <div className="unity-loading-overlay">
          <div className="loading-container">
            <div className="cyber-loader">
              <div className="cyber-loader-inner"></div>
            </div>
            <div className="loading-text">
              LOADING UNITY CORE... {Math.round(progress * 100)}%
            </div>
            <div className="loading-bar">
              <div
                className="loading-progress"
                style={{ width: `${progress * 100}%` }}
              ></div>
            </div>
          </div>
        </div>
      )}

      {/* 에러 상태 */}
      {error && (
        <div className="unity-error-overlay">
          <div className="error-container">
            <div className="error-icon">⚠️</div>
            <div className="error-text">UNITY CORE ERROR</div>
            <div className="error-message">{error}</div>
            <button
              onClick={() => window.location.reload()}
              className="retry-button"
            >
              RETRY
            </button>
          </div>
        </div>
      )}

      {/* Unity 캔버스 */}
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        style={{
          width: '100%',
          height: '100%',
          display: isLoading || error ? 'none' : 'block'
        }}
      />

      <style jsx>{`
        .unity-webgl-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          background: #000;
          border: 2px solid #00ffff;
          box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
        }

        .unity-loading-overlay,
        .unity-error-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.9);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
        }

        .loading-container,
        .error-container {
          text-align: center;
          color: #00ffff;
          font-family: 'Courier New', monospace;
        }

        .cyber-loader {
          width: 60px;
          height: 60px;
          border: 3px solid #333;
          border-top: 3px solid #00ffff;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        }

        .cyber-loader-inner {
          width: 100%;
          height: 100%;
          border: 2px solid transparent;
          border-bottom: 2px solid #ff0080;
          border-radius: 50%;
          animation: spin 0.8s linear infinite reverse;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .loading-text {
          font-size: 16px;
          font-weight: bold;
          margin-bottom: 15px;
          text-shadow: 0 0 10px #00ffff;
        }

        .loading-bar {
          width: 200px;
          height: 4px;
          background: #333;
          border: 1px solid #00ffff;
          margin: 0 auto;
          overflow: hidden;
        }

        .loading-progress {
          height: 100%;
          background: linear-gradient(90deg, #00ffff, #ff0080);
          transition: width 0.3s ease;
          box-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
        }

        .error-container {
          max-width: 400px;
          padding: 20px;
        }

        .error-icon {
          font-size: 48px;
          margin-bottom: 15px;
        }

        .error-text {
          font-size: 18px;
          font-weight: bold;
          color: #ff0080;
          margin-bottom: 10px;
        }

        .error-message {
          font-size: 14px;
          margin-bottom: 20px;
          opacity: 0.8;
        }

        .retry-button {
          background: linear-gradient(45deg, #ff0080, #00ffff);
          border: none;
          color: #000;
          padding: 10px 20px;
          font-family: 'Courier New', monospace;
          font-weight: bold;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .retry-button:hover {
          transform: scale(1.05);
          box-shadow: 0 0 15px rgba(255, 0, 128, 0.5);
        }
      `}</style>
    </div>
  )
}

// Unity 메시지 유틸리티 함수들
export const UnityMessaging = {
  // Unity로 메시지 전송
  sendToUnity: (objectName: string, methodName: string, data?: any) => {
    if (window.sendMessageToUnity) {
      window.sendMessageToUnity(objectName, methodName, data)
    } else {
      console.warn('Unity instance not ready')
    }
  },

  // 게임 시작 메시지
  startGame: (playerName: string, gameConfig?: any) => {
    UnityMessaging.sendToUnity('GameManager', 'StartGame', {
      playerName,
      config: gameConfig
    })
  },

  // 게임 일시정지
  pauseGame: () => {
    UnityMessaging.sendToUnity('GameManager', 'PauseGame')
  },

  // 게임 재개
  resumeGame: () => {
    UnityMessaging.sendToUnity('GameManager', 'ResumeGame')
  },

  // 게임 종료
  endGame: () => {
    UnityMessaging.sendToUnity('GameManager', 'EndGame')
  },

  // 플레이어 입력 전송
  sendPlayerInput: (input: any) => {
    UnityMessaging.sendToUnity('PlayerController', 'ReceiveInput', input)
  },

  // 게임 설정 업데이트
  updateGameSettings: (settings: any) => {
    UnityMessaging.sendToUnity('GameManager', 'UpdateSettings', settings)
  }
}