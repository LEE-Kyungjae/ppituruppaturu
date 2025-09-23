import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"
import { motion, type MotionProps } from "framer-motion"

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-lg text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg",
        destructive: "bg-red-600 text-white hover:bg-red-700 shadow-lg",
        outline: "border border-gray-300 bg-white hover:bg-gray-100 hover:text-gray-900",
        secondary: "bg-gray-600 text-white hover:bg-gray-700",
        ghost: "hover:bg-gray-100 hover:text-gray-900",
        link: "text-blue-600 underline-offset-4 hover:underline",
        
        // Gaming specific variants
        neon: "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-glow hover:from-purple-400 hover:to-pink-400 hover:scale-105 transform",
        gold: "bg-gradient-to-r from-yellow-400 to-yellow-600 text-black shadow-md hover:from-yellow-300 hover:to-yellow-500 hover:shadow-lg font-bold",
        silver: "bg-gradient-to-r from-gray-300 to-gray-500 text-white shadow-md hover:from-gray-200 hover:to-gray-400",
        bronze: "bg-gradient-to-r from-orange-400 to-orange-600 text-white shadow-md hover:from-orange-300 hover:to-orange-500",
        game: "bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white shadow-glow hover:scale-105 transform neon-text",
        victory: "bg-gradient-to-r from-green-400 to-emerald-500 text-white shadow-glow-success hover:from-green-300 hover:to-emerald-400 animate-pulse",
        danger: "bg-gradient-to-r from-red-500 to-pink-500 text-white shadow-glow-danger hover:from-red-400 hover:to-pink-400 hover:animate-shake"
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-8 text-base",
        xl: "h-14 rounded-xl px-10 text-lg",
        icon: "h-10 w-10",
        "icon-sm": "h-8 w-8",
        "icon-lg": "h-12 w-12"
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  leftIcon?: React.ReactNode
  rightIcon?: React.ReactNode
  animate?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}

type MotionButtonProps = Omit<MotionProps, keyof React.ButtonHTMLAttributes<HTMLButtonElement>> &
  Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, keyof MotionProps>

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    asChild = false, 
    loading = false,
    leftIcon,
    rightIcon,
    animate = false,
    children,
    disabled,
    ...props 
  }, ref) => {
    const Comp = asChild ? Slot : motion.button
    
    const buttonContent = (
      <>
        {loading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
      </>
    )

    if (animate && !asChild) {
      return (
        <motion.button
          ref={ref}
          className={cn(buttonVariants({ variant, size, className }))}
          disabled={disabled || loading}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          {...(props as MotionButtonProps)}
        >
          {buttonContent}
        </motion.button>
      )
    }

    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || loading}
        {...(asChild ? props : props)}
      >
        {buttonContent}
      </Comp>
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }