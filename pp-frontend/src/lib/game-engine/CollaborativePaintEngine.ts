/**
 * Collaborative Paint Engine
 * 실시간 협업 페인팅 시스템 - 멀티플레이어 페인트 배틀의 핵심
 */

import { getMultiplayerManager, Player } from '../multiplayer/MultiplayerManager'
import { performanceMonitor } from '../monitoring/PerformanceMonitor'

export interface PaintStroke {
  id: string
  playerId: string
  points: Point[]
  color: string
  brushSize: number
  brushType: BrushType
  opacity: number
  timestamp: number
  completed: boolean
}

export interface Point {
  x: number
  y: number
  pressure?: number
  tiltX?: number
  tiltY?: number
  timestamp: number
}

export interface CanvasArea {
  x: number
  y: number
  width: number
  height: number
  ownerId?: string
  paintCoverage: number
  dominantColor?: string
}

export enum BrushType {
  BASIC = 'basic',
  SPRAY = 'spray',
  TEXTURE = 'texture',
  NEON = 'neon',
  GLITCH = 'glitch',
  CYBERPUNK = 'cyberpunk'
}

export interface PaintBucket {
  color: string
  volume: number
  maxVolume: number
  refillRate: number
  lastRefill: number
}

class CollaborativePaintEngine {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private strokes: Map<string, PaintStroke> = new Map()
  private currentStroke: PaintStroke | null = null
  private paintBuckets: Map<string, PaintBucket> = new Map()
  private canvasAreas: CanvasArea[] = []
  private isDrawing = false
  private lastPoint: Point | null = null
  private animationFrame: number | null = null

  // Performance optimization
  private strokeBuffer: PaintStroke[] = []
  private lastBufferFlush = 0
  private readonly BUFFER_FLUSH_INTERVAL = 16 // 60fps

