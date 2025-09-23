import * as THREE from 'three';

export interface PaintSplat {
  id: string;
  position: THREE.Vector3;
  color: number;
  size: number;
  playerId: string;
  timestamp: number;
}

export interface PaintProjectile {
  id: string;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  color: number;
  playerId: string;
  mesh: THREE.Mesh;
  lifeTime: number;
  maxLifeTime: number;
}

export class PaintSystem {
  private scene: THREE.Scene;
  private paintMap!: Uint8Array;
  private paintTexture!: THREE.DataTexture;
  private paintMaterial!: THREE.MeshStandardMaterial;
  private paintPlane!: THREE.Mesh;
  private projectiles: Map<string, PaintProjectile> = new Map();
  private paintSplats: Map<string, PaintSplat> = new Map();

  private mapWidth = 512;
  private mapHeight = 512;
  private worldSize = 20; // 게임 월드 크기 (20x20)

  constructor(scene: THREE.Scene) {
    this.scene = scene;
    this.initializePaintSystem();
  }

  private initializePaintSystem(): void {
    // 페인트 맵 초기화 (RGBA 4채널)
    this.paintMap = new Uint8Array(this.mapWidth * this.mapHeight * 4);

    // 초기 흰색으로 채우기
    for (let i = 0; i < this.paintMap.length; i += 4) {
      this.paintMap[i] = 255;     // R
      this.paintMap[i + 1] = 255; // G
      this.paintMap[i + 2] = 255; // B
      this.paintMap[i + 3] = 255; // A
    }

    // 페인트 텍스처 생성
    this.paintTexture = new THREE.DataTexture(
      this.paintMap,
      this.mapWidth,
      this.mapHeight,
      THREE.RGBAFormat,
      THREE.UnsignedByteType
    );
    this.paintTexture.needsUpdate = true;

    // 페인트 평면 생성
    const planeGeometry = new THREE.PlaneGeometry(this.worldSize, this.worldSize);
    this.paintMaterial = new THREE.MeshStandardMaterial({
      map: this.paintTexture,
      transparent: true,
      roughness: 0.8,
      metalness: 0.0,
    });

    this.paintPlane = new THREE.Mesh(planeGeometry, this.paintMaterial);
    this.paintPlane.rotation.x = -Math.PI / 2;
    this.paintPlane.position.y = 0.01; // 바닥보다 살짝 위
    this.paintPlane.receiveShadow = false;

    this.scene.add(this.paintPlane);
  }

  public shootPaint(
    startPosition: THREE.Vector3,
    direction: THREE.Vector3,
    color: number,
    playerId: string
  ): string {
    const projectileId = `projectile_${Date.now()}_${Math.random()}`;

    // 페인트 발사체 생성 (더 시각적으로 개선)
    const geometry = new THREE.SphereGeometry(0.08, 12, 12);
    const material = new THREE.MeshStandardMaterial({
      color,
      transparent: true,
      opacity: 0.9,
      metalness: 0.2,
      roughness: 0.3,
      emissive: new THREE.Color(color),
      emissiveIntensity: 0.3,
    });
    const mesh = new THREE.Mesh(geometry, material);

    const projectile: PaintProjectile = {
      id: projectileId,
      position: startPosition.clone(),
      velocity: direction.clone().multiplyScalar(15), // 발사 속도
      color,
      playerId,
      mesh,
      lifeTime: 0,
      maxLifeTime: 2.0, // 2초 후 소멸
    };

    mesh.position.copy(projectile.position);
    this.scene.add(mesh);
    this.projectiles.set(projectileId, projectile);

    return projectileId;
  }

  public update(deltaTime: number): void {
    this.updateProjectiles(deltaTime);
    this.updatePaintTexture();
  }

  private updateProjectiles(deltaTime: number): void {
    const toRemove: string[] = [];

    this.projectiles.forEach((projectile) => {
      // 발사체 이동
      const movement = projectile.velocity.clone().multiplyScalar(deltaTime);
      projectile.position.add(movement);
      projectile.mesh.position.copy(projectile.position);

      // 중력 적용
      projectile.velocity.y -= 9.8 * deltaTime;

      // 수명 증가
      projectile.lifeTime += deltaTime;

      // 바닥 충돌 검사
      if (projectile.position.y <= 0) {
        this.createPaintSplat(projectile);
        toRemove.push(projectile.id);
      }
      // 수명 종료 검사
      else if (projectile.lifeTime >= projectile.maxLifeTime) {
        toRemove.push(projectile.id);
      }
      // 경계 밖으로 나간 경우
      else if (
        Math.abs(projectile.position.x) > this.worldSize / 2 ||
        Math.abs(projectile.position.z) > this.worldSize / 2
      ) {
        toRemove.push(projectile.id);
      }
    });

    // 제거할 발사체들 정리
    toRemove.forEach((id) => {
      const projectile = this.projectiles.get(id);
      if (projectile) {
        this.scene.remove(projectile.mesh);
        projectile.mesh.geometry.dispose();
        (projectile.mesh.material as THREE.Material).dispose();
        this.projectiles.delete(id);
      }
    });
  }

