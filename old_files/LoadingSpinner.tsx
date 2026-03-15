'use client'

import { cn } from '@/lib/utils'
import { Heart, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

interface LoadingSpinnerProps {
  className?: string
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'default' | 'romantic' | 'premium' | 'match'
  label?: string
  withText?: boolean
  fullScreen?: boolean
}

const sizeClasses = {
  xs: 'h-4 w-4',
  sm: 'h-6 w-6',
  md: 'h-8 w-8',
  lg: 'h-12 w-12',
  xl: 'h-16 w-16'
}

const textSizeClasses = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl'
}

const variantClasses = {
  default: 'text-gray-600',
  romantic: 'text-romantic-600',
  premium: 'text-gradient-to-r from-romantic-500 to-pink-500',
  match: 'text-rose-500'
}

const spinnerVariants = {
  default: (
    <div className="border-2 border-t-transparent rounded-full animate-spin" />
  ),
  romantic: (
    <Heart className="animate-pulse fill-romantic-100 text-romantic-500" />
  ),
  premium: (
    <div className="relative">
      <div className="absolute inset-0 rounded-full border-2 border-t-transparent border-romantic-500 animate-spin" />
      <div className="absolute inset-0 rounded-full border-2 border-b-transparent border-pink-500 animate-spin animation-delay-200" />
    </div>
  ),
  match: (
    <div className="relative">
      <Sparkles className="absolute animate-ping text-amber-400" />
      <Heart className="animate-pulse fill-rose-100 text-rose-500" />
    </div>
  )
}

export default function LoadingSpinner({
  className,
  size = 'md',
  variant = 'default',
  label = 'Loading...',
  withText = false,
  fullScreen = false
}: LoadingSpinnerProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2 }}
      className={cn(
        "flex flex-col items-center justify-center gap-3",
        fullScreen && "fixed inset-0 bg-white/80 backdrop-blur-sm z-50",
        className
      )}
      role="status"
      aria-label={label}
    >
      <div className={cn(
        "flex items-center justify-center",
        sizeClasses[size],
        variantClasses[variant]
      )}>
        {spinnerVariants[variant]}
      </div>

      {(withText || fullScreen) && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={cn(
            "text-center font-medium",
            textSizeClasses[size],
            variant === 'default' ? 'text-gray-600' : 
            variant === 'romantic' ? 'text-romantic-700' :
            variant === 'premium' ? 'text-transparent bg-clip-text bg-gradient-to-r from-romantic-600 to-pink-600' :
            'text-rose-600'
          )}
        >
          {label}
          {fullScreen && (
            <p className="text-sm font-normal mt-1 text-romantic-500">
              Finding your perfect matches...
            </p>
          )}
        </motion.div>
      )}

      <span className="sr-only">{label}</span>
    </motion.div>
  )
}