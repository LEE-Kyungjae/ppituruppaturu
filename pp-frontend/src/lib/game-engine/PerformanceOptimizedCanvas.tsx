'use client'

import { useEffect, useRef, useState, useCallback, useMemo } from 'react'

interface GameCanvasProps {
  gameType: string
  onGameEnd?: (score: number) => void
  onError?: (error: Error) => void
  className?: string
  targetFPS?: number
  enablePerformanceMonitoring?: boolean
}

interface GameObject {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  width: number
  height: number
  color: string
  type: string
  active: boolean
  mass?: number
  restitution?: number
}

interface PerformanceMetrics {
  fps: number
  frameTime: number
  objectCount: number
  drawCalls: number
  memoryUsage: number
}

// Object Pool for efficient memory management
class GameObjectPool {
  private pool: GameObject[] = []
  private activeObjects: Set<GameObject> = new Set()

  constructor(initialSize = 100) {
    for (let i = 0; i < initialSize; i++) {
      this.pool.push(this.createObject())
    }
  }

  private createObject(): GameObject {
    return {
      id: '',
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      width: 10,
      height: 10,
      color: '#ffffff',
      type: 'default',
      active: false,
      mass: 1,
      restitution: 0.8
    }
  }

  acquire(): GameObject {
    let obj = this.pool.pop()
    if (!obj) {
      obj = this.createObject()
    }

    // Reset object state
    obj.active = true
    obj.id = Math.random().toString(36).substr(2, 9)
    this.activeObjects.add(obj)
    return obj
  }

  release(obj: GameObject): void {
    if (this.activeObjects.has(obj)) {
      obj.active = false
      this.activeObjects.delete(obj)
      this.pool.push(obj)
    }
  }

  getActiveObjects(): GameObject[] {
    return Array.from(this.activeObjects)
  }

  cleanup(): void {
    this.activeObjects.clear()
    this.pool = []
  }
}

// High-performance rendering engine
class RenderEngine {
  private ctx: CanvasRenderingContext2D
  private offscreenCanvas: OffscreenCanvas | HTMLCanvasElement
  private offscreenCtx: CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D
  private imageDataCache: Map<string, ImageData> = new Map()
  private transformMatrix: DOMMatrix = new DOMMatrix()

  constructor(canvas: HTMLCanvasElement) {
    this.ctx = canvas.getContext('2d')!

    // Create offscreen canvas for double buffering
    if (typeof OffscreenCanvas !== 'undefined') {
      this.offscreenCanvas = new OffscreenCanvas(canvas.width, canvas.height)
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    } else {
      this.offscreenCanvas = document.createElement('canvas')
      this.offscreenCanvas.width = canvas.width
      this.offscreenCanvas.height = canvas.height
      this.offscreenCtx = this.offscreenCanvas.getContext('2d')!
    }
  }

  clear(): void {
    this.offscreenCtx.clearRect(0, 0, this.offscreenCanvas.width, this.offscreenCanvas.height)
  }

  drawObject(obj: GameObject): void {
    if (!obj.active) return

    this.offscreenCtx.fillStyle = obj.color
    this.offscreenCtx.fillRect(obj.x, obj.y, obj.width, obj.height)
  }

  drawObjects(objects: GameObject[]): void {
    this.clear()

    // Batch draw operations
    this.offscreenCtx.save()

    for (const obj of objects) {
      if (obj.active) {
        this.drawObject(obj)
      }
    }

    this.offscreenCtx.restore()

    // Copy to main canvas
    this.ctx.clearRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height)
    this.ctx.drawImage(this.offscreenCanvas as any, 0, 0)
  }

  updateCanvasSize(width: number, height: number): void {
    this.offscreenCanvas.width = width
    this.offscreenCanvas.height = height
  }

  dispose(): void {
    this.imageDataCache.clear()
  }
}

// Physics engine with spatial partitioning
class PhysicsEngine {
  private gravity = 0.5
  private friction = 0.99
  private spatialGrid: Map<string, GameObject[]> = new Map()
  private gridSize = 50

  private getGridKey(x: number, y: number): string {
    const gridX = Math.floor(x / this.gridSize)
    const gridY = Math.floor(y / this.gridSize)
    return `${gridX},${gridY}`
  }

  private updateSpatialGrid(objects: GameObject[]): void {
    this.spatialGrid.clear()

    for (const obj of objects) {
      if (!obj.active) continue

      const key = this.getGridKey(obj.x, obj.y)
      if (!this.spatialGrid.has(key)) {
        this.spatialGrid.set(key, [])
      }
      this.spatialGrid.get(key)!.push(obj)
    }
  }

