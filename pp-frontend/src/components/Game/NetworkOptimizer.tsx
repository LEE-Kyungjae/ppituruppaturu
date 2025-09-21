import * as THREE from 'three';

export interface NetworkState {
  ping: number;
  packetLoss: number;
  isStable: boolean;
}

export class NetworkOptimizer {
  private pingHistory: number[] = [];
  private lastPingTime: number = 0;
  private packetsSent: number = 0;
  private packetsReceived: number = 0;

  // 실무 해결책 3: 클라이언트 예측 버퍼
  private predictionBuffer: {
    position: THREE.Vector3;
    timestamp: number;
    sequence: number;
  }[] = [];

  private sequence: number = 0;

  constructor() {
    this.startPingMonitoring();
  }

  // 네트워크 상태 모니터링
  private startPingMonitoring(): void {
    setInterval(() => {
      this.measurePing();
    }, 1000);
  }

  private measurePing(): void {
    const startTime = performance.now();

    // 실제로는 서버에 ping 요청을 보내지만, 여기서는 시뮬레이션
    fetch('/api/health')
      .then(() => {
        const ping = performance.now() - startTime;
        this.addPingData(ping);
      })
      .catch(() => {
        // 네트워크 오류 시 높은 ping으로 처리
        this.addPingData(999);
      });
  }

  private addPingData(ping: number): void {
    this.pingHistory.push(ping);
    if (this.pingHistory.length > 10) {
      this.pingHistory.shift();
    }
  }

  public getNetworkState(): NetworkState {
    if (this.pingHistory.length === 0) {
      return { ping: 0, packetLoss: 0, isStable: false };
    }

    const avgPing = this.pingHistory.reduce((a, b) => a + b, 0) / this.pingHistory.length;
    const packetLoss = this.packetsSent > 0
      ? (this.packetsSent - this.packetsReceived) / this.packetsSent
      : 0;

    return {
      ping: avgPing,
      packetLoss,
      isStable: avgPing < 100 && packetLoss < 0.1
    };
  }

  // 실무 해결책 4: 적응형 업데이트 레이트
  public getOptimalUpdateRate(): number {
    const networkState = this.getNetworkState();

    if (networkState.ping < 50) {
      return 60; // 60fps 업데이트
    } else if (networkState.ping < 100) {
      return 30; // 30fps 업데이트
    } else {
      return 15; // 15fps 업데이트 (느린 네트워크)
    }
  }

  // 실무 해결책 5: 스무딩 인터폴레이션
  public smoothPosition(
    currentPos: THREE.Vector3,
    targetPos: THREE.Vector3,
    deltaTime: number
  ): THREE.Vector3 {
    const networkState = this.getNetworkState();

    // 네트워크 상태에 따른 스무딩 강도 조절
    let lerpFactor = 0.1; // 기본값

    if (!networkState.isStable) {
      lerpFactor = 0.05; // 불안정할 때 더 부드럽게
    }

    if (networkState.ping > 200) {
      lerpFactor = 0.02; // 매우 느린 네트워크에서는 극도로 부드럽게
    }

    // 거리 기반 조절 (멀리 떨어져 있으면 빠르게 보정)
    const distance = currentPos.distanceTo(targetPos);
    if (distance > 5) {
      lerpFactor = 0.5; // 큰 차이는 빠르게 보정
    }

    return currentPos.clone().lerp(targetPos, lerpFactor);
  }

  // 실무 해결책 6: 예측 롤백 시스템
  public addPrediction(position: THREE.Vector3): void {
    this.predictionBuffer.push({
      position: position.clone(),
      timestamp: performance.now(),
      sequence: this.sequence++
    });

    // 버퍼 크기 제한 (1초분)
    const cutoffTime = performance.now() - 1000;
    this.predictionBuffer = this.predictionBuffer.filter(
      entry => entry.timestamp > cutoffTime
    );
  }

  public reconcileWithServer(
    serverPosition: THREE.Vector3,
    serverTimestamp: number
  ): THREE.Vector3 | null {
    // 서버 위치와 가장 가까운 시간의 예측 찾기
    const closest = this.predictionBuffer.find(
      entry => Math.abs(entry.timestamp - serverTimestamp) < 50
    );

    if (!closest) return null;

    // 차이가 크면 서버 위치로 스냅, 작으면 보간
    const diff = closest.position.distanceTo(serverPosition);

    if (diff > 2) {
      // 큰 차이: 서버 위치로 강제 이동 (핵/치트 방지)
      return serverPosition.clone();
    } else if (diff > 0.1) {
      // 작은 차이: 부드럽게 보정
      return this.smoothPosition(closest.position, serverPosition, 0.016);
    }

    return null; // 차이가 없으면 보정하지 않음
  }

  public dispose(): void {
    this.predictionBuffer = [];
    this.pingHistory = [];
  }
}