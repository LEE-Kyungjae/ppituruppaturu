// 고급 파티클 시스템
import { Vector2D } from './PhysicsEngine'

export interface Particle {
  id: string
  position: Vector2D
  velocity: Vector2D
  acceleration: Vector2D
  life: number
  maxLife: number
  size: number
  startSize: number
  endSize: number
  color: {
    r: number
    g: number
    b: number
    a: number
  }
  startColor: {
    r: number
    g: number
    b: number
    a: number
  }
  endColor: {
    r: number
    g: number
    b: number
    a: number
  }
  rotation: number
  angularVelocity: number
  shape: 'circle' | 'square' | 'star' | 'heart'
}

export interface ParticleEmitterConfig {
  position: Vector2D
  emissionRate: number // particles per second
  maxParticles: number
  particleLife: { min: number, max: number }
  velocity: {
    direction: { min: number, max: number } // in radians
    magnitude: { min: number, max: number }
  }
  size: { start: number, end: number }
  color: {
    start: { r: number, g: number, b: number, a: number }
    end: { r: number, g: number, b: number, a: number }
  }
  gravity: Vector2D
  shape: 'circle' | 'square' | 'star' | 'heart'
  burst?: {
    count: number
    interval: number // seconds
  }
}

export class ParticleSystem {
  private particles: Particle[] = []
  private emitters: Map<string, { config: ParticleEmitterConfig, lastEmission: number, burstTimer: number }> = new Map()
  private nextParticleId = 0

  constructor() {}

  // 파티클 이미터 추가
  addEmitter(id: string, config: ParticleEmitterConfig) {
    this.emitters.set(id, {
      config,
      lastEmission: Date.now(),
      burstTimer: 0
    })
  }

  // 파티클 이미터 제거
  removeEmitter(id: string) {
    this.emitters.delete(id)
  }

  // 파티클 이미터 위치 업데이트
  updateEmitterPosition(id: string, position: Vector2D) {
    const emitter = this.emitters.get(id)
    if (emitter) {
      emitter.config.position = position
    }
  }

  // 랜덤 값 생성 헬퍼
  private randomBetween(min: number, max: number): number {
    return Math.random() * (max - min) + min
  }

  private interpolateColor(start: any, end: any, t: number) {
    return {
      r: Math.floor(start.r + (end.r - start.r) * t),
      g: Math.floor(start.g + (end.g - start.g) * t),
      b: Math.floor(start.b + (end.b - start.b) * t),
      a: start.a + (end.a - start.a) * t
    }
  }

  // 파티클 생성
  private createParticle(emitter: ParticleEmitterConfig): Particle {
    const direction = this.randomBetween(emitter.velocity.direction.min, emitter.velocity.direction.max)
    const magnitude = this.randomBetween(emitter.velocity.magnitude.min, emitter.velocity.magnitude.max)
    const life = this.randomBetween(emitter.particleLife.min, emitter.particleLife.max)

    return {
      id: `particle_${this.nextParticleId++}`,
      position: { ...emitter.position },
      velocity: {
        x: Math.cos(direction) * magnitude,
        y: Math.sin(direction) * magnitude
      },
      acceleration: { x: 0, y: 0 },
      life,
      maxLife: life,
      size: emitter.size.start,
      startSize: emitter.size.start,
      endSize: emitter.size.end,
      color: { ...emitter.color.start },
      startColor: { ...emitter.color.start },
      endColor: { ...emitter.color.end },
      rotation: 0,
      angularVelocity: this.randomBetween(-Math.PI, Math.PI),
      shape: emitter.shape
    }
  }

  // 폭발 효과
  createExplosion(position: Vector2D, intensity: number = 1) {
    const explosionConfig: ParticleEmitterConfig = {
      position,
      emissionRate: 0,
      maxParticles: Math.floor(50 * intensity),
      particleLife: { min: 0.5, max: 2.0 },
      velocity: {
        direction: { min: 0, max: Math.PI * 2 },
        magnitude: { min: 100 * intensity, max: 300 * intensity }
      },
      size: { start: 8, end: 0 },
      color: {
        start: { r: 255, g: 150, b: 0, a: 1 },
        end: { r: 255, g: 0, b: 0, a: 0 }
      },
      gravity: { x: 0, y: 200 },
      shape: 'circle'
    }

    // 즉시 파티클들 생성
    for (let i = 0; i < explosionConfig.maxParticles; i++) {
      this.particles.push(this.createParticle(explosionConfig))
    }
  }

  // 트레일 효과
  createTrail(position: Vector2D, velocity: Vector2D) {
    const trailConfig: ParticleEmitterConfig = {
      position,
      emissionRate: 100,
      maxParticles: 20,
      particleLife: { min: 0.3, max: 0.8 },
      velocity: {
        direction: { min: Math.atan2(-velocity.y, -velocity.x) - 0.5, max: Math.atan2(-velocity.y, -velocity.x) + 0.5 },
        magnitude: { min: 20, max: 50 }
      },
      size: { start: 4, end: 0 },
      color: {
        start: { r: 100, g: 200, b: 255, a: 0.8 },
        end: { r: 50, g: 100, b: 200, a: 0 }
      },
      gravity: { x: 0, y: 0 },
      shape: 'circle'
    }

    this.particles.push(this.createParticle(trailConfig))
  }

