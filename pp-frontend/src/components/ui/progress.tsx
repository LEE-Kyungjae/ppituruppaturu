import * as React from "react"
import * as ProgressPrimitive from "@radix-ui/react-progress"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion } from "framer-motion"

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-muted",
        success: "bg-green-100 dark:bg-green-950",
        warning: "bg-yellow-100 dark:bg-yellow-950", 
        danger: "bg-red-100 dark:bg-red-950",
        info: "bg-blue-100 dark:bg-blue-950",
        
        // Gaming variants
        xp: "bg-gradient-to-r from-purple-200 to-blue-200 dark:from-purple-900 dark:to-blue-900",
        health: "bg-gradient-to-r from-red-200 to-pink-200 dark:from-red-900 dark:to-pink-900",
        mana: "bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900 dark:to-cyan-900",
        energy: "bg-gradient-to-r from-yellow-200 to-orange-200 dark:from-yellow-900 dark:to-orange-900",
        shield: "bg-gradient-to-r from-gray-200 to-slate-200 dark:from-gray-900 dark:to-slate-900"
      },
      size: {
        default: "h-2",
        sm: "h-1",
        lg: "h-3",
        xl: "h-4"
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
)

const progressFillVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      variant: {
        default: "bg-primary",
        success: "bg-green-500",
        warning: "bg-yellow-500",
        danger: "bg-red-500", 
        info: "bg-blue-500",
        
        // Gaming variants
        xp: "bg-gradient-to-r from-purple-500 to-blue-500 shadow-glow",
        health: "bg-gradient-to-r from-red-500 to-pink-500 shadow-glow-danger",
        mana: "bg-gradient-to-r from-blue-500 to-cyan-500 shadow-glow",
        energy: "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-glow-warning",
        shield: "bg-gradient-to-r from-gray-500 to-slate-500"
      }
    },
    defaultVariants: {
      variant: "default"
    }
  }
)

interface ProgressProps
  extends React.ComponentPropsWithoutRef<typeof ProgressPrimitive.Root>,
    VariantProps<typeof progressVariants> {
  value?: number
  max?: number
  showValue?: boolean
  showPercentage?: boolean
  animated?: boolean
  striped?: boolean
  pulse?: boolean
  label?: string
  fillVariant?: VariantProps<typeof progressFillVariants>["variant"]
}

const Progress = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  ProgressProps
>(({ 
  className, 
  variant, 
  size,
  fillVariant,
  value = 0, 
  max = 100,
  showValue = false,
  showPercentage = false,
  animated = false,
  striped = false,
  pulse = false,
  label,
  ...props 
}, ref) => {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const displayValue = Math.round(value)
  
  return (
    <div className="w-full space-y-2">
      {(label || showValue || showPercentage) && (
        <div className="flex items-center justify-between text-sm">
          {label && <span className="font-medium">{label}</span>}
          <div className="flex items-center gap-2">
            {showValue && (
              <span className="text-muted-foreground">
                {displayValue}/{max}
              </span>
            )}
            {showPercentage && (
              <span className="font-medium">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        </div>
      )}
      
      <ProgressPrimitive.Root
        ref={ref}
        className={cn(
          progressVariants({ variant, size }),
          pulse && "animate-pulse",
          className
        )}
        value={value}
        max={max}
        {...props}
      >
        <ProgressPrimitive.Indicator
          className={cn(
            progressFillVariants({ variant: fillVariant || variant }),
            striped && "bg-stripes",
            animated && "animate-pulse",
            "origin-left"
          )}
          style={{ 
            transform: `translateX(-${100 - percentage}%)`,
            transition: animated ? 'transform 0.5s ease-out' : undefined
          }}
        />
        
        {animated && (
          <motion.div
            className="absolute inset-0 bg-white/20 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{
              repeat: Infinity,
              duration: 1.5,
              ease: "easeInOut"
            }}
          />
        )}
      </ProgressPrimitive.Root>
    </div>
  )
})
Progress.displayName = ProgressPrimitive.Root.displayName

// Gaming specific progress components
const HealthBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, "variant" | "fillVariant">
>(({ label = "HP", ...props }, ref) => (
  <Progress
    ref={ref}
    variant="health"
    fillVariant="health"
    label={label}
    showValue
    animated
    {...props}
  />
))
HealthBar.displayName = "HealthBar"

const ManaBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, "variant" | "fillVariant">
>(({ label = "MP", ...props }, ref) => (
  <Progress
    ref={ref}
    variant="mana"
    fillVariant="mana"
    label={label}
    showValue
    animated
    {...props}
  />
))
ManaBar.displayName = "ManaBar"

const XPBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, "variant" | "fillVariant"> & {
    level?: number
    nextLevelXP?: number
  }
>(({ label, level, nextLevelXP, value = 0, max = 100, ...props }, ref) => (
  <Progress
    ref={ref}
    variant="xp"
    fillVariant="xp"
    label={label || `Level ${level || 1}`}
    value={value}
    max={nextLevelXP || max}
    showValue
    showPercentage
    animated
    pulse
    {...props}
  />
))
XPBar.displayName = "XPBar"

const EnergyBar = React.forwardRef<
  React.ElementRef<typeof ProgressPrimitive.Root>,
  Omit<ProgressProps, "variant" | "fillVariant">
>(({ label = "Energy", ...props }, ref) => (
  <Progress
    ref={ref}
    variant="energy"
    fillVariant="energy"
    label={label}
    showValue
    animated
    {...props}
  />
))
EnergyBar.displayName = "EnergyBar"

export { 
  Progress, 
  HealthBar, 
  ManaBar, 
  XPBar, 
  EnergyBar,
  progressVariants 
}