'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { Player } from './Player';
import { PaintSystem } from './PaintSystem';
import { useInputManager } from './InputManager';

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
  const sceneRef = useRef<THREE.Scene>();
  const rendererRef = useRef<THREE.WebGLRenderer>();
  const cameraRef = useRef<THREE.PerspectiveCamera>();
  const animationIdRef = useRef<number>();
  const clockRef = useRef<THREE.Clock>();
  const lastFrameTimeRef = useRef<number>(0);

  const playerRef = useRef<Player>();
  const paintSystemRef = useRef<PaintSystem>();

  const [isInitialized, setIsInitialized] = useState(false);
  const [isGameActive, setIsGameActive] = useState(false);

  // 플레이어 이동 처리
  const handlePlayerMove = useCallback((direction: THREE.Vector3) => {
    if (playerRef.current) {
      const currentTime = performance.now();
      const deltaTime = Math.min((currentTime - lastFrameTimeRef.current) / 1000, 0.016); // 최대 60fps
      if (deltaTime > 0 && direction.length() > 0) {
        console.log('Moving player:', direction, 'deltaTime:', deltaTime);
        playerRef.current.move(direction, deltaTime);
        lastFrameTimeRef.current = currentTime;
      }
    }
  }, []);

  // 페인트 발사 처리
  const handleShoot = useCallback((isActive: boolean) => {
    if (!isActive || !playerRef.current || !paintSystemRef.current) return;

    const player = playerRef.current;
    const paintSystem = paintSystemRef.current;

    // 플레이어 앞 방향으로 페인트 발사
    const direction = new THREE.Vector3(0, 0, -1);
    direction.applyEuler(new THREE.Euler(0, player.state.rotation, 0));
    direction.y = 0.1; // 약간 위쪽으로

    const startPosition = player.state.position.clone();
    startPosition.y += 1; // 플레이어 높이만큼 위에서 발사

    paintSystem.shootPaint(startPosition, direction, player.state.color, player.state.id);
    player.shootPaint(direction);
  }, []);

  // 마우스 이동 처리 (카메라 회전)
  const handleMouseMove = useCallback((deltaX: number, deltaY: number) => {
    if (!cameraRef.current || !playerRef.current) return;

    const camera = cameraRef.current;
    const player = playerRef.current;

    // 마우스 감도
    const sensitivity = 0.002;

    // 플레이어 회전 (Y축)
    const newRotation = player.state.rotation - deltaX * sensitivity;
    player.updateRotation(newRotation);

    // 카메라 위치 업데이트 (플레이어 뒤에서 따라감)
    const offset = new THREE.Vector3(0, 3, 5);
    offset.applyEuler(new THREE.Euler(0, newRotation, 0));

    camera.position.copy(player.state.position).add(offset);
    camera.lookAt(player.state.position.clone().add(new THREE.Vector3(0, 1, 0)));
  }, []);

  // 재장전 처리
  const handleReload = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.restorePaint(50);
    }
  }, []);

  // 입력 관리자 설정
  const { requestPointerLock } = useInputManager({
    callbacks: {
      onMove: handlePlayerMove,
      onShoot: handleShoot,
      onMouseMove: handleMouseMove,
      onReload: handleReload,
    },
    isActive: isGameActive,
  });

  useEffect(() => {
    if (!mountRef.current) return;

    // Clock 생성
    clockRef.current = new THREE.Clock();
    lastFrameTimeRef.current = performance.now();

    // Scene 생성
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    sceneRef.current = scene;

    // Camera 생성
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.set(0, 5, 10);
    cameraRef.current = camera;

    // Renderer 생성
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    mountRef.current.appendChild(renderer.domElement);

    // 조명 설정
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(10, 10, 5);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    scene.add(directionalLight);

    // 바닥 생성
    const floorGeometry = new THREE.PlaneGeometry(20, 20);
    const floorMaterial = new THREE.MeshLambertMaterial({ color: 0xcccccc });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    scene.add(floor);

    // 페인트 시스템 초기화
    const paintSystem = new PaintSystem(scene);
    paintSystemRef.current = paintSystem;

    // 플레이어 생성
    const player = new Player(scene, 'player1', 0x4a90e2);
    player.updatePosition(new THREE.Vector3(0, 0, 0));
    playerRef.current = player;

    // 애니메이션 루프
    const animate = () => {
      animationIdRef.current = requestAnimationFrame(animate);

      const deltaTime = clockRef.current?.getDelta() || 0;

      // 페인트 시스템 업데이트
      paintSystem.update(deltaTime);

      renderer.render(scene, camera);
    };

    animate();
    setIsInitialized(true);

    // Cleanup
    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (mountRef.current && renderer.domElement) {
        mountRef.current.removeChild(renderer.domElement);
      }

      playerRef.current?.dispose();
      paintSystemRef.current?.dispose();
      renderer.dispose();
      scene.clear();
    };
  }, [width, height]);

  // 창 크기 변경 대응
  useEffect(() => {
    const handleResize = () => {
      if (!cameraRef.current || !rendererRef.current) return;

      const newWidth = mountRef.current?.clientWidth || width;
      const newHeight = mountRef.current?.clientHeight || height;

      cameraRef.current.aspect = newWidth / newHeight;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [width, height]);

  // 게임 시작/중지
  const toggleGame = () => {
    console.log('Toggle game clicked, current state:', isGameActive);
    if (!isGameActive) {
      console.log('Starting game, requesting pointer lock');
      requestPointerLock();
      setIsGameActive(true);
    } else {
      console.log('Stopping game');
      setIsGameActive(false);
    }
  };

  return (
    <div className={`game-canvas-container ${className}`}>
      <div
        ref={mountRef}
        style={{ width: '100%', height: '100%', minHeight: `${height}px` }}
        onClick={toggleGame}
      />

      {!isInitialized && (
        <div className="loading-overlay absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
          <div className="loading-text text-white text-xl">게임 엔진 로딩 중...</div>
        </div>
      )}

      {isInitialized && !isGameActive && (
        <div className="game-overlay absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 pointer-events-none">
          <div className="text-white text-center">
            <h2 className="text-2xl mb-4">PittuRu Paint Game</h2>
            <p className="mb-2">클릭하여 게임 시작</p>
            <div className="text-sm">
              <p>WASD: 이동</p>
              <p>마우스: 시점 회전</p>
              <p>클릭/스페이스: 페인트 발사</p>
              <p>R: 재장전</p>
            </div>
          </div>
        </div>
      )}

      {isGameActive && playerRef.current && (
        <div className="game-ui absolute top-4 left-4 text-white">
          <div className="bg-black bg-opacity-50 p-3 rounded">
            <div>체력: {playerRef.current.state.health}/100</div>
            <div>페인트: {playerRef.current.state.paintAmount}/100</div>
          </div>
        </div>
      )}
    </div>
  );
}