  update(objects: GameObject[], deltaTime: number, canvasWidth: number, canvasHeight: number): void {
    this.updateSpatialGrid(objects)

    for (const obj of objects) {
      if (!obj.active) continue

      // Apply gravity
      obj.vy += this.gravity * deltaTime

      // Apply friction
      obj.vx *= this.friction
      obj.vy *= this.friction

      // Update position
      obj.x += obj.vx * deltaTime
      obj.y += obj.vy * deltaTime

      // Boundary collision
      if (obj.x < 0) {
        obj.x = 0
        obj.vx *= -(obj.restitution || 0.8)
      } else if (obj.x + obj.width > canvasWidth) {
        obj.x = canvasWidth - obj.width
        obj.vx *= -(obj.restitution || 0.8)
      }

      if (obj.y < 0) {
        obj.y = 0
        obj.vy *= -(obj.restitution || 0.8)
      } else if (obj.y + obj.height > canvasHeight) {
        obj.y = canvasHeight - obj.height
        obj.vy *= -(obj.restitution || 0.8)
      }
    }

    // Handle collisions using spatial grid
    this.handleCollisions()
  }

  private handleCollisions(): void {
    this.spatialGrid.forEach((objects) => {
      for (let i = 0; i < objects.length; i++) {
        for (let j = i + 1; j < objects.length; j++) {
          this.checkCollision(objects[i], objects[j])
        }
      }
    })
  }

  private checkCollision(obj1: GameObject, obj2: GameObject): void {
    if (!obj1.active || !obj2.active) return

    if (obj1.x < obj2.x + obj2.width &&
        obj1.x + obj1.width > obj2.x &&
        obj1.y < obj2.y + obj2.height &&
        obj1.y + obj1.height > obj2.y) {

      // Simple elastic collision
      const tempVx = obj1.vx
      const tempVy = obj1.vy

      obj1.vx = obj2.vx * (obj1.restitution || 0.8)
      obj1.vy = obj2.vy * (obj1.restitution || 0.8)
      obj2.vx = tempVx * (obj2.restitution || 0.8)
      obj2.vy = tempVy * (obj2.restitution || 0.8)
    }
  }
}

// Performance monitor
class PerformanceMonitor {
  private frameTimes: number[] = []
  private lastFrameTime = 0
  private frameCount = 0

  update(): PerformanceMetrics {
    const now = performance.now()
    const frameTime = now - this.lastFrameTime
    this.lastFrameTime = now

    this.frameTimes.push(frameTime)
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift()
    }

    this.frameCount++

    const avgFrameTime = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length
    const fps = 1000 / avgFrameTime

    return {
      fps: Math.round(fps),
      frameTime: Math.round(avgFrameTime * 100) / 100,
      objectCount: 0, // Will be updated by caller
      drawCalls: this.frameCount,
      memoryUsage: (performance as any).memory?.usedJSHeapSize || 0
    }
  }

  reset(): void {
    this.frameTimes = []
    this.frameCount = 0
  }
}

