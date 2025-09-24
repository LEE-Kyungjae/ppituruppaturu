import React, { useEffect, useRef } from 'react'

type TerritoryStats = Array<{
  teamId: string
  coverage: number
}>

type CollaborativePaintCanvasProps = {
  width?: number
  height?: number
  className?: string
  onTerritoryUpdate?: (stats: TerritoryStats) => void
}

const CollaborativePaintCanvas: React.FC<CollaborativePaintCanvasProps> = ({
  width = 800,
  height = 600,
  className,
  onTerritoryUpdate,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#22d3ee33')
    gradient.addColorStop(1, '#a855f733')

    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)

    ctx.fillStyle = '#e2e8f0'
    ctx.font = '20px var(--font-sans, sans-serif)'
    ctx.textAlign = 'center'
    ctx.fillText('삐뚜루빠뚜루 협동 페인트 캔버스', width / 2, height / 2 - 18)
    ctx.font = '16px var(--font-sans, sans-serif)'
    ctx.fillText('실제 멀티 플레이 캔버스 구현 전까지 임시 화면입니다.', width / 2, height / 2 + 10)

    onTerritoryUpdate?.([
      { teamId: 'player', coverage: 50 },
      { teamId: 'ai', coverage: 50 },
    ])
  }, [height, width, onTerritoryUpdate])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      role="img"
      aria-label="협동 페인트 게임 미리보기"
      className={className}
      style={{
        borderRadius: 12,
        border: '1px solid rgba(148, 163, 184, 0.35)',
        background: '#0f172a',
      }}
    />
  )
}

export default CollaborativePaintCanvas
