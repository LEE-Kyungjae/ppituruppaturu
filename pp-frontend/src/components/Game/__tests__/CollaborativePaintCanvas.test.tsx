import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import CollaborativePaintCanvas from '../CollaborativePaintCanvas'

// Mock the game engine
jest.mock('../../../lib/game-engine/CollaborativePaintEngine', () => {
  return jest.fn().mockImplementation(() => ({
    getPaintLevels: jest.fn(() => new Map([['#ff0000', 0.5]])),
    getTerritoryStats: jest.fn(() => [{ playerId: 'player1', territory: 0.3 }]),
    dispose: jest.fn(),
    clearCanvas: jest.fn(),
    enableGlitchEffect: jest.fn(),
    setNeonIntensity: jest.fn(),
    getPlayerColor: jest.fn(() => '#ff0000')
  }))
})

// Mock multiplayer hook
jest.mock('../../../lib/multiplayer/MultiplayerManager', () => ({
  useMultiplayer: () => ({
    isConnected: true,
    currentPlayer: { id: 'player1', name: 'Test Player' },
    currentRoom: {
      name: 'test-room',
      players: [{ id: 'player1', name: 'Test Player' }],
      maxPlayers: 4,
      gameMode: 'paint-battle',
      status: 'playing'
    }
  })
}))

// Mock performance monitor hook
jest.mock('../../../lib/monitoring/PerformanceMonitor', () => ({
  usePerformanceMonitor: () => ({
    metrics: {
      fps: 60,
      memoryUsage: 50.5
    }
  })
}))

describe('CollaborativePaintCanvas', () => {
  const defaultProps = {
    width: 800,
    height: 600,
    onTerritoryUpdate: jest.fn()
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders canvas with correct dimensions', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const canvas = screen.getByRole('img', { hidden: true }) // Canvas has img role
    expect(canvas).toHaveAttribute('width', '800')
    expect(canvas).toHaveAttribute('height', '600')
  })

  it('displays connection status', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    expect(screen.getByText('CONNECTED')).toBeInTheDocument()
  })

  it('displays room information', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    expect(screen.getByText('ROOM: test-room (1/4)')).toBeInTheDocument()
    expect(screen.getByText('paint-battle')).toBeInTheDocument()
    expect(screen.getByText('playing')).toBeInTheDocument()
  })

  it('displays performance metrics', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    expect(screen.getByText('FPS: 60')).toBeInTheDocument()
    expect(screen.getByText('MEM: 51MB')).toBeInTheDocument()
  })

  it('renders brush selector with all brush types', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    expect(screen.getByText('NEON')).toBeInTheDocument()
    expect(screen.getByText('GLOW')).toBeInTheDocument()
    expect(screen.getByText('SPARK')).toBeInTheDocument()
  })

  it('displays paint level meter', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    expect(screen.getByText('Paint Level')).toBeInTheDocument()
    expect(screen.getByText('50%')).toBeInTheDocument() // Based on mocked paint level
  })

  it('handles brush type changes', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const glowButton = screen.getByText('GLOW')
    fireEvent.click(glowButton)

    // Button should have active styling
    expect(glowButton.closest('button')).toHaveClass('bg-cyber-pink')
  })

  it('toggles glitch mode', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const glitchButton = screen.getByText('GLITCH OFF')
    fireEvent.click(glitchButton)

    expect(screen.getByText('GLITCH ON')).toBeInTheDocument()
  })

  it('adjusts neon intensity', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const increaseButton = screen.getByText('+')
    const decreaseButton = screen.getByText('-')

    fireEvent.click(increaseButton)
    fireEvent.click(decreaseButton)

    // Should not throw errors
    expect(increaseButton).toBeInTheDocument()
    expect(decreaseButton).toBeInTheDocument()
  })

  it('handles clear canvas', () => {
    const mockEngine = require('../../../lib/game-engine/CollaborativePaintEngine')
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const clearButton = screen.getByText('CLEAR CANVAS')
    fireEvent.click(clearButton)

    // Mock should be called
    expect(mockEngine().clearCanvas).toHaveBeenCalled()
  })

  it('calls onTerritoryUpdate callback', async () => {
    const onTerritoryUpdate = jest.fn()
    render(<CollaborativePaintCanvas {...defaultProps} onTerritoryUpdate={onTerritoryUpdate} />)

    // Wait for the interval to trigger
    await waitFor(() => {
      expect(onTerritoryUpdate).toHaveBeenCalledWith([
        { playerId: 'player1', territory: 0.3 }
      ])
    }, { timeout: 2000 })
  })

  it('applies custom className', () => {
    const { container } = render(
      <CollaborativePaintCanvas {...defaultProps} className="custom-class" />
    )

    expect(container.querySelector('.collaborative-paint-canvas')).toHaveClass('custom-class')
  })

  it('applies glitch effect styling when enabled', () => {
    render(<CollaborativePaintCanvas {...defaultProps} />)

    const glitchButton = screen.getByText('GLITCH OFF')
    fireEvent.click(glitchButton)

    const canvas = screen.getByRole('img', { hidden: true })
    expect(canvas).toHaveStyle('filter: hue-rotate(90deg) saturate(1.5)')
  })
})