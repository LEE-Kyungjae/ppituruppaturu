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
  private bodyMesh: THREE.Mesh;
  private weaponMesh: THREE.Mesh;
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
  }

  private createPlayerMesh(): void {
    // 플레이어 몸체 생성 (캡슐 형태)
    const bodyGeometry = new THREE.CapsuleGeometry(0.3, 0.8, 4, 8);
    const bodyMaterial = new THREE.MeshLambertMaterial({ color: this.state.color });
    this.bodyMesh = new THREE.Mesh(bodyGeometry, bodyMaterial);
    this.bodyMesh.position.y = 0.4;
    this.bodyMesh.castShadow = true;
    this.mesh.add(this.bodyMesh);

    // 플레이어 머리 생성
    const headGeometry = new THREE.SphereGeometry(0.2, 8, 8);
    const headMaterial = new THREE.MeshLambertMaterial({ color: this.state.color });
    const headMesh = new THREE.Mesh(headGeometry, headMaterial);
    headMesh.position.y = 0.9;
    headMesh.castShadow = true;
    this.mesh.add(headMesh);

    // 무기 생성 (페인트 건)
    const weaponGeometry = new THREE.CylinderGeometry(0.05, 0.08, 0.6, 8);
    const weaponMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
    this.weaponMesh = new THREE.Mesh(weaponGeometry, weaponMaterial);
    this.weaponMesh.position.set(0.2, 0.6, 0.1);
    this.weaponMesh.rotation.z = Math.PI / 6;
    this.weaponMesh.castShadow = true;
    this.mesh.add(this.weaponMesh);

    // 발 생성
    const footGeometry = new THREE.BoxGeometry(0.15, 0.1, 0.3);
    const footMaterial = new THREE.MeshLambertMaterial({ color: 0x222222 });

    const leftFoot = new THREE.Mesh(footGeometry, footMaterial);
    leftFoot.position.set(-0.1, 0.05, 0);
    leftFoot.castShadow = true;
    this.mesh.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeometry, footMaterial);
    rightFoot.position.set(0.1, 0.05, 0);
    rightFoot.castShadow = true;
    this.mesh.add(rightFoot);

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

      // 이동 방향으로 회전
      if (direction.length() > 0) {
        const targetRotation = Math.atan2(direction.x, direction.z);
        this.updateRotation(targetRotation);
      }
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
    const originalRotation = this.weaponMesh.rotation.z;
    const recoilRotation = originalRotation + 0.2;

    // 간단한 반동 애니메이션
    this.weaponMesh.rotation.z = recoilRotation;

    setTimeout(() => {
      this.weaponMesh.rotation.z = originalRotation;
    }, 100);
  }

  public takeDamage(damage: number): boolean {
    this.state.health = Math.max(0, this.state.health - damage);

    // 데미지 시각 효과
    this.animateDamage();

    return this.state.health <= 0;
  }

  private animateDamage(): void {
    if (!(this.bodyMesh.material instanceof THREE.MeshLambertMaterial)) return;

    const originalColor = this.bodyMesh.material.color.clone();

    // 빨간색으로 깜빡임
    this.bodyMesh.material.color.setHex(0xff0000);

    setTimeout(() => {
      if (this.bodyMesh.material instanceof THREE.MeshLambertMaterial) {
        this.bodyMesh.material.color.copy(originalColor);
      }
    }, 200);
  }

  public restorePaint(amount: number): void {
    this.state.paintAmount = Math.min(100, this.state.paintAmount + amount);
  }

  public changeColor(newColor: number): void {
    this.state.color = newColor;
    if (this.bodyMesh.material instanceof THREE.MeshLambertMaterial) {
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