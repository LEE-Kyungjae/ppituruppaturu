import * as THREE from 'three';

export interface PlayerState {
  id: string;
  position: THREE.Vector3;
  rotation: number;
  color: number;
  isMoving: boolean;
  health: number;
  paintAmount: number;
}

export class Player {
  public mesh: THREE.Group;
  public state: PlayerState;
  private bodyMesh: THREE.Mesh | null = null;
  private scene: THREE.Scene;

  constructor(scene: THREE.Scene, playerId: string, color: number = 0x4a90e2) {
    this.scene = scene;
    this.state = {
      id: playerId,
      position: new THREE.Vector3(0, 0, 0),
      rotation: 0,
      color: color,
      isMoving: false,
      health: 100,
      paintAmount: 100
    };

    this.mesh = new THREE.Group();
    this.createPlayerMesh();
    this.scene.add(this.mesh);

    console.log('Player created:', {
      playerId,
      position: this.state.position,
      meshPosition: this.mesh.position,
      meshVisible: this.mesh.visible,
      meshChildren: this.mesh.children.length
    });
  }

  private createPlayerMesh(): void {
    console.log('Creating player mesh with color:', this.state.color);

    // 플레이어 몸체 생성 (매우 안전한 Material)
    const bodyGeometry = new THREE.BoxGeometry(1.2, 2.0, 0.8); // 더 큰 크기
    const bodyMaterial = new THREE.MeshBasicMaterial();
    bodyMaterial.color.setHex(0x00ff00); // 밝은 초록색
    bodyMaterial.wireframe = false; // 일단 솔리드로
    bodyMaterial.transparent = false;
    bodyMaterial.needsUpdate = true;

    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 1.0; // 바닥에서 1미터 위
    this.bodyMesh.castShadow = false; // 그림자 비활성화
    this.mesh.add(this.bodyMesh);

    console.log('Body mesh created:', {
      position: this.bodyMesh.position,
      visible: this.bodyMesh.visible,
      material: this.bodyMesh.material,
      geometry: this.bodyMesh.geometry
    });

    // 간단한 머리 추가 (안전한 Material)
    const headGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.6);
    const headMaterial = new THREE.MeshBasicMaterial();
    headMaterial.color.setHex(0xffff00); // 노란색
    headMaterial.wireframe = false;
    headMaterial.transparent = false;
    headMaterial.needsUpdate = true;

    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = 2.3; // 몸체 위에
    headMesh.castShadow = false;
    this.mesh.add(headMesh);

    console.log('Head mesh added at:', headMesh.position);

    // 초기 위치 설정
    this.mesh.position.copy(this.state.position);
  }

  public updatePosition(newPosition: THREE.Vector3): void {
    this.state.position.copy(newPosition);
    this.mesh.position.copy(newPosition);
  }

  public updateRotation(newRotation: number): void {
    this.state.rotation = newRotation;
    this.mesh.rotation.y = newRotation;
  }

  public move(direction: THREE.Vector3, deltaTime: number): void {
    const speed = 3.0; // 초당 3 유닛
    const movement = direction.clone().multiplyScalar(speed * deltaTime);

    this.state.isMoving = direction.length() > 0;

    if (this.state.isMoving) {
      this.state.position.add(movement);
      this.mesh.position.copy(this.state.position);
    }
  }

  public shootPaint(direction: THREE.Vector3): void {
    if (this.state.paintAmount <= 0) return;

    // 페인트 소모
    this.state.paintAmount = Math.max(0, this.state.paintAmount - 5);

    // 무기 반동 애니메이션
    this.animateWeaponRecoil();

    // 페인트 발사 이벤트 (나중에 페인트 시스템에서 처리)
    this.onPaintShot?.(this.state.position.clone(), direction.clone(), this.state.color);
  }

  private animateWeaponRecoil(): void {
    // 무기가 없으므로 간단한 몸체 흔들림으로 대체
    if (!this.bodyMesh) return;

    const originalScale = this.bodyMesh.scale.clone();
    this.bodyMesh.scale.setScalar(0.9);

    setTimeout(() => {
      if (this.bodyMesh) {
        this.bodyMesh.scale.copy(originalScale);
      }
    }, 100);
  }

  public takeDamage(damage: number): boolean {
    this.state.health = Math.max(0, this.state.health - damage);

    // 데미지 시각 효과
    this.animateDamage();

    return this.state.health <= 0;
  }

  private animateDamage(): void {
    if (!this.bodyMesh) return;
    const material = this.bodyMesh.material;
    if (!(material instanceof THREE.MeshLambertMaterial)) return;

    const originalColor = material.color.clone();

    // 빨간색으로 깜빡임
    material.color.setHex(0xff0000);

    setTimeout(() => {
      if (this.bodyMesh && this.bodyMesh.material instanceof THREE.MeshLambertMaterial) {
        this.bodyMesh.material.color.copy(originalColor);
      }
    }, 200);
  }

  public restorePaint(amount: number): void {
    this.state.paintAmount = Math.min(100, this.state.paintAmount + amount);
  }

  public changeColor(newColor: number): void {
    this.state.color = newColor;
    if (this.bodyMesh && this.bodyMesh.material instanceof THREE.MeshBasicMaterial) {
      this.bodyMesh.material.color.setHex(newColor);
    }
  }

  public dispose(): void {
    this.scene.remove(this.mesh);

    // 메모리 정리
    this.mesh.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) {
          child.material.forEach(material => material.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
  }

  // 페인트 발사 콜백 (게임 시스템에서 설정)
  public onPaintShot?: (position: THREE.Vector3, direction: THREE.Vector3, color: number) => void;
}
