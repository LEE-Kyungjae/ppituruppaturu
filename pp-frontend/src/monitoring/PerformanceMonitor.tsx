import React, { useEffect, useState } from 'react';

interface PerformanceMetrics {
  fps: number;
  memory: number;
  renderTime: number;
  loadTime: number;
}

export default function PerformanceMonitor() {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memory: 0,
    renderTime: 0,
    loadTime: 0
  });

  useEffect(() => {
    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      for (const entry of entries) {
        if (entry.entryType === 'measure') {
          setMetrics(prev => ({
            ...prev,
            renderTime: entry.duration
          }));
        }
      }
    });

    observer.observe({ entryTypes: ['measure'] });

    // Monitor memory usage if available
    if ('memory' in performance) {
      const updateMemory = () => {
        setMetrics(prev => ({
          ...prev,
          memory: (performance as any).memory.usedJSHeapSize / (1024 * 1024) // MB
        }));
      };

      const interval = setInterval(updateMemory, 1000);
      return () => {
        clearInterval(interval);
        observer.disconnect();
      };
    }

    return () => observer.disconnect();
  }, []);

  return (
    <div className="performance-monitor">
      <div className="metric">
        <span>FPS: {metrics.fps}</span>
      </div>
      <div className="metric">
        <span>Memory: {metrics.memory.toFixed(1)}MB</span>
      </div>
      <div className="metric">
        <span>Render: {metrics.renderTime.toFixed(1)}ms</span>
      </div>
    </div>
  );
}