/**
 * Performance Monitor
 * 게임 및 앱 성능을 실시간으로 모니터링하고 분석합니다.
 */

interface PerformanceMetrics {
  fps: number
  frameTime: number
  memoryUsage: number
  networkLatency: number
  renderTime: number
  gameState: string
  timestamp: number
}

interface SystemInfo {
  userAgent: string
  platform: string
  screenResolution: string
  colorDepth: number
  hardwareConcurrency: number
  deviceMemory?: number
  connection?: any
}

interface ErrorEvent {
  type: 'javascript' | 'network' | 'game' | 'unity'
  message: string
  stack?: string
  url?: string
  line?: number
  column?: number
  timestamp: number
  gameState?: string
}

interface NetworkMetrics {
  latency: number
  bandwidth: number
  packetLoss: number
  connectionType: string
  effectiveType?: string
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics[] = []
  private systemInfo: SystemInfo
  private errors: ErrorEvent[] = []
  private isMonitoring = false
  private monitoringInterval: number | null = null
  private fpsCounter = new FPSCounter()
  private networkMonitor = new NetworkMonitor()
  private unityMonitor = new UnityPerformanceMonitor()

  constructor() {
    this.systemInfo = {
      userAgent: '',
      platform: '',
      screenResolution: '',
      colorDepth: 0,
      hardwareConcurrency: 0,
    };
  }

  /**
   * 모니터링 시작
   */
  start(interval: number = 1000) {
    if (this.isMonitoring) return

    this.systemInfo = this.collectSystemInfo();
    this.setupErrorHandling();
    this.isMonitoring = true
    this.fpsCounter.start()
    this.networkMonitor.start()

    this.monitoringInterval = window.setInterval(() => {
      this.collectMetrics()
    }, interval)

    console.log('[PerformanceMonitor] Monitoring started')
  }

  /**
   * 모니터링 중지
   */
  stop() {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    this.fpsCounter.stop()
    this.networkMonitor.stop()

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    console.log('[PerformanceMonitor] Monitoring stopped')
  }

  /**
   * 메트릭 수집
   */
  private collectMetrics() {
    const now = performance.now()

    const metrics: PerformanceMetrics = {
      fps: this.fpsCounter.getFPS(),
      frameTime: this.fpsCounter.getFrameTime(),
      memoryUsage: this.getMemoryUsage(),
      networkLatency: this.networkMonitor.getLatency(),
      renderTime: this.getRenderTime(),
      gameState: this.getCurrentGameState(),
      timestamp: now
    }

    this.metrics.push(metrics)

    // 최근 1000개 메트릭만 유지
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }

