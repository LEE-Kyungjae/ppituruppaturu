import React from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import PerformanceMonitor from '../PerformanceMonitor'

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Reset performance mock
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        memory: {
          usedJSHeapSize: 52428800, // 50MB in bytes
          totalJSHeapSize: 104857600, // 100MB in bytes
          jsHeapSizeLimit: 209715200, // 200MB in bytes
        }
      },
      writable: true,
    })
  })

  it('renders performance metrics', () => {
    render(<PerformanceMonitor />)

    expect(screen.getByText(/FPS:/)).toBeInTheDocument()
    expect(screen.getByText(/Memory:/)).toBeInTheDocument()
    expect(screen.getByText(/Render:/)).toBeInTheDocument()
  })

  it('displays default FPS value', () => {
    render(<PerformanceMonitor />)

    expect(screen.getByText('FPS: 60')).toBeInTheDocument()
  })

  it('updates memory usage when performance.memory is available', async () => {
    render(<PerformanceMonitor />)

    await waitFor(() => {
      expect(screen.getByText('Memory: 50.0MB')).toBeInTheDocument()
    }, { timeout: 2000 })
  })

  it('displays zero render time initially', () => {
    render(<PerformanceMonitor />)

    expect(screen.getByText('Render: 0.0ms')).toBeInTheDocument()
  })

  it('sets up PerformanceObserver correctly', () => {
    render(<PerformanceMonitor />)

    expect(global.PerformanceObserver).toHaveBeenCalledWith(expect.any(Function))

    const mockObserver = (global.PerformanceObserver as jest.Mock).mock.results[0].value
    expect(mockObserver.observe).toHaveBeenCalledWith({ entryTypes: ['measure'] })
  })

  it('handles PerformanceObserver entries', () => {
    const mockEntries = [
      {
        entryType: 'measure',
        duration: 16.5,
        name: 'test-measure'
      }
    ]

    const mockObserverCallback = jest.fn()
    ;(global.PerformanceObserver as jest.Mock).mockImplementation((callback) => {
      mockObserverCallback.mockImplementation(callback)
      return {
        observe: jest.fn(() => {
          // Simulate observer callback
          callback({ getEntries: () => mockEntries })
        }),
        disconnect: jest.fn()
      }
    })

    render(<PerformanceMonitor />)

    // The callback should have been called with the mock entries
    expect(mockObserverCallback).toHaveBeenCalled()
  })

  it('cleans up on unmount', () => {
    const mockDisconnect = jest.fn()
    const mockClearInterval = jest.spyOn(global, 'clearInterval')

    ;(global.PerformanceObserver as jest.Mock).mockImplementation(() => ({
      observe: jest.fn(),
      disconnect: mockDisconnect
    }))

    const { unmount } = render(<PerformanceMonitor />)
    unmount()

    expect(mockDisconnect).toHaveBeenCalled()
    expect(mockClearInterval).toHaveBeenCalled()
  })

  it('handles missing performance.memory gracefully', () => {
    // Remove memory from performance object
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        // No memory property
      },
      writable: true,
    })

    const { unmount } = render(<PerformanceMonitor />)

    // Should not crash and should still show initial memory value
    expect(screen.getByText('Memory: 0.0MB')).toBeInTheDocument()

    // Should clean up properly
    unmount()
  })

  it('applies correct CSS classes', () => {
    const { container } = render(<PerformanceMonitor />)

    const performanceMonitor = container.querySelector('.performance-monitor')
    expect(performanceMonitor).toBeInTheDocument()

    const metrics = container.querySelectorAll('.metric')
    expect(metrics).toHaveLength(3) // FPS, Memory, Render
  })

  it('updates memory at regular intervals', async () => {
    jest.useFakeTimers()

    let memoryUpdateCount = 0
    Object.defineProperty(window, 'performance', {
      value: {
        now: jest.fn(() => Date.now()),
        mark: jest.fn(),
        measure: jest.fn(),
        memory: {
          get usedJSHeapSize() {
            memoryUpdateCount++
            return 52428800 * memoryUpdateCount // Increasing memory usage
          },
          totalJSHeapSize: 104857600,
          jsHeapSizeLimit: 209715200,
        }
      },
      writable: true,
    })

    render(<PerformanceMonitor />)

    // Fast-forward time to trigger interval
    jest.advanceTimersByTime(1000)

    await waitFor(() => {
      expect(screen.getByText(/Memory: \d+\.\dMB/)).toBeInTheDocument()
    })

    jest.useRealTimers()
  })
})