  private createPaintSplat(projectile: PaintProjectile): void {
    const splatId = `splat_${Date.now()}_${Math.random()}`;

    const splat: PaintSplat = {
      id: splatId,
      position: projectile.position.clone(),
      color: projectile.color,
      size: 1.0 + Math.random() * 0.5, // 랜덤 크기
      playerId: projectile.playerId,
      timestamp: Date.now(),
    };

    this.paintSplats.set(splatId, splat);
    this.paintToTexture(splat);
  }

  private paintToTexture(splat: PaintSplat): void {
    // 월드 좌표를 텍스처 좌표로 변환
    const textureX = Math.floor(
      ((splat.position.x + this.worldSize / 2) / this.worldSize) * this.mapWidth
    );
    const textureZ = Math.floor(
      ((splat.position.z + this.worldSize / 2) / this.worldSize) * this.mapHeight
    );

    const radius = Math.floor((splat.size / this.worldSize) * this.mapWidth);
    const color = new THREE.Color(splat.color);

    // 원형 브러시로 페인팅
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const distance = Math.sqrt(dx * dx + dz * dz);
        if (distance <= radius) {
          const x = textureX + dx;
          const z = textureZ + dz;

          if (x >= 0 && x < this.mapWidth && z >= 0 && z < this.mapHeight) {
            const index = (z * this.mapWidth + x) * 4;

            // 거리에 따른 알파 블렌딩
            const alpha = Math.max(0, 1 - (distance / radius));

            this.paintMap[index] = Math.floor(color.r * 255);     // R
            this.paintMap[index + 1] = Math.floor(color.g * 255); // G
            this.paintMap[index + 2] = Math.floor(color.b * 255); // B
            this.paintMap[index + 3] = Math.floor(alpha * 255);   // A
          }
        }
      }
    }

    this.paintTexture.needsUpdate = true;
  }

  private updatePaintTexture(): void {
    // 텍스처 업데이트는 paintToTexture에서 needsUpdate 플래그로 처리
  }

  public calculateTerritoryScore(): { [playerId: string]: number } {
    const scores: { [playerId: string]: number } = {};
    let totalPaintedPixels = 0;

    // 각 플레이어별 페인트된 픽셀 수 계산
    this.paintSplats.forEach((splat) => {
      // 각 스플랫의 면적 계산 (간단히 반지름의 제곱으로 계산)
      const area = Math.PI * splat.size * splat.size;
      const current = scores[splat.playerId] ?? 0;
      scores[splat.playerId] = current + area;
      totalPaintedPixels += area;
    });

    // 백분율로 변환
    Object.keys(scores).forEach((playerId) => {
      const value = scores[playerId] ?? 0;
      scores[playerId] = totalPaintedPixels > 0
        ? (value / totalPaintedPixels) * 100
        : 0;
    });

    return scores;
  }

  public clearPaint(): void {
    // 모든 페인트 제거
    this.paintSplats.clear();

    // 텍스처를 흰색으로 초기화
    for (let i = 0; i < this.paintMap.length; i += 4) {
      this.paintMap[i] = 255;     // R
      this.paintMap[i + 1] = 255; // G
      this.paintMap[i + 2] = 255; // B
      this.paintMap[i + 3] = 255; // A
    }

    this.paintTexture.needsUpdate = true;
  }

  public getPlayerPaintCount(playerId: string): number {
    let count = 0;
    this.paintSplats.forEach((splat) => {
      if (splat.playerId === playerId) {
        count++;
      }
    });
    return count;
  }

  public dispose(): void {
    // 모든 발사체 제거
    this.projectiles.forEach((projectile) => {
      this.scene.remove(projectile.mesh);
      projectile.mesh.geometry.dispose();
      (projectile.mesh.material as THREE.Material).dispose();
    });
    this.projectiles.clear();

    // 페인트 평면 제거
    this.scene.remove(this.paintPlane);
    this.paintPlane.geometry.dispose();
    this.paintMaterial.dispose();
    this.paintTexture.dispose();

    // 페인트 데이터 정리
    this.paintSplats.clear();
  }
}
