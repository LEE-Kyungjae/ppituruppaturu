// frontend/src/components/ui/PointsDisplay.tsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface PointsDisplayProps {
  points: number
  showAnimation?: boolean
  size?: 'small' | 'medium' | 'large'
  variant?: 'default' | 'gold' | 'gradient'
  onPointsChange?: (newPoints: number) => void
}

interface PointsAnimation {
  id: string
  amount: number
  type: 'gain' | 'loss'
}

const PointsDisplay: React.FC<PointsDisplayProps> = ({
  points,
  showAnimation = true,
  size = 'medium',
  variant = 'default',
  onPointsChange
}) => {
  const [displayPoints, setDisplayPoints] = useState(points)
  const [animations, setAnimations] = useState<PointsAnimation[]>([])

  useEffect(() => {
    if (points !== displayPoints && showAnimation) {
      const difference = points - displayPoints
      const newAnimation: PointsAnimation = {
        id: Date.now().toString(),
        amount: Math.abs(difference),
        type: difference > 0 ? 'gain' : 'loss'
      }

      setAnimations(prev => [...prev, newAnimation])

      // 애니메이션 지속 시간 후 제거
      setTimeout(() => {
        setAnimations(prev => prev.filter(anim => anim.id !== newAnimation.id))
      }, 2000)

      // 숫자 카운팅 애니메이션
      const duration = 1000
      const steps = 30
      const stepValue = (points - displayPoints) / steps
      let currentStep = 0

      const interval = setInterval(() => {
        currentStep++
        if (currentStep >= steps) {
          setDisplayPoints(points)
          clearInterval(interval)
        } else {
          setDisplayPoints(prev => prev + stepValue)
        }
      }, duration / steps)
    } else {
      setDisplayPoints(points)
    }
  }, [points, displayPoints, showAnimation])

  const getSizeClasses = () => {
    switch (size) {
      case 'small':
        return 'text-lg px-3 py-1'
      case 'large':
        return 'text-3xl px-6 py-3'
      default:
        return 'text-xl px-4 py-2'
    }
  }

  const getVariantClasses = () => {
    switch (variant) {
      case 'gold':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900'
      case 'gradient':
        return 'bg-gradient-to-r from-purple-500 to-pink-500 text-white'
      default:
        return 'bg-gray-800 text-yellow-400 border border-yellow-500'
    }
  }

  return (
    <div className="relative inline-block">
      {/* 메인 포인트 디스플레이 */}
      <motion.div
        className={`
          inline-flex items-center gap-2 rounded-full font-bold
          ${getSizeClasses()} ${getVariantClasses()}
          shadow-lg backdrop-blur-sm
        `}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        whileHover={{ scale: 1.05 }}
      >
        {/* 코인 아이콘 */}
        <motion.span
          className="text-2xl"
          animate={{ rotate: [0, 360] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          🪙
        </motion.span>
        
        {/* 포인트 숫자 */}
        <span>
          {Math.floor(displayPoints).toLocaleString()}
        </span>
      </motion.div>

      {/* 포인트 변화 애니메이션 */}
      <AnimatePresence>
        {animations.map((animation) => (
          <motion.div
            key={animation.id}
            className={`
              absolute left-1/2 top-0 pointer-events-none font-bold text-lg
              ${animation.type === 'gain' ? 'text-green-400' : 'text-red-400'}
            `}
            initial={{ 
              opacity: 0, 
              y: 0, 
              x: '-50%',
              scale: 0.8 
            }}
            animate={{ 
              opacity: [0, 1, 1, 0], 
              y: -60, 
              scale: [0.8, 1.2, 1],
              rotate: animation.type === 'gain' ? [0, 10, -10, 0] : 0
            }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2, ease: "easeOut" }}
          >
            {animation.type === 'gain' ? '+' : '-'}{animation.amount.toLocaleString()}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* 포인트 펄스 효과 */}
      {showAnimation && (
        <motion.div
          className="absolute inset-0 rounded-full border-2 border-yellow-400 opacity-30"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.1, 0.3]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
      )}
    </div>
  )
}

export default PointsDisplay