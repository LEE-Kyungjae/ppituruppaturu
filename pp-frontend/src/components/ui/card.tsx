import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, type MotionProps } from "framer-motion"

const cardVariants = cva(
  "rounded-xl border bg-white text-gray-900 shadow-sm transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border shadow-md hover:shadow-lg",
        elevated: "shadow-lg hover:shadow-xl",
        outlined: "border-2 border-gray-300",
        ghost: "border-none shadow-none bg-transparent",
        
        // Gaming specific variants
        game: "game-card hover:shadow-glow",
        neon: "border-2 border-purple-500 shadow-lg bg-gradient-to-br from-white to-gray-100",
        glass: "glass border-white/20 backdrop-blur-md",
        "glass-dark": "glass-dark border-white/10 backdrop-blur-md",
        gold: "border-2 border-yellow-400 bg-gradient-to-br from-yellow-50 to-yellow-100 shadow-lg",
        silver: "border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-gray-100 shadow-lg",
        bronze: "border-2 border-orange-400 bg-gradient-to-br from-orange-50 to-orange-100 shadow-lg",
        winner: "border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-100 shadow-glow-success animate-pulse-slow",
        danger: "border-2 border-red-400 bg-gradient-to-br from-red-50 to-pink-100 shadow-glow-danger"
      },
      padding: {
        none: "p-0",
        sm: "p-3",
        default: "p-6",
        lg: "p-8",
        xl: "p-10"
      },
      interactive: {
        none: "",
        hover: "hover:scale-105 cursor-pointer",
        press: "hover:scale-105 active:scale-95 cursor-pointer",
        float: "hover:-translate-y-2 cursor-pointer",
        glow: "hover:shadow-glow cursor-pointer"
      }
    },
    defaultVariants: {
      variant: "default",
      padding: "default",
      interactive: "none"
    }
  }
)

type MotionDivProps = Omit<MotionProps, keyof React.HTMLAttributes<HTMLDivElement>> &
  Omit<React.HTMLAttributes<HTMLDivElement>, keyof MotionProps>

const Card = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> &
  VariantProps<typeof cardVariants> & {
    animate?: boolean
    animationDelay?: number
  }
>(({ className, variant, padding, interactive, animate = false, animationDelay = 0, children, ...props }, ref) => {
  if (animate) {
    return (
      <motion.div
        ref={ref}
        className={cn(cardVariants({ variant, padding, interactive }), className)}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: 0.5,
          delay: animationDelay,
          type: "spring",
          stiffness: 100
        }}
        whileHover={interactive !== "none" ? { scale: 1.02 } : {}}
        {...(props as MotionDivProps)}
      >
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={ref}
      className={cn(cardVariants({ variant, padding, interactive }), className)}
      {...props}
    >
      {children}
    </div>
  )
})
Card.displayName = "Card"

const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { centerAlign?: boolean }
>(({ className, centerAlign = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex flex-col space-y-1.5 p-6",
      centerAlign && "items-center text-center",
      className
    )}
    {...props}
  />
))
CardHeader.displayName = "CardHeader"

const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement> & {
    gradient?: boolean
    neon?: boolean
    level?: 1 | 2 | 3 | 4 | 5 | 6
  }
>(({ className, gradient = false, neon = false, level = 3, children, ...props }, ref) => {
  const Component = `h${level}` as keyof JSX.IntrinsicElements

  return (
    <Component
      ref={ref}
      className={cn(
        "font-semibold leading-none tracking-tight",
        {
          "text-3xl": level === 1,
          "text-2xl": level === 2,
          "text-xl": level === 3,
          "text-lg": level === 4,
          "text-base": level === 5,
          "text-sm": level === 6,
        },
        gradient && "gradient-text",
        neon && "neon-text text-primary",
        className
      )}
      {...props}
    >
      {children}
    </Component>
  )
})
CardTitle.displayName = "CardTitle"

const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement> & {
    muted?: boolean
  }
>(({ className, muted = true, ...props }, ref) => (
  <p
    ref={ref}
    className={cn(
      "text-sm leading-relaxed",
      muted && "text-muted-foreground",
      className
    )}
    {...props}
  />
))
CardDescription.displayName = "CardDescription"

const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    noPadding?: boolean
  }
>(({ className, noPadding = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(!noPadding && "p-6 pt-0", className)}
    {...props}
  />
))
CardContent.displayName = "CardContent"

const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    centerAlign?: boolean
    spaceBetween?: boolean
  }
>(({ className, centerAlign = false, spaceBetween = false, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "flex items-center p-6 pt-0",
      centerAlign && "justify-center",
      spaceBetween && "justify-between",
      className
    )}
    {...props}
  />
))
CardFooter.displayName = "CardFooter"

// Gaming specific card components
const GameCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & {
    rank?: "gold" | "silver" | "bronze" | "winner"
    score?: number
    level?: number
    animate?: boolean
  }
>(({ className, rank, score, level, animate = true, children, ...props }, ref) => {
  const getRankVariant = () => {
    switch (rank) {
      case "gold": return "gold"
      case "silver": return "silver" 
      case "bronze": return "bronze"
      case "winner": return "winner"
      default: return "game"
    }
  }

  return (
    <Card
      ref={ref}
      variant={getRankVariant()}
      interactive="hover"
      animate={animate}
      className={cn("relative overflow-hidden", className)}
      {...props}
    >
      {rank && (
        <div className="absolute top-2 right-2">
          <span className="level-badge">
            {rank === "winner" ? "🏆" : rank === "gold" ? "🥇" : rank === "silver" ? "🥈" : "🥉"}
            {rank.charAt(0).toUpperCase() + rank.slice(1)}
          </span>
        </div>
      )}
      {level && (
        <div className="absolute top-2 left-2">
          <span className="level-badge">
            Lv.{level}
          </span>
        </div>
      )}
      {children}
      {score !== undefined && (
        <div className="absolute bottom-2 right-2">
          <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-1 rounded-full">
            {score.toLocaleString()}점
          </span>
        </div>
      )}
    </Card>
  )
})
GameCard.displayName = "GameCard"

export { 
  Card, 
  CardHeader, 
  CardFooter, 
  CardTitle, 
  CardDescription, 
  CardContent,
  GameCard,
  cardVariants
}