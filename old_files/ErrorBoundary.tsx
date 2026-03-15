// File: src/components/ErrorBoundary.tsx
'use client'

import { Component, ErrorInfo, ReactNode } from 'react'
import { motion } from 'framer-motion'
import { Heart, RefreshCw, AlertCircle, Mail } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode
  className?: string
  showReset?: boolean
  onReset?: () => void
}

interface ErrorBoundaryState {
  hasError: boolean
  error: Error | null
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { 
    hasError: false, 
    error: null 
  }

  static getDerivedStateFromError(error: Error) {
    return { 
      hasError: true,
      error 
    }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, info)
    // TODO: Add your error logging service here (Sentry, LogRocket, etc.)
  }

  handleReset = () => {
    if (this.props.onReset) {
      this.props.onReset()
    }
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "flex flex-col items-center justify-center p-8 text-center",
            "bg-gradient-to-br from-romantic-50 to-pink-50 rounded-xl",
            "border border-romantic-200 shadow-sm",
            this.props.className
          )}
        >
          <div className="relative mb-6">
            <Heart className="h-16 w-16 text-rose-400/30 absolute -top-2 -left-2" />
            <AlertCircle className="h-12 w-12 text-rose-500 relative z-10" />
          </div>

          <h2 className="text-2xl font-bold text-romantic-800 mb-2">
            Oops! Something went wrong
          </h2>
          
          {this.state.error && (
            <div className="mb-4 p-3 bg-rose-100/50 rounded-lg max-w-md">
              <p className="text-sm font-mono text-rose-800">
                {this.state.error.message}
              </p>
            </div>
          )}

          <p className="text-romantic-600 mb-6 max-w-md">
            We're sorry for the inconvenience. Our team has been notified. 
            Please try refreshing the page or contact support if the problem persists.
          </p>

          <div className="flex gap-3">
            {this.props.showReset !== false && (
              <Button
                variant="outline"
                className="border-romantic-300 hover:bg-romantic-100 text-romantic-700"
                onClick={this.handleReset}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </Button>
            )}

            <Button
              variant="default"
              className="bg-romantic-600 hover:bg-romantic-700"
              asChild
            >
              <a href="mailto:support@connectshub.com">
                <Mail className="h-4 w-4 mr-2" />
                Contact Support
              </a>
            </Button>
          </div>
        </motion.div>
      )
    }

    return this.props.children
  }
}

// Usage example:
export function ErrorBoundaryWrapper({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary 
      fallback={
        <div className="flex items-center justify-center min-h-[60vh] p-4">
          <ErrorBoundary />
        </div>
      }
      showReset
    >
      {children}
    </ErrorBoundary>
  )
}