  // 수집 효과
  createCollectEffect(position: Vector2D, color: { r: number, g: number, b: number }) {
    const collectConfig: ParticleEmitterConfig = {
      position,
      emissionRate: 0,
      maxParticles: 15,
      particleLife: { min: 1.0, max: 1.5 },
      velocity: {
        direction: { min: 0, max: Math.PI * 2 },
        magnitude: { min: 50, max: 100 }
      },
      size: { start: 6, end: 12 },
      color: {
        start: { ...color, a: 1 },
        end: { ...color, a: 0 }
      },
      gravity: { x: 0, y: -100 },
      shape: 'star'
    }

    for (let i = 0; i < collectConfig.maxParticles; i++) {
      this.particles.push(this.createParticle(collectConfig))
    }
  }

  // 업데이트
  update(deltaTime: number) {
    const currentTime = Date.now()

    // 이미터에서 파티클 생성
    for (const [id, emitterData] of this.emitters) {
      const { config, lastEmission, burstTimer } = emitterData
      const timeSinceLastEmission = (currentTime - lastEmission) / 1000

      // 버스트 모드
      if (config.burst) {
        emitterData.burstTimer += deltaTime
        if (emitterData.burstTimer >= config.burst.interval) {
          for (let i = 0; i < config.burst.count; i++) {
            if (this.particles.length < config.maxParticles) {
              this.particles.push(this.createParticle(config))
            }
          }
          emitterData.burstTimer = 0
        }
      } else {
        // 연속 방출 모드
        const particlesToEmit = Math.floor(timeSinceLastEmission * config.emissionRate)
        for (let i = 0; i < particlesToEmit && this.particles.length < config.maxParticles; i++) {
          this.particles.push(this.createParticle(config))
        }
        
        if (particlesToEmit > 0) {
          emitterData.lastEmission = currentTime
        }
      }
    }

    // 파티클 업데이트
    this.particles = this.particles.filter(particle => {
      // 생명 감소
      particle.life -= deltaTime
      if (particle.life <= 0) return false

      // 생명 비율 계산
      const lifeRatio = 1 - (particle.life / particle.maxLife)

      // 크기 보간
      particle.size = particle.startSize + (particle.endSize - particle.startSize) * lifeRatio

      // 색상 보간
      particle.color = this.interpolateColor(particle.startColor, particle.endColor, lifeRatio)

      // 물리 업데이트
      for (const [id, emitterData] of this.emitters) {
        particle.acceleration.x += emitterData.config.gravity.x * deltaTime
        particle.acceleration.y += emitterData.config.gravity.y * deltaTime
      }

      particle.velocity.x += particle.acceleration.x * deltaTime
      particle.velocity.y += particle.acceleration.y * deltaTime

      particle.position.x += particle.velocity.x * deltaTime
      particle.position.y += particle.velocity.y * deltaTime

      particle.rotation += particle.angularVelocity * deltaTime

      // 가속도 리셋
      particle.acceleration = { x: 0, y: 0 }

      return true
    })
  }

  // 렌더링
  render(ctx: CanvasRenderingContext2D) {
    ctx.save()

    for (const particle of this.particles) {
      ctx.save()
      ctx.globalAlpha = particle.color.a
      ctx.fillStyle = `rgba(${particle.color.r}, ${particle.color.g}, ${particle.color.b}, ${particle.color.a})`
      
      ctx.translate(particle.position.x, particle.position.y)
      ctx.rotate(particle.rotation)

      const halfSize = particle.size / 2

      switch (particle.shape) {
        case 'circle':
          ctx.beginPath()
          ctx.arc(0, 0, halfSize, 0, Math.PI * 2)
          ctx.fill()
          break

        case 'square':
          ctx.fillRect(-halfSize, -halfSize, particle.size, particle.size)
          break

        case 'star':
          this.drawStar(ctx, 0, 0, 5, halfSize, halfSize * 0.5)
          ctx.fill()
          break

        case 'heart':
          this.drawHeart(ctx, 0, 0, halfSize)
          ctx.fill()
          break
      }

      ctx.restore()
    }

    ctx.restore()
  }

  private drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, spikes: number, outerRadius: number, innerRadius: number) {
    let rot = Math.PI / 2 * 3
    const step = Math.PI / spikes

    ctx.beginPath()
    ctx.moveTo(x, y - outerRadius)

    for (let i = 0; i < spikes; i++) {
      const xOuter = x + Math.cos(rot) * outerRadius
      const yOuter = y + Math.sin(rot) * outerRadius
      ctx.lineTo(xOuter, yOuter)
      rot += step

      const xInner = x + Math.cos(rot) * innerRadius
      const yInner = y + Math.sin(rot) * innerRadius
      ctx.lineTo(xInner, yInner)
      rot += step
    }

    ctx.lineTo(x, y - outerRadius)
    ctx.closePath()
  }

  private drawHeart(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
    ctx.beginPath()
    const topCurveHeight = size * 0.3
    ctx.moveTo(x, y + topCurveHeight)
    
    // Left curve
    ctx.bezierCurveTo(
      x, y, 
      x - size / 2, y, 
      x - size / 2, y + topCurveHeight
    )
    
    ctx.bezierCurveTo(
      x - size / 2, y + (size + topCurveHeight) / 2, 
      x, y + (size + topCurveHeight) / 2, 
      x, y + size
    )
    
    ctx.bezierCurveTo(
      x, y + (size + topCurveHeight) / 2, 
      x + size / 2, y + (size + topCurveHeight) / 2, 
      x + size / 2, y + topCurveHeight
    )
    
    // Right curve
    ctx.bezierCurveTo(
      x + size / 2, y, 
      x, y, 
      x, y + topCurveHeight
    )
    
    ctx.closePath()
  }

  // 파티클 수 반환
  getParticleCount(): number {
    return this.particles.length
  }

  // 모든 파티클 제거
  clear() {
    this.particles = []
  }
}