/**
 * Brush Effects Engine
 * 고급 페인트 브러시 효과 시스템 - 사이버펑크 스타일
 */

import { BrushType, Point } from './CollaborativePaintEngine'

export interface BrushPreset {
  id: string
  name: string
  type: BrushType
  size: number
  opacity: number
  flow: number
  hardness: number
  spacing: number
  scatterX: number
  scatterY: number
  angle: number
  roundness: number
  flipX: boolean
  flipY: boolean
  texture?: string
  colorDynamics: ColorDynamics
  shapePreset: ShapePreset
  effects: BrushEffect[]
}

export interface ColorDynamics {
  hueJitter: number
  saturationJitter: number
  brightnessJitter: number
  foregroundBackgroundJitter: number
}

export interface ShapePreset {
  type: 'circle' | 'square' | 'star' | 'heart' | 'lightning' | 'pixel' | 'custom'
  customPath?: string
  rotation: number
  scale: { x: number; y: number }
}

export interface BrushEffect {
  type: EffectType
  intensity: number
  parameters: { [key: string]: any }
  enabled: boolean
}

export enum EffectType {
  GLOW = 'glow',
  NEON = 'neon',
  GLITCH = 'glitch',
  PARTICLE = 'particle',
  LIGHTNING = 'lightning',
  HOLOGRAM = 'hologram',
  CHROMATIC_ABERRATION = 'chromatic_aberration',
  SCAN_LINES = 'scan_lines',
  NOISE = 'noise',
  MOTION_BLUR = 'motion_blur',
  DISTORTION = 'distortion',
  COLOR_SHIFT = 'color_shift'
}

export interface ParticleSystem {
  particles: Particle[]
  maxParticles: number
  spawnRate: number
  lifetime: number
  velocity: { x: number; y: number }
  acceleration: { x: number; y: number }
  size: { min: number; max: number }
  color: { start: string; end: string }
  alpha: { start: number; end: number }
}

export interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  ax: number
  ay: number
  size: number
  color: string
  alpha: number
  age: number
  lifetime: number
}

class BrushEffectsEngine {
  private canvas: HTMLCanvasElement
  private context: CanvasRenderingContext2D
  private brushPresets: Map<string, BrushPreset> = new Map()
  private currentPreset: BrushPreset
  private particleSystems: Map<string, ParticleSystem> = new Map()
  private textureCache: Map<string, HTMLCanvasElement> = new Map()
  private animationFrame: number | null = null

  // Noise generators for effects
  private noiseCanvas: HTMLCanvasElement
  private noiseContext: CanvasRenderingContext2D

  // Shader-like filters (WebGL would be better but Canvas 2D for compatibility)
  private filterCanvas: HTMLCanvasElement
  private filterContext: CanvasRenderingContext2D

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas
    this.context = canvas.getContext('2d')!

    // Initialize noise canvas
    this.noiseCanvas = document.createElement('canvas')
    this.noiseCanvas.width = 256
    this.noiseCanvas.height = 256
    this.noiseContext = this.noiseCanvas.getContext('2d')!

    // Initialize filter canvas
    this.filterCanvas = document.createElement('canvas')
    this.filterCanvas.width = canvas.width
    this.filterCanvas.height = canvas.height
    this.filterContext = this.filterCanvas.getContext('2d')!

