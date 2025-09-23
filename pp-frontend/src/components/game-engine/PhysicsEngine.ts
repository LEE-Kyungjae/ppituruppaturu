// 고급 물리 엔진 클래스
export interface Vector2D {
  x: number
  y: number
}

export interface PhysicsObject {
  id: string
  position: Vector2D
  velocity: Vector2D
  acceleration: Vector2D
  mass: number
  friction: number
  restitution: number // 반발 계수
  width: number
  height: number
  rotation: number
  angularVelocity: number
  isStatic: boolean
  shape: 'rectangle' | 'circle'
}

export interface Collision {
  objectA: PhysicsObject
  objectB: PhysicsObject
  normal: Vector2D
  penetration: number
  point: Vector2D
}

export class PhysicsEngine {
  private objects: PhysicsObject[] = []
  private gravity: Vector2D = { x: 0, y: 9.81 }
  private timeStep: number = 1/60
  private iterations: number = 10
  
  constructor() {}

  addObject(object: PhysicsObject) {
    this.objects.push(object)
  }

  removeObject(id: string) {
    this.objects = this.objects.filter(obj => obj.id !== id)
  }

  setGravity(gravity: Vector2D) {
    this.gravity = gravity
  }

  // 벡터 연산 유틸리티
  private vectorAdd(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x + b.x, y: a.y + b.y }
  }

  private vectorSubtract(a: Vector2D, b: Vector2D): Vector2D {
    return { x: a.x - b.x, y: a.y - b.y }
  }

  private vectorScale(v: Vector2D, scale: number): Vector2D {
    return { x: v.x * scale, y: v.y * scale }
  }

  private vectorLength(v: Vector2D): number {
    return Math.sqrt(v.x * v.x + v.y * v.y)
  }

  private vectorNormalize(v: Vector2D): Vector2D {
    const length = this.vectorLength(v)
    return length > 0 ? { x: v.x / length, y: v.y / length } : { x: 0, y: 0 }
  }

  private vectorDot(a: Vector2D, b: Vector2D): number {
    return a.x * b.x + a.y * b.y
  }

  // 충돌 감지
  private checkAABBCollision(a: PhysicsObject, b: PhysicsObject): Collision | null {
    const dx = Math.abs(a.position.x - b.position.x)
    const dy = Math.abs(a.position.y - b.position.y)
    
    const combinedHalfWidths = (a.width + b.width) / 2
    const combinedHalfHeights = (a.height + b.height) / 2

    if (dx < combinedHalfWidths && dy < combinedHalfHeights) {
      const overlapX = combinedHalfWidths - dx
      const overlapY = combinedHalfHeights - dy
      
      let normal: Vector2D
      let penetration: number
      
      if (overlapX < overlapY) {
        normal = a.position.x < b.position.x ? { x: -1, y: 0 } : { x: 1, y: 0 }
        penetration = overlapX
      } else {
        normal = a.position.y < b.position.y ? { x: 0, y: -1 } : { x: 0, y: 1 }
        penetration = overlapY
      }

      return {
        objectA: a,
        objectB: b,
        normal,
        penetration,
        point: { x: (a.position.x + b.position.x) / 2, y: (a.position.y + b.position.y) / 2 }
      }
    }

    return null
  }

  private checkCircleCollision(a: PhysicsObject, b: PhysicsObject): Collision | null {
    const distance = this.vectorSubtract(b.position, a.position)
    const distanceLength = this.vectorLength(distance)
    const radiusSum = (a.width + b.width) / 4 // assuming width as diameter
    
    if (distanceLength < radiusSum && distanceLength > 0) {
      const normal = this.vectorNormalize(distance)
      const penetration = radiusSum - distanceLength
      
      return {
        objectA: a,
        objectB: b,
        normal,
        penetration,
        point: this.vectorAdd(a.position, this.vectorScale(normal, a.width / 4))
      }
    }

    return null
  }

  // 충돌 해결
  private resolveCollision(collision: Collision) {
    const { objectA, objectB, normal, penetration } = collision
    
    if (objectA.isStatic && objectB.isStatic) return

    // 위치 보정
    const totalMass = objectA.mass + objectB.mass
    const percent = 0.8 // 보정 비율
    const slop = 0.01 // 허용 오차
    
    if (penetration > slop) {
      const correction = this.vectorScale(normal, percent * (penetration - slop) / totalMass)
      
      if (!objectA.isStatic) {
        objectA.position = this.vectorSubtract(objectA.position, this.vectorScale(correction, objectB.mass))
      }
      if (!objectB.isStatic) {
        objectB.position = this.vectorAdd(objectB.position, this.vectorScale(correction, objectA.mass))
      }
    }

    // 속도 해결
    const relativeVelocity = this.vectorSubtract(objectB.velocity, objectA.velocity)
    const separatingVelocity = this.vectorDot(relativeVelocity, normal)
    
    if (separatingVelocity > 0) return // 이미 분리되고 있음

    const restitution = Math.min(objectA.restitution, objectB.restitution)
    const impulseScalar = -(1 + restitution) * separatingVelocity / totalMass
    const impulse = this.vectorScale(normal, impulseScalar)

    if (!objectA.isStatic) {
      objectA.velocity = this.vectorSubtract(objectA.velocity, this.vectorScale(impulse, objectB.mass))
    }
    if (!objectB.isStatic) {
      objectB.velocity = this.vectorAdd(objectB.velocity, this.vectorScale(impulse, objectA.mass))
    }

    // 마찰력 적용
    const tangent = this.vectorSubtract(relativeVelocity, this.vectorScale(normal, separatingVelocity))
    const tangentLength = this.vectorLength(tangent)
    
    if (tangentLength > 0.001) {
      const unitTangent = this.vectorScale(tangent, 1 / tangentLength)
      const frictionMagnitude = -this.vectorDot(relativeVelocity, unitTangent) / totalMass
      const friction = Math.min(objectA.friction, objectB.friction)
      const frictionImpulse = this.vectorScale(unitTangent, frictionMagnitude * friction)

      if (!objectA.isStatic) {
        objectA.velocity = this.vectorSubtract(objectA.velocity, this.vectorScale(frictionImpulse, objectB.mass))
      }
      if (!objectB.isStatic) {
        objectB.velocity = this.vectorAdd(objectB.velocity, this.vectorScale(frictionImpulse, objectA.mass))
      }
    }
  }

  // 물리 시뮬레이션 스텝
  step() {
    // 힘 적용 (중력)
    for (const object of this.objects) {
      if (!object.isStatic) {
        object.acceleration = this.vectorAdd(object.acceleration, this.gravity)
      }
    }

    // 속도 및 위치 업데이트
    for (const object of this.objects) {
      if (!object.isStatic) {
        object.velocity = this.vectorAdd(object.velocity, this.vectorScale(object.acceleration, this.timeStep))
        object.position = this.vectorAdd(object.position, this.vectorScale(object.velocity, this.timeStep))
        
        // 회전 업데이트
        object.rotation += object.angularVelocity * this.timeStep
        
        // 가속도 리셋
        object.acceleration = { x: 0, y: 0 }
      }
    }

    // 충돌 감지 및 해결
    const collisions: Collision[] = []
    
    for (let i = 0; i < this.objects.length; i++) {
      for (let j = i + 1; j < this.objects.length; j++) {
        const objectA = this.objects[i]
        const objectB = this.objects[j]
        if (!objectA || !objectB) {
          continue
        }
        
        let collision: Collision | null = null
        
        if (objectA.shape === 'rectangle' && objectB.shape === 'rectangle') {
          collision = this.checkAABBCollision(objectA, objectB)
        } else if (objectA.shape === 'circle' && objectB.shape === 'circle') {
          collision = this.checkCircleCollision(objectA, objectB)
        }
        
        if (collision) {
          collisions.push(collision)
        }
      }
    }

    // 충돌 해결 반복
    for (let i = 0; i < this.iterations; i++) {
      for (const collision of collisions) {
        this.resolveCollision(collision)
      }
    }

    return collisions
  }

  // 오브젝트 검색
  getObject(id: string): PhysicsObject | undefined {
    return this.objects.find(obj => obj.id === id)
  }

  getAllObjects(): PhysicsObject[] {
    return [...this.objects]
  }

  // 힘 적용
  applyForce(objectId: string, force: Vector2D) {
    const object = this.getObject(objectId)
    if (object && !object.isStatic) {
      const acceleration = this.vectorScale(force, 1 / object.mass)
      object.acceleration = this.vectorAdd(object.acceleration, acceleration)
    }
  }

  // 충격 적용
  applyImpulse(objectId: string, impulse: Vector2D) {
    const object = this.getObject(objectId)
    if (object && !object.isStatic) {
      const deltaVelocity = this.vectorScale(impulse, 1 / object.mass)
      object.velocity = this.vectorAdd(object.velocity, deltaVelocity)
    }
  }

  // 토크 적용
  applyTorque(objectId: string, torque: number) {
    const object = this.getObject(objectId)
    if (object && !object.isStatic) {
      // 간단한 관성 모멘트 계산 (직사각형)
      const momentOfInertia = (object.mass * (object.width * object.width + object.height * object.height)) / 12
      object.angularVelocity += torque / momentOfInertia * this.timeStep
    }
  }

  // 경계 검사
  checkBounds(width: number, height: number) {
    for (const object of this.objects) {
      if (!object.isStatic) {
        if (object.position.x < object.width / 2) {
          object.position.x = object.width / 2
          object.velocity.x = Math.abs(object.velocity.x) * object.restitution
        }
        if (object.position.x > width - object.width / 2) {
          object.position.x = width - object.width / 2
          object.velocity.x = -Math.abs(object.velocity.x) * object.restitution
        }
        if (object.position.y < object.height / 2) {
          object.position.y = object.height / 2
          object.velocity.y = Math.abs(object.velocity.y) * object.restitution
        }
        if (object.position.y > height - object.height / 2) {
          object.position.y = height - object.height / 2
          object.velocity.y = -Math.abs(object.velocity.y) * object.restitution
        }
      }
    }
  }
}