export function PerformanceOptimizedCanvas({
  gameType,
  onGameEnd,
  onError,
  className = '',
  targetFPS = 60,
  enablePerformanceMonitoring = false
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'loading' | 'ready' | 'playing' | 'ended'>('loading')
  const [score, setScore] = useState(0)
  const [performance, setPerformance] = useState<PerformanceMetrics | null>(null)

  // Game engine instances
  const objectPool = useMemo(() => new GameObjectPool(200), [])
  const renderEngine = useRef<RenderEngine | null>(null)
  const physicsEngine = useMemo(() => new PhysicsEngine(), [])
  const performanceMonitor = useMemo(() => new PerformanceMonitor(), [])

  // Game loop timing
  const lastTimeRef = useRef(0)
  const animationRef = useRef<number>()
  const targetFrameTime = 1000 / targetFPS

  // Initialize game objects based on game type
  const initializeGameObjects = useCallback(() => {
    // Clear existing objects
    objectPool.getActiveObjects().forEach(obj => objectPool.release(obj))

    switch (gameType) {
      case 'physics_jump':
        for (let i = 0; i < 10; i++) {
          const obj = objectPool.acquire()
          obj.x = Math.random() * 400
          obj.y = Math.random() * 200
          obj.vx = (Math.random() - 0.5) * 10
          obj.vy = (Math.random() - 0.5) * 10
          obj.color = `hsl(${Math.random() * 360}, 70%, 50%)`
          obj.width = 20 + Math.random() * 30
          obj.height = 20 + Math.random() * 30
        }
        break

      case 'physics_battle_royale':
        for (let i = 0; i < 50; i++) {
          const obj = objectPool.acquire()
          obj.x = Math.random() * 600
          obj.y = Math.random() * 400
          obj.vx = (Math.random() - 0.5) * 15
          obj.vy = (Math.random() - 0.5) * 15
          obj.color = `hsl(${Math.random() * 360}, 80%, 60%)`
          obj.width = 15 + Math.random() * 20
          obj.height = 15 + Math.random() * 20
          obj.mass = 0.5 + Math.random() * 2
        }
        break

      default:
        for (let i = 0; i < 20; i++) {
          const obj = objectPool.acquire()
          obj.x = Math.random() * 500
          obj.y = Math.random() * 300
          obj.vx = (Math.random() - 0.5) * 8
          obj.vy = (Math.random() - 0.5) * 8
          obj.color = `hsl(${i * 18}, 70%, 50%)`
        }
    }
  }, [gameType, objectPool])

  // Optimized game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (!renderEngine.current || !canvasRef.current) return

    const deltaTime = Math.min(currentTime - lastTimeRef.current, targetFrameTime)
    lastTimeRef.current = currentTime

    // Update physics
    const activeObjects = objectPool.getActiveObjects()
    physicsEngine.update(
      activeObjects,
      deltaTime / 16.67, // Normalize to 60fps baseline
      canvasRef.current.width,
      canvasRef.current.height
    )

    // Render
    renderEngine.current.drawObjects(activeObjects)

    // Update performance metrics
    if (enablePerformanceMonitoring) {
      const metrics = performanceMonitor.update()
      metrics.objectCount = activeObjects.length
      setPerformance(metrics)
    }

    // Update score (simple time-based scoring)
    setScore(prev => prev + Math.floor(deltaTime / 100))

    animationRef.current = requestAnimationFrame(gameLoop)
  }, [objectPool, physicsEngine, performanceMonitor, targetFrameTime, enablePerformanceMonitoring])

  // Start game
  const startGame = useCallback(() => {
    setGameState('playing')
    setScore(0)
    performanceMonitor.reset()
    initializeGameObjects()
    lastTimeRef.current = performance.now()
    animationRef.current = requestAnimationFrame(gameLoop)
  }, [gameLoop, performanceMonitor, initializeGameObjects])

  // Handle mouse/touch interactions
  const handleCanvasClick = useCallback((event: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameState !== 'playing') return

    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // Add explosion effect
    for (let i = 0; i < 5; i++) {
      const obj = objectPool.acquire()
      obj.x = x - 10
      obj.y = y - 10
      obj.vx = (Math.random() - 0.5) * 20
      obj.vy = (Math.random() - 0.5) * 20 - 5
      obj.color = '#ff6b6b'
      obj.width = 8
      obj.height = 8
    }
  }, [gameState, objectPool])

  // Initialize canvas and render engine
  useEffect(() => {
    if (!canvasRef.current) return

    const canvas = canvasRef.current

    // Set canvas size
    const updateCanvasSize = () => {
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * window.devicePixelRatio
      canvas.height = rect.height * window.devicePixelRatio
      canvas.style.width = rect.width + 'px'
      canvas.style.height = rect.height + 'px'

      const ctx = canvas.getContext('2d')!
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)

      if (renderEngine.current) {
        renderEngine.current.updateCanvasSize(canvas.width, canvas.height)
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)

    // Initialize render engine
    renderEngine.current = new RenderEngine(canvas)
    setGameState('ready')

    return () => {
      window.removeEventListener('resize', updateCanvasSize)
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
      if (renderEngine.current) {
        renderEngine.current.dispose()
      }
      objectPool.cleanup()
    }
  }, [objectPool])

  return (
    <div className={`relative ${className}`}>
      <canvas
        ref={canvasRef}
        onClick={handleCanvasClick}
        className="w-full h-full bg-black cursor-crosshair"
        style={{ imageRendering: 'pixelated' }}
      />

      {gameState === 'ready' && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <button
            onClick={startGame}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg text-xl font-bold hover:bg-blue-600 transition-colors"
          >
            Start Game
          </button>
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute top-4 left-4 text-white">
          <div className="text-2xl font-bold">Score: {score}</div>
          {enablePerformanceMonitoring && performance && (
            <div className="text-sm mt-2 bg-black bg-opacity-50 p-2 rounded">
              <div>FPS: {performance.fps}</div>
              <div>Objects: {performance.objectCount}</div>
              <div>Frame Time: {performance.frameTime}ms</div>
            </div>
          )}
        </div>
      )}

      {gameState === 'playing' && (
        <div className="absolute bottom-4 left-4 text-white text-sm">
          <div>Click to create explosion effects!</div>
          <div>Game Type: {gameType}</div>
        </div>
      )}
    </div>
  )
}