    // 성능 이슈 감지
    this.detectPerformanceIssues(metrics)
  }

  /**
   * 시스템 정보 수집
   */
  private collectSystemInfo(): SystemInfo {
    const nav = navigator as any

    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      screenResolution: `${screen.width}x${screen.height}`,
      colorDepth: screen.colorDepth,
      hardwareConcurrency: navigator.hardwareConcurrency,
      deviceMemory: nav.deviceMemory,
      connection: nav.connection || nav.mozConnection || nav.webkitConnection
    }
  }

  /**
   * 에러 핸들링 설정
   */
  private setupErrorHandling() {
    // JavaScript 에러
    window.addEventListener('error', (event) => {
      this.logError({
        type: 'javascript',
        message: event.message,
        stack: event.error?.stack,
        url: event.filename,
        line: event.lineno,
        column: event.colno,
        timestamp: Date.now()
      })
    })

    // Promise rejection 에러
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        type: 'javascript',
        message: event.reason?.message || 'Unhandled Promise Rejection',
        stack: event.reason?.stack,
        timestamp: Date.now()
      })
    })

    // 네트워크 에러 (fetch 감시)
    const originalFetch = window.fetch
    window.fetch = async (...args) => {
      const startTime = performance.now()
      try {
        const response = await originalFetch(...args)
        if (!response.ok) {
          this.logError({
            type: 'network',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0] as string,
            timestamp: Date.now()
          })
        }
        return response
      } catch (error) {
        this.logError({
          type: 'network',
          message: error instanceof Error ? error.message : 'Network error',
          url: args[0] as string,
          timestamp: Date.now()
        })
        throw error
      }
    }
  }

  /**
   * 에러 로깅
   */
  private logError(error: ErrorEvent) {
    error.gameState = this.getCurrentGameState()
    this.errors.push(error)

    // 최근 100개 에러만 유지
    if (this.errors.length > 100) {
      this.errors = this.errors.slice(-100)
    }

    console.error('[PerformanceMonitor] Error logged:', error)
  }

  /**
   * 메모리 사용량 측정
   */
  private getMemoryUsage(): number {
    const nav = navigator as any
    if (nav.memory) {
      return nav.memory.usedJSHeapSize / 1024 / 1024 // MB
    }
    return 0
  }

  /**
   * 렌더링 시간 측정
   */
  private getRenderTime(): number {
    const entries = performance.getEntriesByType('measure')
    const renderEntries = entries.filter(entry => entry.name.includes('render'))
    if (renderEntries.length > 0) {
      return renderEntries[renderEntries.length - 1].duration
    }
    return 0
  }

  /**
   * 현재 게임 상태 가져오기
   */
  private getCurrentGameState(): string {
    // 게임 상태는 외부에서 설정 가능
    return (window as any).__gameState || 'unknown'
  }

  /**
   * 성능 이슈 감지
   */
  private detectPerformanceIssues(metrics: PerformanceMetrics) {
    const issues: string[] = []

    // FPS 저하
    if (metrics.fps < 30) {
      issues.push('Low FPS detected')
    }

    // 높은 메모리 사용량
    if (metrics.memoryUsage > 500) { // 500MB
      issues.push('High memory usage detected')
    }

    // 높은 네트워크 지연
    if (metrics.networkLatency > 500) { // 500ms
      issues.push('High network latency detected')
    }

    // 긴 렌더링 시간
    if (metrics.renderTime > 50) { // 50ms
      issues.push('Long render time detected')
    }

    if (issues.length > 0) {
      console.warn('[PerformanceMonitor] Performance issues:', issues)
      this.notifyPerformanceIssues(issues, metrics)
    }
  }

  /**
   * 성능 이슈 알림
   */
  private notifyPerformanceIssues(issues: string[], metrics: PerformanceMetrics) {
    // 서버로 성능 이슈 전송 (선택적)
    if (process.env.NODE_ENV === 'production') {
      this.sendTelemetry({
        type: 'performance_issue',
        issues,
        metrics,
        systemInfo: this.systemInfo,
        timestamp: Date.now()
      })
    }
  }

  /**
   * 텔레메트리 데이터 전송
   */
  private async sendTelemetry(data: any) {
    try {
      await fetch('/api/telemetry', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
    } catch (error) {
      console.error('Failed to send telemetry:', error)
    }
  }

  // Public API

  /**
   * 현재 메트릭 가져오기
   */
  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  /**
   * 모든 메트릭 가져오기
   */
  getAllMetrics(): PerformanceMetrics[] {
    return [...this.metrics]
  }

  /**
   * 에러 로그 가져오기
   */
  getErrors(): ErrorEvent[] {
    return [...this.errors]
  }

  /**
   * 시스템 정보 가져오기
   */
  getSystemInfo(): SystemInfo {
    return { ...this.systemInfo }
  }

  /**
   * 통계 계산
   */
  getStatistics() {
    if (this.metrics.length === 0) return null

    const fps = this.metrics.map(m => m.fps)
    const frameTime = this.metrics.map(m => m.frameTime)
    const memory = this.metrics.map(m => m.memoryUsage)
    const latency = this.metrics.map(m => m.networkLatency)

    return {
      fps: {
        avg: fps.reduce((a, b) => a + b, 0) / fps.length,
        min: Math.min(...fps),
        max: Math.max(...fps)
      },
      frameTime: {
        avg: frameTime.reduce((a, b) => a + b, 0) / frameTime.length,
        min: Math.min(...frameTime),
        max: Math.max(...frameTime)
      },
      memory: {
        avg: memory.reduce((a, b) => a + b, 0) / memory.length,
        min: Math.min(...memory),
        max: Math.max(...memory)
      },
      latency: {
        avg: latency.reduce((a, b) => a + b, 0) / latency.length,
        min: Math.min(...latency),
        max: Math.max(...latency)
      }
    }
  }

  /**
   * 게임 상태 설정
   */
  setGameState(state: string) {
    (window as any).__gameState = state
  }

  /**
   * 사용자 정의 메트릭 추가
   */
  addCustomMetric(name: string, value: number) {
    const currentMetrics = this.getCurrentMetrics()
    if (currentMetrics) {
      (currentMetrics as any)[name] = value
    }
  }
}