  // Cyberpunk effects
  private glitchEffect = false
  private neonIntensity = 1.0
  private scanlinePosition = 0

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')!
    this.setupCanvas()
    this.setupEventListeners()
    this.initializePaintSystem()
    this.startRenderLoop()
  }

  private setupCanvas() {
    // High DPI support
    const dpr = window.devicePixelRatio || 1
    const rect = this.canvas.getBoundingClientRect()

    this.canvas.width = rect.width * dpr
    this.canvas.height = rect.height * dpr
    this.context.scale(dpr, dpr)

    // Canvas style
    this.canvas.style.width = rect.width + 'px'
    this.canvas.style.height = rect.height + 'px'

    // Smooth painting
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'
    this.context.imageSmoothingEnabled = true
  }

  private setupEventListeners() {
    // Mouse events
    this.canvas.addEventListener('mousedown', this.startPaint.bind(this))
    this.canvas.addEventListener('mousemove', this.paint.bind(this))
    this.canvas.addEventListener('mouseup', this.stopPaint.bind(this))
    this.canvas.addEventListener('mouseout', this.stopPaint.bind(this))

    // Touch events for mobile
    this.canvas.addEventListener('touchstart', this.handleTouch.bind(this))
    this.canvas.addEventListener('touchmove', this.handleTouch.bind(this))
    this.canvas.addEventListener('touchend', this.stopPaint.bind(this))

    // Multiplayer events
    const multiplayerManager = getMultiplayerManager();
    getMultiplayerManager().on('paint_stroke_start', this.handleRemoteStrokeStart.bind(this))
    getMultiplayerManager().on('paint_stroke_update', this.handleRemoteStrokeUpdate.bind(this))
    multiplayerManager.on('paint_stroke_end', this.handleRemoteStrokeEnd.bind(this))
    multiplayerManager.on('canvas_clear', this.handleCanvasClear.bind(this))
  }

  private initializePaintSystem() {
    // Initialize default paint buckets
    const colors = ['#ff0040', '#00ff80', '#4080ff', '#ff8000', '#8040ff', '#ffff00']
    colors.forEach(color => {
      this.paintBuckets.set(color, {
        color,
        volume: 100,
        maxVolume: 100,
        refillRate: 5, // units per second
        lastRefill: Date.now()
      })
    })

    // Initialize canvas areas for territory system
    this.initializeCanvasAreas()
  }

  private initializeCanvasAreas() {
    const gridSize = 32
    const cols = Math.ceil(this.canvas.width / gridSize)
    const rows = Math.ceil(this.canvas.height / gridSize)

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        this.canvasAreas.push({
          x: col * gridSize,
          y: row * gridSize,
          width: gridSize,
          height: gridSize,
          paintCoverage: 0
        })
      }
    }
  }

  private startPaint(event: MouseEvent) {
    if (!multiplayerManager.currentPlayerInfo) return

    this.isDrawing = true
    const point = this.getPointFromEvent(event)

    // Check paint availability
    const playerId = multiplayerManager.currentPlayerInfo.id
    const playerColor = this.getPlayerColor(playerId)
    if (!this.canUsePaint(playerColor, 1)) {
      this.showPaintEmptyWarning()
      return
    }

    this.currentStroke = {
      id: `stroke_${Date.now()}_${Math.random()}`,
      playerId,
      points: [point],
      color: playerColor,
      brushSize: this.getCurrentBrushSize(),
      brushType: this.getCurrentBrushType(),
      opacity: 1.0,
      timestamp: Date.now(),
      completed: false
    }

    this.lastPoint = point

    // Notify multiplayer
    multiplayerManager.emit('paint_stroke_start', {
      stroke: this.currentStroke
    })

    // Performance monitoring
    performanceMonitor.setGameState('painting')
  }

  private paint(event: MouseEvent) {
    if (!this.isDrawing || !this.currentStroke || !this.lastPoint) return

    const point = this.getPointFromEvent(event)

    // Smooth interpolation between points
    const interpolatedPoints = this.interpolatePoints(this.lastPoint, point)
    this.currentStroke.points.push(...interpolatedPoints)

    // Update stroke in buffer
    this.strokeBuffer.push({ ...this.currentStroke })

    // Paint consumption
    const distance = this.calculateDistance(this.lastPoint, point)
    this.consumePaint(this.currentStroke.color, distance * 0.1)

    this.lastPoint = point

    // Update multiplayer
    multiplayerManager.emit('paint_stroke_update', {
      strokeId: this.currentStroke.id,
      points: interpolatedPoints
    })
  }

  private stopPaint() {
    if (!this.isDrawing || !this.currentStroke) return

    this.isDrawing = false
    this.currentStroke.completed = true

    // Store completed stroke
    this.strokes.set(this.currentStroke.id, this.currentStroke)

    // Update territory coverage
    this.updateCanvasCoverage(this.currentStroke)

    // Notify multiplayer
    multiplayerManager.emit('paint_stroke_end', {
      strokeId: this.currentStroke.id,
      finalStroke: this.currentStroke
    })

    this.currentStroke = null
    this.lastPoint = null

    performanceMonitor.setGameState('idle')
  }

  private handleTouch(event: TouchEvent) {
    event.preventDefault()
    const touch = event.touches[0] || event.changedTouches[0]

    const mouseEvent = new MouseEvent(
      event.type === 'touchstart' ? 'mousedown' :
      event.type === 'touchmove' ? 'mousemove' : 'mouseup',
      {
        clientX: touch.clientX,
        clientY: touch.clientY
      }
    )

    if (event.type === 'touchstart') this.startPaint(mouseEvent)
    else if (event.type === 'touchmove') this.paint(mouseEvent)
  }

  private getPointFromEvent(event: MouseEvent): Point {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
      pressure: (event as any).pressure || 1.0,
      timestamp: Date.now()
    }
  }

  private interpolatePoints(p1: Point, p2: Point): Point[] {
    const distance = this.calculateDistance(p1, p2)
    const steps = Math.max(2, Math.floor(distance / 2))
    const points: Point[] = []

    for (let i = 1; i <= steps; i++) {
      const t = i / steps
      points.push({
        x: p1.x + (p2.x - p1.x) * t,
        y: p1.y + (p2.y - p1.y) * t,
        pressure: p1.pressure! + (p2.pressure! - p1.pressure!) * t,
        timestamp: p1.timestamp + (p2.timestamp - p1.timestamp) * t
      })
    }

    return points
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  private startRenderLoop() {
    const render = () => {
      this.renderFrame()
      this.animationFrame = requestAnimationFrame(render)
    }
    render()
  }

  private renderFrame() {
    // Clear canvas with cyberpunk background
    this.renderBackground()

    // Render all strokes
    this.renderStrokes()

    // Render current stroke in progress
    if (this.currentStroke) {
      this.renderStroke(this.currentStroke, true)
    }

    // Render UI overlays
    this.renderTerritoryOverlay()
    this.renderCyberpunkEffects()

    // Flush stroke buffer
    this.flushStrokeBuffer()
  }

  private renderBackground() {
    // Cyberpunk grid background
    this.context.fillStyle = '#0a0a0a'
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Grid lines
    this.context.strokeStyle = '#1a1a2e'
    this.context.lineWidth = 0.5
    this.context.globalAlpha = 0.3

    const gridSize = 32
    for (let x = 0; x < this.canvas.width; x += gridSize) {
      this.context.beginPath()
      this.context.moveTo(x, 0)
      this.context.lineTo(x, this.canvas.height)
      this.context.stroke()
    }

    for (let y = 0; y < this.canvas.height; y += gridSize) {
      this.context.beginPath()
      this.context.moveTo(0, y)
      this.context.lineTo(this.canvas.width, y)
      this.context.stroke()
    }

    this.context.globalAlpha = 1.0
  }

  private renderStrokes() {
    this.strokes.forEach(stroke => {
      this.renderStroke(stroke, false)
    })
  }

  private renderStroke(stroke: PaintStroke, isLive: boolean) {
    if (stroke.points.length < 2) return

    this.context.globalAlpha = stroke.opacity
    this.context.strokeStyle = stroke.color
    this.context.lineWidth = stroke.brushSize

    // Apply brush effects
    this.applyBrushEffects(stroke.brushType, isLive)

    this.context.beginPath()
    this.context.moveTo(stroke.points[0].x, stroke.points[0].y)

    for (let i = 1; i < stroke.points.length; i++) {
      const point = stroke.points[i]
      this.context.lineTo(point.x, point.y)
    }

    this.context.stroke()
    this.context.globalAlpha = 1.0
  }

  private applyBrushEffects(brushType: BrushType, isLive: boolean) {
    switch (brushType) {
      case BrushType.NEON:
        this.context.shadowColor = this.context.strokeStyle as string
        this.context.shadowBlur = 10 * this.neonIntensity
        break

      case BrushType.GLITCH:
        if (isLive && Math.random() < 0.1) {
          this.context.globalCompositeOperation = 'difference'
        }
        break

      case BrushType.SPRAY:
        this.context.globalAlpha *= 0.1
        break

      default:
        this.context.shadowBlur = 0
        this.context.globalCompositeOperation = 'source-over'
    }
  }

  private renderTerritoryOverlay() {
    // Show territory ownership with subtle overlays
    this.canvasAreas.forEach(area => {
      if (area.paintCoverage > 0.1 && area.ownerId) {
        this.context.fillStyle = area.dominantColor || '#ffffff'
        this.context.globalAlpha = area.paintCoverage * 0.2
        this.context.fillRect(area.x, area.y, area.width, area.height)
      }
    })
    this.context.globalAlpha = 1.0
  }

  private renderCyberpunkEffects() {
    // Scanline effect
    this.scanlinePosition += 2
    if (this.scanlinePosition > this.canvas.height) {
      this.scanlinePosition = 0
    }

    this.context.strokeStyle = '#00ff88'
    this.context.globalAlpha = 0.1
    this.context.lineWidth = 2
    this.context.beginPath()
    this.context.moveTo(0, this.scanlinePosition)
    this.context.lineTo(this.canvas.width, this.scanlinePosition)
    this.context.stroke()
    this.context.globalAlpha = 1.0

    // Glitch effect
    if (this.glitchEffect && Math.random() < 0.05) {
      const glitchHeight = 10
      const y = Math.random() * (this.canvas.height - glitchHeight)

      const imageData = this.context.getImageData(0, y, this.canvas.width, glitchHeight)
      this.context.putImageData(imageData, Math.random() * 10 - 5, y)
    }
  }

  private flushStrokeBuffer() {
    const now = Date.now()
    if (now - this.lastBufferFlush > this.BUFFER_FLUSH_INTERVAL && this.strokeBuffer.length > 0) {
      // Process buffered strokes for optimized rendering
      this.strokeBuffer = []
      this.lastBufferFlush = now
    }
  }

  // Remote multiplayer events
  private handleRemoteStrokeStart(event: any) {
    const { stroke } = event.data
    this.strokes.set(stroke.id, stroke)
  }

  private handleRemoteStrokeUpdate(event: any) {
    const { strokeId, points } = event.data
    const stroke = this.strokes.get(strokeId)
    if (stroke) {
      stroke.points.push(...points)
    }
  }

  private handleRemoteStrokeEnd(event: any) {
    const { strokeId, finalStroke } = event.data
    this.strokes.set(strokeId, finalStroke)
    this.updateCanvasCoverage(finalStroke)
  }

  private handleCanvasClear(event: any) {
    this.strokes.clear()
    this.canvasAreas.forEach(area => {
      area.paintCoverage = 0
      area.ownerId = undefined
      area.dominantColor = undefined
    })
  }

  // Paint system methods
  private canUsePaint(color: string, amount: number): boolean {
    const bucket = this.paintBuckets.get(color)
    return bucket ? bucket.volume >= amount : false
  }

  private consumePaint(color: string, amount: number) {
    const bucket = this.paintBuckets.get(color)
    if (bucket) {
      bucket.volume = Math.max(0, bucket.volume - amount)
    }
  }

  private refillPaintBuckets() {
    const now = Date.now()
    this.paintBuckets.forEach(bucket => {
      const timeDelta = (now - bucket.lastRefill) / 1000
      const refillAmount = bucket.refillRate * timeDelta
      bucket.volume = Math.min(bucket.maxVolume, bucket.volume + refillAmount)
      bucket.lastRefill = now
    })
  }

  private updateCanvasCoverage(stroke: PaintStroke) {
    // Update territory coverage based on paint strokes
    stroke.points.forEach(point => {
      const area = this.getCanvasAreaAt(point.x, point.y)
      if (area) {
        area.paintCoverage += 0.01
        area.paintCoverage = Math.min(1.0, area.paintCoverage)
        area.ownerId = stroke.playerId
        area.dominantColor = stroke.color
      }
    })
  }

  private getCanvasAreaAt(x: number, y: number): CanvasArea | undefined {
    return this.canvasAreas.find(area =>
      x >= area.x && x < area.x + area.width &&
      y >= area.y && y < area.y + area.height
    )
  }

  // Public API
  getPlayerColor(playerId: string): string {
    const colors = ['#ff0040', '#00ff80', '#4080ff', '#ff8000', '#8040ff', '#ffff00']
    const playerIndex = Array.from(multiplayerManager.currentRoomInfo?.players || [])
      .findIndex(p => p.id === playerId)
    return colors[playerIndex % colors.length]
  }

  getCurrentBrushSize(): number {
    return 8 // Can be made configurable
  }

  getCurrentBrushType(): BrushType {
    return BrushType.NEON // Can be made configurable
  }

  showPaintEmptyWarning() {
    // Trigger UI warning about empty paint
    console.warn('Paint bucket is empty!')
  }

  getPaintLevels(): Map<string, number> {
    this.refillPaintBuckets()
    const levels = new Map<string, number>()
    this.paintBuckets.forEach((bucket, color) => {
      levels.set(color, bucket.volume / bucket.maxVolume)
    })
    return levels
  }

  getTerritoryStats(): { playerId: string; coverage: number; color: string }[] {
    const stats = new Map<string, { coverage: number; color: string }>()

    this.canvasAreas.forEach(area => {
      if (area.ownerId && area.paintCoverage > 0.1) {
        const existing = stats.get(area.ownerId) || { coverage: 0, color: area.dominantColor || '#ffffff' }
        existing.coverage += area.paintCoverage
        stats.set(area.ownerId, existing)
      }
    })

    return Array.from(stats.entries()).map(([playerId, data]) => ({
      playerId,
      coverage: data.coverage,
      color: data.color
    }))
  }

  enableGlitchEffect(enable: boolean) {
    this.glitchEffect = enable
  }

  setNeonIntensity(intensity: number) {
    this.neonIntensity = Math.max(0, Math.min(2, intensity))
  }

  clearCanvas() {
    this.handleCanvasClear({ data: {} })
    multiplayerManager.emit('canvas_clear', {})
  }

  dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }

    multiplayerManager.off('paint_stroke_start', this.handleRemoteStrokeStart)
    multiplayerManager.off('paint_stroke_update', this.handleRemoteStrokeUpdate)
    multiplayerManager.off('paint_stroke_end', this.handleRemoteStrokeEnd)
    multiplayerManager.off('canvas_clear', this.handleCanvasClear)
  }
}

export default CollaborativePaintEngine