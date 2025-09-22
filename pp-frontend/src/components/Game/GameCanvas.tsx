'use client';

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface GameCanvasProps {
  width?: number;
  height?: number;
  className?: string;
}

export default function GameCanvas({
  width = 800,
  height = 600,
  className = ''
}: GameCanvasProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isGameActive, setIsGameActive] = useState(false);

  useEffect(() => {
    if (!mountRef.current) return;

    console.log('Creating ultra-simple Three.js scene...');

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000); // 검은색 배경

    // Camera 생성
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5; // 카메라를 뒤로 5미터

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer();
    renderer.setSize(width, height);

    // 회전하는 큐브 (테스트용)
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    // 간단한 플레이어 큐브 추가 (WASD로 이동 가능)
    const playerGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    const playerMaterial = new THREE.MeshBasicMaterial({ color: 0x4a90e2 });
    const player = new THREE.Mesh(playerGeometry, playerMaterial);
    player.position.set(3, 1, 0); // 회전 큐브 옆에 배치
    scene.add(player);

    // 플레이어 닉네임을 위한 캔버스 텍스처 생성
    const createNameTexture = (name: string) => {
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      canvas.width = 512;
      canvas.height = 128;

      // 배경 (반투명 검은색)
      context.fillStyle = 'rgba(0, 0, 0, 0.7)';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // 텍스트
      context.fillStyle = 'white';
      context.font = 'bold 48px Arial';
      context.textAlign = 'center';
      context.textBaseline = 'middle';
      context.fillText(name, canvas.width / 2, canvas.height / 2);

      return new THREE.CanvasTexture(canvas);
    };

    // 사용자 닉네임 가져오기 (로컬스토리지에서)
    const getUserNickname = () => {
      try {
        const userData = localStorage.getItem('user');
        if (userData) {
          const user = JSON.parse(userData);
          return user.nickname || 'PittuRu Player';
        }
      } catch (error) {
        console.error('Failed to get user data:', error);
      }
      return 'PittuRu Player'; // 기본값
    };

    // 닉네임 표시 (플레이어 위에)
    const nameTexture = createNameTexture(getUserNickname());
    const nameMaterial = new THREE.MeshBasicMaterial({
      map: nameTexture,
      transparent: true,
      alphaTest: 0.1
    });
    const nameGeometry = new THREE.PlaneGeometry(1.5, 0.3);
    const nameTag = new THREE.Mesh(nameGeometry, nameMaterial);
    nameTag.position.set(0, 1.5, 0); // 플레이어 위 1.5미터 (더 가깝게)
    player.add(nameTag); // 플레이어에 부착해서 함께 움직임

    // 상대 캐릭터 생성 (더미 적)
    const enemyGeometry = new THREE.BoxGeometry(1, 2, 0.8);
    const enemyMaterial = new THREE.MeshBasicMaterial({ color: 0xff4444 }); // 빨간색
    const enemy = new THREE.Mesh(enemyGeometry, enemyMaterial);
    enemy.position.set(-3, 1, 0); // 플레이어 반대편에 배치
    scene.add(enemy);

    // 상대 캐릭터 닉네임
    const enemyNameTexture = createNameTexture('Enemy Bot');
    const enemyNameMaterial = new THREE.MeshBasicMaterial({
      map: enemyNameTexture,
      transparent: true,
      alphaTest: 0.1
    });
    const enemyNameGeometry = new THREE.PlaneGeometry(1.5, 0.3);
    const enemyNameTag = new THREE.Mesh(enemyNameGeometry, enemyNameMaterial);
    enemyNameTag.position.set(0, 1.5, 0);
    enemy.add(enemyNameTag);

    // 바닥 추가
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshBasicMaterial({ color: 0x666666 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    scene.add(floor);

    // 키 입력 상태
    const keys = {
      w: false, a: false, s: false, d: false
    };

    // 키 이벤트 리스너
    const onKeyDown = (event: KeyboardEvent) => {
      switch(event.code) {
        case 'KeyW': keys.w = true; break;
        case 'KeyA': keys.a = true; break;
        case 'KeyS': keys.s = true; break;
        case 'KeyD': keys.d = true; break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch(event.code) {
        case 'KeyW': keys.w = false; break;
        case 'KeyA': keys.a = false; break;
        case 'KeyS': keys.s = false; break;
        case 'KeyD': keys.d = false; break;
      }
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);

    // 페인트 투사체 시스템
    const paintProjectiles: Array<{
      mesh: THREE.Mesh;
      velocity: THREE.Vector3;
      gravity: number;
      lifetime: number;
      maxLifetime: number;
    }> = [];

    // 마우스 클릭으로 페인트 발사
    const onMouseClick = (event: MouseEvent) => {
      // 페인트 투사체 생성
      const projectileGeometry = new THREE.SphereGeometry(0.1, 8, 8);
      const projectileMaterial = new THREE.MeshBasicMaterial({ color: 0x00ffff }); // 청록색 페인트
      const projectile = new THREE.Mesh(projectileGeometry, projectileMaterial);

      // 플레이어 위치에서 시작 (어깨 높이)
      projectile.position.copy(player.position);
      projectile.position.y += 1.5;

      // 화면 중앙에서 레이캐스팅하여 발사 방향 계산
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2(0, 0); // 화면 중앙
      raycaster.setFromCamera(mouse, camera);

      // 발사 속도 설정 (포물선 궤적을 위해 위쪽 각도 추가)
      const direction = raycaster.ray.direction.clone();
      direction.y += 0.3; // 위쪽으로 약간 각도 추가
      direction.normalize();

      const velocity = direction.multiplyScalar(15); // 발사 속도

      scene.add(projectile);

      // 투사체 배열에 추가
      paintProjectiles.push({
        mesh: projectile,
        velocity: velocity,
        gravity: -20, // 중력 가속도
        lifetime: 0,
        maxLifetime: 5 // 5초 후 제거
      });

      console.log('Paint shot!', paintProjectiles.length);
    };

    document.addEventListener('click', onMouseClick);

    // Mount에 캔버스 추가
    mountRef.current.appendChild(renderer.domElement);

    console.log('Scene created with:', {
      sceneChildren: scene.children.length,
      cameraPosition: camera.position,
      rendererSize: renderer.getSize(new THREE.Vector2())
    });

    // 상대방 이동 패턴 변수
    let enemyTime = 0;

    // 애니메이션 루프 (큐브 회전 + 플레이어 이동 + 상대방 AI)
    const animate = () => {
      requestAnimationFrame(animate);
      enemyTime += 0.02;

      // 회전 큐브
      cube.rotation.x += 0.01;
      cube.rotation.y += 0.01;

      // 플레이어 이동 처리 (간단한 WASD)
      const moveSpeed = 0.1;
      if (keys.w) player.position.z -= moveSpeed;
      if (keys.s) player.position.z += moveSpeed;
      if (keys.a) player.position.x -= moveSpeed;
      if (keys.d) player.position.x += moveSpeed;

      // 상대방 자동 이동 (원형으로 돌아다님)
      enemy.position.x = Math.cos(enemyTime) * 4;
      enemy.position.z = Math.sin(enemyTime) * 3;

      // 페인트 투사체 업데이트 (포물선 궤적)
      const deltaTime = 0.016; // 약 60fps
      for (let i = paintProjectiles.length - 1; i >= 0; i--) {
        const projectile = paintProjectiles[i];

        // 물리 시뮬레이션
        projectile.velocity.y += projectile.gravity * deltaTime; // 중력 적용

        // 위치 업데이트
        projectile.mesh.position.add(
          projectile.velocity.clone().multiplyScalar(deltaTime)
        );

        // 생존 시간 업데이트
        projectile.lifetime += deltaTime;

        // 바닥에 닿거나 생존시간 초과시 제거
        if (projectile.mesh.position.y <= 0 || projectile.lifetime > projectile.maxLifetime) {
          // 바닥에 닿으면 페인트 스플래시 효과 (간단한 원형 데칼)
          if (projectile.mesh.position.y <= 0) {
            const splashGeometry = new THREE.CircleGeometry(0.5, 16);
            const splashMaterial = new THREE.MeshBasicMaterial({
              color: 0x00ffff,
              transparent: true,
              opacity: 0.7
            });
            const splash = new THREE.Mesh(splashGeometry, splashMaterial);
            splash.rotation.x = -Math.PI / 2; // 바닥에 평행하게
            splash.position.copy(projectile.mesh.position);
            splash.position.y = 0.01; // 바닥보다 약간 위에
            scene.add(splash);

            console.log('Paint splash created at:', splash.position);
          }

          // 투사체 제거
          scene.remove(projectile.mesh);
          projectile.mesh.geometry.dispose();
          (projectile.mesh.material as THREE.Material).dispose();
          paintProjectiles.splice(i, 1);
        }
      }

      // 카메라가 플레이어를 따라감 (3인칭 시점)
      camera.position.x = player.position.x;
      camera.position.y = player.position.y + 3;
      camera.position.z = player.position.z + 5;
      camera.lookAt(player.position);

      // 닉네임들이 항상 카메라를 향하도록 설정 (빌보드 효과)
      nameTag.lookAt(camera.position);
      enemyNameTag.lookAt(camera.position);

      renderer.render(scene, camera);
    };

    animate();

    // 정리
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.removeEventListener('keyup', onKeyUp);
      document.removeEventListener('click', onMouseClick);

      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      geometry.dispose();
      material.dispose();
      playerGeometry.dispose();
      playerMaterial.dispose();
      nameGeometry.dispose();
      nameMaterial.dispose();
      nameTexture.dispose();
      enemyGeometry.dispose();
      enemyMaterial.dispose();
      enemyNameGeometry.dispose();
      enemyNameMaterial.dispose();
      enemyNameTexture.dispose();
      floorGeometry.dispose();
      floorMaterial.dispose();
      renderer.dispose();
    };
  }, [width, height]);

  return (
    <div className={`game-canvas-container ${className}`} style={{
      position: 'relative',
      width: '100%',
      height: '100%'
    }}>
      <div
        ref={mountRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: `${height}px`
        }}
      />

      {/* 게임 조작법 */}
      <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white p-3 rounded text-sm">
        <div>WASD: 플레이어 이동</div>
        <div>마우스 클릭: 페인트 발사</div>
        <div>파란색 큐브: 플레이어</div>
        <div>빨간색 큐브: 상대방</div>
      </div>
    </div>
  );
}