    this.initializeBrushPresets()
    this.generateNoiseTexture()
    this.startEffectsLoop()
  }

  private initializeBrushPresets() {
    const presets: BrushPreset[] = [
      {
        id: 'basic_neon',
        name: 'Basic Neon',
        type: BrushType.NEON,
        size: 16,
        opacity: 0.8,
        flow: 1.0,
        hardness: 0.3,
        spacing: 0.1,
        scatterX: 0,
        scatterY: 0,
        angle: 0,
        roundness: 1.0,
        flipX: false,
        flipY: false,
        colorDynamics: {
          hueJitter: 0,
          saturationJitter: 0,
          brightnessJitter: 10,
          foregroundBackgroundJitter: 0
        },
        shapePreset: {
          type: 'circle',
          rotation: 0,
          scale: { x: 1, y: 1 }
        },
        effects: [
          {
            type: EffectType.GLOW,
            intensity: 0.8,
            parameters: { radius: 20, color: 'inherit' },
            enabled: true
          },
          {
            type: EffectType.NEON,
            intensity: 1.0,
            parameters: { innerGlow: true, outerGlow: true },
            enabled: true
          }
        ]
      },

      {
        id: 'glitch_spray',
        name: 'Glitch Spray',
        type: BrushType.GLITCH,
        size: 24,
        opacity: 0.6,
        flow: 0.3,
        hardness: 0.1,
        spacing: 0.05,
        scatterX: 30,
        scatterY: 30,
        angle: 0,
        roundness: 0.7,
        flipX: false,
        flipY: false,
        colorDynamics: {
          hueJitter: 30,
          saturationJitter: 20,
          brightnessJitter: 40,
          foregroundBackgroundJitter: 0
        },
        shapePreset: {
          type: 'square',
          rotation: 0,
          scale: { x: 1, y: 1 }
        },
        effects: [
          {
            type: EffectType.GLITCH,
            intensity: 0.7,
            parameters: { distortionStrength: 5, colorSeparation: 3 },
            enabled: true
          },
          {
            type: EffectType.CHROMATIC_ABERRATION,
            intensity: 0.5,
            parameters: { offset: 2 },
            enabled: true
          },
          {
            type: EffectType.NOISE,
            intensity: 0.3,
            parameters: { scale: 0.5, animated: true },
            enabled: true
          }
        ]
      },

      {
        id: 'cyber_lightning',
        name: 'Cyber Lightning',
        type: BrushType.CYBERPUNK,
        size: 8,
        opacity: 1.0,
        flow: 1.0,
        hardness: 0.9,
        spacing: 0.2,
        scatterX: 0,
        scatterY: 0,
        angle: 0,
        roundness: 1.0,
        flipX: false,
        flipY: false,
        colorDynamics: {
          hueJitter: 10,
          saturationJitter: 0,
          brightnessJitter: 30,
          foregroundBackgroundJitter: 0
        },
        shapePreset: {
          type: 'lightning',
          rotation: 0,
          scale: { x: 1, y: 1 }
        },
        effects: [
          {
            type: EffectType.LIGHTNING,
            intensity: 1.0,
            parameters: { branches: 3, jitter: 10, fadeTime: 200 },
            enabled: true
          },
          {
            type: EffectType.GLOW,
            intensity: 1.0,
            parameters: { radius: 15, color: '#00ff88' },
            enabled: true
          },
          {
            type: EffectType.PARTICLE,
            intensity: 0.5,
            parameters: { count: 10, speed: 50, lifetime: 500 },
            enabled: true
          }
        ]
      },

      {
        id: 'hologram_brush',
        name: 'Hologram',
        type: BrushType.CYBERPUNK,
        size: 20,
        opacity: 0.7,
        flow: 0.8,
        hardness: 0.4,
        spacing: 0.15,
        scatterX: 0,
        scatterY: 0,
        angle: 0,
        roundness: 1.0,
        flipX: false,
        flipY: false,
        colorDynamics: {
          hueJitter: 0,
          saturationJitter: 10,
          brightnessJitter: 20,
          foregroundBackgroundJitter: 0
        },
        shapePreset: {
          type: 'circle',
          rotation: 0,
          scale: { x: 1, y: 1 }
        },
        effects: [
          {
            type: EffectType.HOLOGRAM,
            intensity: 0.8,
            parameters: { flicker: true, scanlines: true, distortion: 0.3 },
            enabled: true
          },
          {
            type: EffectType.SCAN_LINES,
            intensity: 0.4,
            parameters: { spacing: 2, speed: 1 },
            enabled: true
          },
          {
            type: EffectType.COLOR_SHIFT,
            intensity: 0.3,
            parameters: { speed: 0.5, range: 20 },
            enabled: true
          }
        ]
      },

      {
        id: 'particle_stream',
        name: 'Particle Stream',
        type: BrushType.SPRAY,
        size: 32,
        opacity: 0.4,
        flow: 0.6,
        hardness: 0.0,
        spacing: 0.05,
        scatterX: 40,
        scatterY: 40,
        angle: 0,
        roundness: 1.0,
        flipX: false,
        flipY: false,
        colorDynamics: {
          hueJitter: 15,
          saturationJitter: 25,
          brightnessJitter: 35,
          foregroundBackgroundJitter: 20
        },
        shapePreset: {
          type: 'circle',
          rotation: 0,
          scale: { x: 1, y: 1 }
        },
        effects: [
          {
            type: EffectType.PARTICLE,
            intensity: 1.0,
            parameters: {
              count: 50,
              speed: 80,
              lifetime: 1000,
              gravity: 20,
              size: { min: 1, max: 4 },
              color: { start: 'inherit', end: 'transparent' }
            },
            enabled: true
          },
          {
            type: EffectType.MOTION_BLUR,
            intensity: 0.6,
            parameters: { strength: 5 },
            enabled: true
          }
        ]
      }
    ]

    presets.forEach(preset => {
      this.brushPresets.set(preset.id, preset)
    })

    this.currentPreset = presets[0] // Default to first preset
  }

  private generateNoiseTexture() {
    const imageData = this.noiseContext.createImageData(256, 256)
    const data = imageData.data

    for (let i = 0; i < data.length; i += 4) {
      const value = Math.random() * 255
      data[i] = value     // Red
      data[i + 1] = value // Green
      data[i + 2] = value // Blue
      data[i + 3] = 255   // Alpha
    }

    this.noiseContext.putImageData(imageData, 0, 0)
  }

  private startEffectsLoop() {
    const animate = () => {
      this.updateParticleSystems()
      this.animationFrame = requestAnimationFrame(animate)
    }
    animate()
  }

  // Public API
  public applyBrushStroke(points: Point[], color: string, preset?: BrushPreset) {
    const activePreset = preset || this.currentPreset

    // Apply base stroke
    this.renderBaseStroke(points, color, activePreset)

    // Apply effects
    activePreset.effects.forEach(effect => {
      if (effect.enabled) {
        this.applyEffect(points, color, activePreset, effect)
      }
    })
  }

  private renderBaseStroke(points: Point[], color: string, preset: BrushPreset) {
    if (points.length < 2) return

    this.context.save()

    // Set base properties
    this.context.globalAlpha = preset.opacity
    this.context.strokeStyle = this.adjustColor(color, preset.colorDynamics)
    this.context.lineWidth = preset.size
    this.context.lineCap = 'round'
    this.context.lineJoin = 'round'

    // Apply hardness (simulate with shadow blur)
    if (preset.hardness < 1.0) {
      this.context.shadowColor = this.context.strokeStyle as string
      this.context.shadowBlur = preset.size * (1 - preset.hardness)
    }

    // Render stroke with spacing and scatter
    this.renderStrokeWithSpacing(points, preset)

    this.context.restore()
  }

  private renderStrokeWithSpacing(points: Point[], preset: BrushPreset) {
    let lastDrawnPoint = points[0]
    const minDistance = preset.size * preset.spacing

    for (let i = 1; i < points.length; i++) {
      const point = points[i]
      const distance = this.calculateDistance(lastDrawnPoint, point)

      if (distance >= minDistance) {
        // Apply scatter
        const scatteredPoint = {
          ...point,
          x: point.x + (Math.random() - 0.5) * preset.scatterX,
          y: point.y + (Math.random() - 0.5) * preset.scatterY
        }

        this.renderBrushDab(scatteredPoint, preset)
        lastDrawnPoint = point
      }
    }
  }

  private renderBrushDab(point: Point, preset: BrushPreset) {
    this.context.save()

    this.context.translate(point.x, point.y)
    this.context.rotate((preset.angle + Math.random() * 20 - 10) * Math.PI / 180)
    this.context.scale(preset.shapePreset.scale.x, preset.shapePreset.scale.y)

    const size = preset.size * (point.pressure || 1.0)

    switch (preset.shapePreset.type) {
      case 'circle':
        this.context.beginPath()
        this.context.arc(0, 0, size / 2, 0, Math.PI * 2)
        this.context.fill()
        break

      case 'square':
        this.context.fillRect(-size/2, -size/2, size, size)
        break

      case 'star':
        this.renderStarShape(size)
        break

      case 'lightning':
        this.renderLightningShape(size)
        break

      case 'pixel':
        this.renderPixelShape(size)
        break
    }

    this.context.restore()
  }

  private renderStarShape(size: number) {
    const spikes = 5
    const outerRadius = size / 2
    const innerRadius = outerRadius * 0.4

    this.context.beginPath()
    for (let i = 0; i < spikes * 2; i++) {
      const radius = i % 2 === 0 ? outerRadius : innerRadius
      const angle = (i * Math.PI) / spikes
      const x = Math.cos(angle) * radius
      const y = Math.sin(angle) * radius

      if (i === 0) {
        this.context.moveTo(x, y)
      } else {
        this.context.lineTo(x, y)
      }
    }
    this.context.closePath()
    this.context.fill()
  }

  private renderLightningShape(size: number) {
    this.context.beginPath()
    this.context.moveTo(-size/2, 0)

    // Generate zigzag pattern
    const segments = 5
    for (let i = 1; i <= segments; i++) {
      const x = (-size/2) + (i * size / segments)
      const y = (Math.random() - 0.5) * size * 0.3
      this.context.lineTo(x, y)
    }

    this.context.stroke()
  }

  private renderPixelShape(size: number) {
    const pixelSize = Math.max(1, Math.floor(size / 8))
    this.context.fillRect(-pixelSize/2, -pixelSize/2, pixelSize, pixelSize)
  }

  private applyEffect(points: Point[], color: string, preset: BrushPreset, effect: BrushEffect) {
    switch (effect.type) {
      case EffectType.GLOW:
        this.applyGlowEffect(points, color, effect)
        break

      case EffectType.NEON:
        this.applyNeonEffect(points, color, effect)
        break

      case EffectType.GLITCH:
        this.applyGlitchEffect(points, color, effect)
        break

      case EffectType.PARTICLE:
        this.spawnParticles(points, color, effect)
        break

      case EffectType.LIGHTNING:
        this.applyLightningEffect(points, color, effect)
        break

      case EffectType.HOLOGRAM:
        this.applyHologramEffect(points, color, effect)
        break

      case EffectType.CHROMATIC_ABERRATION:
        this.applyChromaticAberration(points, color, effect)
        break

      case EffectType.SCAN_LINES:
        this.applyScanLines(points, effect)
        break

      case EffectType.NOISE:
        this.applyNoiseEffect(points, color, effect)
        break

      case EffectType.MOTION_BLUR:
        this.applyMotionBlur(points, effect)
        break
    }
  }

  private applyGlowEffect(points: Point[], color: string, effect: BrushEffect) {
    this.context.save()

    const radius = effect.parameters.radius || 20
    const glowColor = effect.parameters.color === 'inherit' ? color : effect.parameters.color

    this.context.shadowColor = glowColor
    this.context.shadowBlur = radius * effect.intensity
    this.context.globalAlpha = 0.3 * effect.intensity

    // Redraw the stroke with glow
    this.context.strokeStyle = glowColor
    this.context.beginPath()
    this.context.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.context.lineTo(points[i].x, points[i].y)
    }
    this.context.stroke()

    this.context.restore()
  }

  private applyNeonEffect(points: Point[], color: string, effect: BrushEffect) {
    this.context.save()

    // Inner glow
    if (effect.parameters.innerGlow) {
      this.context.shadowColor = color
      this.context.shadowBlur = 5 * effect.intensity
      this.context.globalAlpha = 0.8
      this.drawStrokePath(points)
    }

    // Outer glow
    if (effect.parameters.outerGlow) {
      this.context.shadowColor = color
      this.context.shadowBlur = 20 * effect.intensity
      this.context.globalAlpha = 0.3
      this.drawStrokePath(points)
    }

    this.context.restore()
  }

  private applyGlitchEffect(points: Point[], color: string, effect: BrushEffect) {
    const distortion = effect.parameters.distortionStrength || 5
    const separation = effect.parameters.colorSeparation || 3

    // RGB separation glitch
    this.context.save()

    // Red channel
    this.context.globalCompositeOperation = 'screen'
    this.context.strokeStyle = `${color}80` // Semi-transparent
    this.context.translate(-separation * effect.intensity, 0)
    this.drawStrokePath(points)

    // Green channel
    this.context.strokeStyle = `#00ff0080`
    this.context.translate(separation * 2 * effect.intensity, distortion * effect.intensity)
    this.drawStrokePath(points)

    // Blue channel
    this.context.strokeStyle = `#0000ff80`
    this.context.translate(-separation * effect.intensity, -distortion * 2 * effect.intensity)
    this.drawStrokePath(points)

    this.context.restore()
  }

  private spawnParticles(points: Point[], color: string, effect: BrushEffect) {
    const systemId = `stroke_${Date.now()}`
    const params = effect.parameters

    const particleSystem: ParticleSystem = {
      particles: [],
      maxParticles: params.count || 20,
      spawnRate: params.spawnRate || 1,
      lifetime: params.lifetime || 1000,
      velocity: params.velocity || { x: 0, y: 0 },
      acceleration: params.acceleration || { x: 0, y: params.gravity || 0 },
      size: params.size || { min: 1, max: 3 },
      color: { start: color, end: params.color?.end || 'transparent' },
      alpha: { start: 1, end: 0 }
    }

    // Spawn particles along the stroke
    points.forEach((point, index) => {
      if (index % Math.max(1, Math.floor(points.length / particleSystem.maxParticles)) === 0) {
        for (let i = 0; i < effect.intensity * 10; i++) {
          const particle: Particle = {
            x: point.x + (Math.random() - 0.5) * 20,
            y: point.y + (Math.random() - 0.5) * 20,
            vx: (Math.random() - 0.5) * (params.speed || 50),
            vy: (Math.random() - 0.5) * (params.speed || 50),
            ax: particleSystem.acceleration.x,
            ay: particleSystem.acceleration.y,
            size: particleSystem.size.min + Math.random() * (particleSystem.size.max - particleSystem.size.min),
            color: particleSystem.color.start,
            alpha: particleSystem.alpha.start,
            age: 0,
            lifetime: particleSystem.lifetime
          }
          particleSystem.particles.push(particle)
        }
      }
    })

    this.particleSystems.set(systemId, particleSystem)

    // Auto-cleanup after lifetime
    setTimeout(() => {
      this.particleSystems.delete(systemId)
    }, particleSystem.lifetime * 2)
  }

  private applyLightningEffect(points: Point[], color: string, effect: BrushEffect) {
    const branches = effect.parameters.branches || 3
    const jitter = effect.parameters.jitter || 10

    this.context.save()
    this.context.strokeStyle = color
    this.context.shadowColor = color
    this.context.shadowBlur = 10 * effect.intensity
    this.context.lineWidth = 2

    // Main lightning bolt
    this.drawLightningBolt(points[0], points[points.length - 1], jitter * effect.intensity)

    // Branch lightning
    for (let i = 0; i < branches; i++) {
      const startIndex = Math.floor(Math.random() * points.length)
      const startPoint = points[startIndex]
      const endPoint = {
        x: startPoint.x + (Math.random() - 0.5) * 100,
        y: startPoint.y + (Math.random() - 0.5) * 100,
        pressure: 1,
        timestamp: Date.now()
      }
      this.drawLightningBolt(startPoint, endPoint, jitter * effect.intensity * 0.5)
    }

    this.context.restore()
  }

  private drawLightningBolt(start: Point, end: Point, jitter: number) {
    this.context.beginPath()
    this.context.moveTo(start.x, start.y)

    const segments = 8
    for (let i = 1; i < segments; i++) {
      const t = i / segments
      const x = start.x + (end.x - start.x) * t + (Math.random() - 0.5) * jitter
      const y = start.y + (end.y - start.y) * t + (Math.random() - 0.5) * jitter
      this.context.lineTo(x, y)
    }

    this.context.lineTo(end.x, end.y)
    this.context.stroke()
  }

  private applyHologramEffect(points: Point[], color: string, effect: BrushEffect) {
    // Hologram effect with flicker and distortion
    this.context.save()

    // Random flicker
    if (effect.parameters.flicker && Math.random() < 0.1) {
      this.context.globalAlpha = 0.3 + Math.random() * 0.7
    }

    // Scanlines
    if (effect.parameters.scanlines) {
      this.applyScanLines(points, { ...effect, intensity: 0.3 })
    }

    // Color shift
    const hue = this.extractHue(color)
    const shiftedColor = this.hslToHex(hue + Math.sin(Date.now() * 0.01) * 30, 70, 50)

    this.context.strokeStyle = shiftedColor
    this.drawStrokePath(points)

    this.context.restore()
  }

  private applyChromaticAberration(points: Point[], color: string, effect: BrushEffect) {
    const offset = effect.parameters.offset || 2

    this.context.save()
    this.context.globalCompositeOperation = 'screen'

    // Red offset
    this.context.strokeStyle = '#ff000080'
    this.context.translate(-offset * effect.intensity, 0)
    this.drawStrokePath(points)

    // Blue offset
    this.context.strokeStyle = '#0000ff80'
    this.context.translate(offset * 2 * effect.intensity, 0)
    this.drawStrokePath(points)

    this.context.restore()
  }

  private applyScanLines(points: Point[], effect: BrushEffect) {
    const spacing = effect.parameters.spacing || 2
    const speed = effect.parameters.speed || 1

    this.context.save()
    this.context.globalAlpha = 0.3 * effect.intensity
    this.context.strokeStyle = '#00ff88'
    this.context.lineWidth = 1

    const offset = (Date.now() * speed) % (spacing * 2)

    for (let y = -offset; y < this.canvas.height + spacing; y += spacing) {
      this.context.beginPath()
      this.context.moveTo(0, y)
      this.context.lineTo(this.canvas.width, y)
      this.context.stroke()
    }

    this.context.restore()
  }

  private applyNoiseEffect(points: Point[], color: string, effect: BrushEffect) {
    const scale = effect.parameters.scale || 1

    this.context.save()
    this.context.globalAlpha = effect.intensity * 0.5
    this.context.globalCompositeOperation = 'overlay'

    // Apply noise texture
    for (let i = 0; i < points.length - 1; i++) {
      const point = points[i]
      this.context.drawImage(
        this.noiseCanvas,
        point.x - 16 * scale,
        point.y - 16 * scale,
        32 * scale,
        32 * scale
      )
    }

    this.context.restore()
  }

  private applyMotionBlur(points: Point[], effect: BrushEffect) {
    // Simplified motion blur by drawing multiple offset strokes
    const strength = effect.parameters.strength || 5

    this.context.save()
    this.context.globalAlpha = 0.2 * effect.intensity

    for (let i = 1; i <= strength; i++) {
      this.context.translate(-i, 0)
      this.drawStrokePath(points)
    }

    this.context.restore()
  }

  private updateParticleSystems() {
    this.particleSystems.forEach(system => {
      system.particles.forEach((particle, index) => {
        // Update physics
        particle.vx += particle.ax
        particle.vy += particle.ay
        particle.x += particle.vx * 0.016 // ~60fps
        particle.y += particle.vy * 0.016

        // Update life
        particle.age += 16
        const lifeRatio = particle.age / particle.lifetime
        particle.alpha = system.alpha.start * (1 - lifeRatio)

        // Remove dead particles
        if (particle.age >= particle.lifetime) {
          system.particles.splice(index, 1)
        }
      })

      // Render particles
      this.renderParticleSystem(system)
    })
  }

  private renderParticleSystem(system: ParticleSystem) {
    this.context.save()

    system.particles.forEach(particle => {
      this.context.globalAlpha = particle.alpha
      this.context.fillStyle = particle.color
      this.context.beginPath()
      this.context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
      this.context.fill()
    })

    this.context.restore()
  }

  // Utility methods
  private drawStrokePath(points: Point[]) {
    if (points.length < 2) return

    this.context.beginPath()
    this.context.moveTo(points[0].x, points[0].y)
    for (let i = 1; i < points.length; i++) {
      this.context.lineTo(points[i].x, points[i].y)
    }
    this.context.stroke()
  }

  private calculateDistance(p1: Point, p2: Point): number {
    return Math.sqrt(Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2))
  }

  private adjustColor(color: string, dynamics: ColorDynamics): string {
    // Apply color jitter based on dynamics
    const hsl = this.hexToHsl(color)

    hsl.h += (Math.random() - 0.5) * dynamics.hueJitter
    hsl.s += (Math.random() - 0.5) * dynamics.saturationJitter
    hsl.l += (Math.random() - 0.5) * dynamics.brightnessJitter

    return this.hslToHex(hsl.h, hsl.s, hsl.l)
  }

  private hexToHsl(hex: string): { h: number; s: number; l: number } {
    // Simplified HSL conversion
    const r = parseInt(hex.slice(1, 3), 16) / 255
    const g = parseInt(hex.slice(3, 5), 16) / 255
    const b = parseInt(hex.slice(5, 7), 16) / 255

    const max = Math.max(r, g, b)
    const min = Math.min(r, g, b)
    const diff = max - min
    const sum = max + min
    const l = sum / 2

    let h = 0
    let s = 0

    if (diff !== 0) {
      s = l < 0.5 ? diff / sum : diff / (2 - sum)

      switch (max) {
        case r: h = ((g - b) / diff) + (g < b ? 6 : 0); break
        case g: h = (b - r) / diff + 2; break
        case b: h = (r - g) / diff + 4; break
      }
      h /= 6
    }

    return { h: h * 360, s: s * 100, l: l * 100 }
  }

  private hslToHex(h: number, s: number, l: number): string {
    h = h % 360
    s = Math.max(0, Math.min(100, s)) / 100
    l = Math.max(0, Math.min(100, l)) / 100

    const c = (1 - Math.abs(2 * l - 1)) * s
    const x = c * (1 - Math.abs((h / 60) % 2 - 1))
    const m = l - c / 2

    let r = 0, g = 0, b = 0

    if (h >= 0 && h < 60) { r = c; g = x; b = 0 }
    else if (h >= 60 && h < 120) { r = x; g = c; b = 0 }
    else if (h >= 120 && h < 180) { r = 0; g = c; b = x }
    else if (h >= 180 && h < 240) { r = 0; g = x; b = c }
    else if (h >= 240 && h < 300) { r = x; g = 0; b = c }
    else if (h >= 300 && h < 360) { r = c; g = 0; b = x }

    r = Math.round((r + m) * 255)
    g = Math.round((g + m) * 255)
    b = Math.round((b + m) * 255)

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
  }

  private extractHue(hex: string): number {
    return this.hexToHsl(hex).h
  }

  // Public API
  public getBrushPresets(): BrushPreset[] {
    return Array.from(this.brushPresets.values())
  }

  public setCurrentPreset(presetId: string) {
    const preset = this.brushPresets.get(presetId)
    if (preset) {
      this.currentPreset = preset
    }
  }

  public getCurrentPreset(): BrushPreset {
    return this.currentPreset
  }

  public createCustomPreset(preset: BrushPreset): void {
    this.brushPresets.set(preset.id, preset)
  }

  public dispose() {
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame)
    }
    this.particleSystems.clear()
    this.textureCache.clear()
  }
}

export default BrushEffectsEngine