/**
 * FPS 카운터
 */
class FPSCounter {
  private fps = 0
  private frameTime = 0
  private lastTime = 0
  private frames = 0
  private isRunning = false
  private animationId: number | null = null

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.lastTime = performance.now()
    this.frames = 0
    this.loop()
  }

  stop() {
    this.isRunning = false
    if (this.animationId) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private loop = () => {
    if (!this.isRunning) return

    const currentTime = performance.now()
    this.frames++

    if (currentTime >= this.lastTime + 1000) {
      this.fps = Math.round((this.frames * 1000) / (currentTime - this.lastTime))
      this.frameTime = (currentTime - this.lastTime) / this.frames
      this.frames = 0
      this.lastTime = currentTime
    }

    this.animationId = requestAnimationFrame(this.loop)
  }

  getFPS(): number {
    return this.fps
  }

  getFrameTime(): number {
    return this.frameTime
  }
}

/**
 * 네트워크 모니터
 */
class NetworkMonitor {
  private latency = 0
  private bandwidth = 0
  private isRunning = false
  private intervalId: number | null = null

  start() {
    if (this.isRunning) return

    this.isRunning = true
    this.measureLatency()

    this.intervalId = window.setInterval(() => {
      this.measureLatency()
    }, 5000) // 5초마다 측정
  }

  stop() {
    this.isRunning = false
    if (this.intervalId) {
      clearInterval(this.intervalId)
      this.intervalId = null
    }
  }

  private async measureLatency() {
    const startTime = performance.now()
    try {
      await fetch('/api/ping', { method: 'HEAD' })
      this.latency = performance.now() - startTime
    } catch (error) {
      this.latency = -1 // 연결 실패
    }
  }

  getLatency(): number {
    return this.latency
  }

  getBandwidth(): number {
    return this.bandwidth
  }
}

/**
 * Unity 성능 모니터
 */
class UnityPerformanceMonitor {
  private unityMetrics: any = {}

  constructor() {
    // Unity에서 성능 데이터를 받는 리스너 설정
    if (typeof window !== 'undefined') {
      (window as any).receiveUnityPerformanceData = (data: string) => {
        try {
          this.unityMetrics = JSON.parse(data)
        } catch (error) {
          console.error('Failed to parse Unity performance data:', error)
        }
      }
    }
  }

  getUnityMetrics() {
    return { ...this.unityMetrics }
  }

  requestUnityMetrics() {
    // Unity로 성능 데이터 요청
    if ((window as any).sendMessageToUnity) {
      (window as any).sendMessageToUnity('PerformanceManager', 'RequestMetrics', '')
    }
  }
}

// 싱글톤 인스턴스
export const performanceMonitor = new PerformanceMonitor()

// React Hook
export function usePerformanceMonitor() {
  const [metrics, setMetrics] = React.useState<PerformanceMetrics | null>(null)
  const [isMonitoring, setIsMonitoring] = React.useState(false)

  React.useEffect(() => {
    const updateMetrics = () => {
      setMetrics(performanceMonitor.getCurrentMetrics())
    }

    const interval = setInterval(updateMetrics, 1000)

    return () => {
      clearInterval(interval)
    }
  }, [])

  const startMonitoring = React.useCallback(() => {
    performanceMonitor.start()
    setIsMonitoring(true)
  }, [])

  const stopMonitoring = React.useCallback(() => {
    performanceMonitor.stop()
    setIsMonitoring(false)
  }, [])

  return {
    metrics,
    isMonitoring,
    startMonitoring,
    stopMonitoring,
    getStatistics: performanceMonitor.getStatistics.bind(performanceMonitor),
    getErrors: performanceMonitor.getErrors.bind(performanceMonitor),
    getSystemInfo: performanceMonitor.getSystemInfo.bind(performanceMonitor),
    setGameState: performanceMonitor.setGameState.bind(performanceMonitor),
    addCustomMetric: performanceMonitor.addCustomMetric.bind(performanceMonitor)
  }
}

// React import
import React from 'react'

export default performanceMonitor