import { useEffect, useRef, useCallback } from 'react';
import * as THREE from 'three';

export interface InputState {
  keys: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    shoot: boolean;
    reload: boolean;
  };
  mouse: {
    x: number;
    y: number;
    isDown: boolean;
    deltaX: number;
    deltaY: number;
  };
  touch: {
    isActive: boolean;
    startX: number;
    startY: number;
    currentX: number;
    currentY: number;
  };
}

export interface InputCallbacks {
  onMove?: (direction: THREE.Vector3) => void;
  onShoot?: (isActive: boolean) => void;
  onMouseMove?: (deltaX: number, deltaY: number) => void;
  onReload?: () => void;
}

interface InputManagerProps {
  callbacks: InputCallbacks;
  isActive?: boolean;
}

export function useInputManager({ callbacks, isActive = true }: InputManagerProps) {
  const inputStateRef = useRef<InputState>({
    keys: {
      forward: false,
      backward: false,
      left: false,
      right: false,
      shoot: false,
      reload: false,
    },
    mouse: {
      x: 0,
      y: 0,
      isDown: false,
      deltaX: 0,
      deltaY: 0,
    },
    touch: {
      isActive: false,
      startX: 0,
      startY: 0,
      currentX: 0,
      currentY: 0,
    },
  });

  // 키 매핑
  const keyMap = {
    KeyW: 'forward',
    KeyS: 'backward',
    KeyA: 'left',
    KeyD: 'right',
    ArrowUp: 'forward',
    ArrowDown: 'backward',
    ArrowLeft: 'left',
    ArrowRight: 'right',
    Space: 'shoot',
    KeyR: 'reload',
  } as const;

  // 키보드 이벤트 처리
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const keyName = keyMap[event.code as keyof typeof keyMap];
    if (keyName) {
      event.preventDefault();

      const wasPressed = inputStateRef.current.keys[keyName];
      inputStateRef.current.keys[keyName] = true;

      // 키가 새로 눌렸을 때만 콜백 호출
      if (!wasPressed) {
        if (keyName === 'shoot') {
          callbacks.onShoot?.(true);
        } else if (keyName === 'reload') {
          callbacks.onReload?.();
        }
      }
    }
  }, [isActive, callbacks]);

  const handleKeyUp = useCallback((event: KeyboardEvent) => {
    if (!isActive) return;

    const keyName = keyMap[event.code as keyof typeof keyMap];
    if (keyName) {
      event.preventDefault();
      inputStateRef.current.keys[keyName] = false;

      if (keyName === 'shoot') {
        callbacks.onShoot?.(false);
      }
    }
  }, [isActive, callbacks]);

  // 마우스 이벤트 처리
  const handleMouseMove = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    const deltaX = event.movementX || 0;
    const deltaY = event.movementY || 0;

    inputStateRef.current.mouse.deltaX = deltaX;
    inputStateRef.current.mouse.deltaY = deltaY;
    inputStateRef.current.mouse.x = event.clientX;
    inputStateRef.current.mouse.y = event.clientY;

    callbacks.onMouseMove?.(deltaX, deltaY);
  }, [isActive, callbacks]);

  const handleMouseDown = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    if (event.button === 0) { // 좌클릭
      inputStateRef.current.mouse.isDown = true;
      callbacks.onShoot?.(true);
    }
  }, [isActive, callbacks]);

  const handleMouseUp = useCallback((event: MouseEvent) => {
    if (!isActive) return;

    if (event.button === 0) { // 좌클릭
      inputStateRef.current.mouse.isDown = false;
      callbacks.onShoot?.(false);
    }
  }, [isActive, callbacks]);

  // 터치 이벤트 처리 (모바일)
  const handleTouchStart = useCallback((event: TouchEvent) => {
    if (!isActive || event.touches.length === 0) return;

    const touch = event.touches[0];
    inputStateRef.current.touch = {
      isActive: true,
      startX: touch.clientX,
      startY: touch.clientY,
      currentX: touch.clientX,
      currentY: touch.clientY,
    };

    callbacks.onShoot?.(true);
  }, [isActive, callbacks]);

  const handleTouchMove = useCallback((event: TouchEvent) => {
    if (!isActive || !inputStateRef.current.touch.isActive || event.touches.length === 0) return;

    event.preventDefault();
    const touch = event.touches[0];

    inputStateRef.current.touch.currentX = touch.clientX;
    inputStateRef.current.touch.currentY = touch.clientY;

    // 터치 이동 델타 계산
    const deltaX = touch.clientX - inputStateRef.current.touch.startX;
    const deltaY = touch.clientY - inputStateRef.current.touch.startY;

    callbacks.onMouseMove?.(deltaX * 0.1, deltaY * 0.1);
  }, [isActive, callbacks]);

  const handleTouchEnd = useCallback((event: TouchEvent) => {
    if (!isActive) return;

    inputStateRef.current.touch.isActive = false;
    callbacks.onShoot?.(false);
  }, [isActive, callbacks]);

  // 이동 방향 계산 및 콜백 호출
  const updateMovement = useCallback(() => {
    if (!isActive) return;

    const { keys } = inputStateRef.current;
    const direction = new THREE.Vector3(0, 0, 0);

    if (keys.forward) direction.z -= 1;
    if (keys.backward) direction.z += 1;
    if (keys.left) direction.x -= 1;
    if (keys.right) direction.x += 1;

    // 대각선 이동 시 속도 정규화
    if (direction.length() > 1) {
      direction.normalize();
    }

    // 디버깅: 키 상태와 방향 출력 (이동이 있을 때만)
    // if (direction.length() > 0) {
    //   console.log('Keys:', keys, 'Direction:', direction);
    // }

    callbacks.onMove?.(direction);
  }, [isActive, callbacks]);

  // 이벤트 리스너 등록
  useEffect(() => {
    if (!isActive) return;

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('keyup', handleKeyUp);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    // 애니메이션 프레임마다 이동 업데이트
    let animationId: number;
    const updateLoop = () => {
      updateMovement();
      animationId = requestAnimationFrame(updateLoop);
    };
    updateLoop();

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);

      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [
    isActive,
    handleKeyDown,
    handleKeyUp,
    handleMouseMove,
    handleMouseDown,
    handleMouseUp,
    handleTouchStart,
    handleTouchMove,
    handleTouchEnd,
    updateMovement,
  ]);

  // 포인터 락 요청 (마우스 이동 제한 해제)
  const requestPointerLock = useCallback(() => {
    if (document.body.requestPointerLock) {
      document.body.requestPointerLock();
    }
  }, []);

  // 포인터 락 해제
  const exitPointerLock = useCallback(() => {
    if (document.exitPointerLock) {
      document.exitPointerLock();
    }
  }, []);

  return {
    inputState: inputStateRef.current,
    requestPointerLock,
    exitPointerLock,
  };
}