// src/components/AuthModal.tsx
'use client'

import { X } from 'lucide-react'
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { Heart, Lock, Mail, User, Eye, EyeOff } from 'lucide-react'

type AuthMode = 'login' | 'register' | 'forgot'

export default function AuthModal({
  isOpen,
  onClose
}: {
  isOpen: boolean
  onClose: () => void
}) {
  const [mode, setMode] = useState<AuthMode>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500))
      
      toast.success(
        mode === 'login' ? 'Welcome back!' : 
        mode === 'register' ? 'Account created successfully!' : 
        'Password reset link sent!',
        {
          position: 'top-center',
          style: {
            background: '#4ade80',
            color: '#fff',
            border: 'none'
          }
        }
      )
      onClose()
    } catch (error) {
      toast.error('Authentication failed. Please try again.', {
        position: 'top-center',
        style: {
          background: '#f87171',
          color: '#fff',
          border: 'none'
        }
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const switchMode = (newMode: AuthMode) => {
    setMode(newMode)
    setFormData({
      email: '',
      password: '',
      name: ''
    })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: 'spring', damping: 20, stiffness: 300 }}
            className="relative w-full max-w-md"
          >
            <div className="bg-white rounded-2xl overflow-hidden shadow-xl border border-romantic-200">
              {/* Header */}
              <div className="bg-gradient-to-r from-romantic-500 to-pink-500 p-6 text-white">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Heart className="h-6 w-6 fill-current" />
                    {mode === 'login' && 'Welcome Back'}
                    {mode === 'register' && 'Join ConnectSHub'}
                    {mode === 'forgot' && 'Reset Password'}
                  </h2>
                  <button
                    onClick={onClose}
                    className="rounded-full p-1 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                <p className="mt-2 text-romantic-100">
                  {mode === 'login' && 'Sign in to find your perfect match'}
                  {mode === 'register' && 'Create your dating profile today'}
                  {mode === 'forgot' && 'We\'ll send you a reset link'}
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="p-6">
                <div className="space-y-4">
                  {mode === 'register' && (
                    <div className="relative">
                      <Input
                        name="name"
                        type="text"
                        placeholder="Your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="pl-10 bg-romantic-50 border-romantic-200"
                      />
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-romantic-500" />
                    </div>
                  )}

                  <div className="relative">
                    <Input
                      name="email"
                      type="email"
                      placeholder="Email address"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="pl-10 bg-romantic-50 border-romantic-200"
                    />
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-romantic-500" />
                  </div>

                  {mode !== 'forgot' && (
                    <div className="relative">
                      <Input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        minLength={6}
                        className="pl-10 bg-romantic-50 border-romantic-200 pr-10"
                      />
                      <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-romantic-500" />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-romantic-500 hover:text-romantic-700"
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  )}
                </div>

                {mode === 'login' && (
                  <div className="mt-2 flex justify-end">
                    <button
                      type="button"
                      onClick={() => switchMode('forgot')}
                      className="text-xs text-romantic-600 hover:text-romantic-800 hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                )}

                <Button
                  type="submit"
                  className={cn(
                    "w-full mt-6 bg-gradient-to-r from-romantic-500 to-pink-500 hover:from-romantic-600 hover:to-pink-600 text-white shadow-lg",
                    isLoading && 'opacity-80 pointer-events-none'
                  )}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg
                        className="animate-spin h-4 w-4 text-white"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Processing...
                    </span>
                  ) : (
                    <>
                      {mode === 'login' && 'Sign In'}
                      {mode === 'register' && 'Create Account'}
                      {mode === 'forgot' && 'Send Reset Link'}
                    </>
                  )}
                </Button>

                <div className="mt-4 text-center text-sm text-romantic-600">
                  {mode === 'login' ? (
                    <>
                      Don't have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('register')}
                        className="font-medium text-romantic-700 hover:underline"
                      >
                        Sign up
                      </button>
                    </>
                  ) : mode === 'register' ? (
                    <>
                      Already have an account?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="font-medium text-romantic-700 hover:underline"
                      >
                        Sign in
                      </button>
                    </>
                  ) : (
                    <>
                      Remember your password?{' '}
                      <button
                        type="button"
                        onClick={() => switchMode('login')}
                        className="font-medium text-romantic-700 hover:underline"
                      >
                        Back to login
                      </button>
                    </>
                  )}
                </div>
              </form>

              {/* Social Login */}
              {(mode === 'login' || mode === 'register') && (
                <>
                  <div className="px-6">
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-romantic-200"></div>
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-white px-2 text-romantic-500">
                          Or continue with
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 px-6 pb-6 grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="border-romantic-200 hover:bg-romantic-50"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="fab"
                        data-icon="google"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 488 512"
                      >
                        <path
                          fill="#EA4335"
                          d="M488 261.8C488 403.3 391.1 504 248 504 110.8 504 0 393.2 0 256S110.8 8 248 8c66.8 0 123 24.5 166.3 64.9l-67.5 64.9C258.5 52.6 94.3 116.6 94.3 256c0 86.5 69.1 156.6 153.7 156.6 98.2 0 135-70.4 140.8-106.9H248v-85.3h236.1c2.3 12.7 3.9 24.9 3.9 41.4z"
                        ></path>
                      </svg>
                      Google
                    </Button>
                    <Button
                      variant="outline"
                      className="border-romantic-200 hover:bg-romantic-50"
                    >
                      <svg
                        className="h-4 w-4 mr-2"
                        aria-hidden="true"
                        focusable="false"
                        data-prefix="fab"
                        data-icon="apple"
                        role="img"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 384 512"
                      >
                        <path
                          fill="#000000"
                          d="M318.7 268.7c-.2-36.7 16.4-64.4 54-64.4 1.3 0 2.6.1 3.9.2 4.1-10.7 6.4-22.4 6.4-34.6 0-50.7-27.5-98.8-73.2-98.8-39.4 0-71.7 28.3-71.7 71.5 0 5.5.6 10.8 1.6 15.9-23.6 4.7-42.8 23.8-42.8 47.9 0 27.3 19.4 49.3 48.2 49.3-1.7 0-3.4-.2-5-.7 4.1 15.4 15.2 27.2 30.4 27.5 11.4.2 22.2-4.3 30.3-14.1 12.2-14.9 17.8-35.2 17.8-55.8 0-17.5-3.5-34.2-10.1-49.5zm-90.8-79.2c-3.3-1.9-7.3-3-11.6-3-14.9 0-27.1 12.2-27.1 27.1 0 8.6 4.1 16.2 10.5 21.1 3.3 1.9 7.4 3.1 11.7 3.1 14.9 0 27.1-12.2 27.1-27.2 0-8.5-4.1-16.1-10.6-21.1zm143.7 240.5C351.3 440 292 480 228.8 480c-74.3 0-135-60.7-135-135s60.7-135 135-135c39.8 0 74.2 15.5 100.7 40.3 0 0 2.7-2.1 5.7-4.7 17.2-15.2 40.7-27.6 65-27.6 37.8 0 68.6 30.8 68.6 68.6 0 13.1-3.9 25.1-10.5 35.4 30.5 19.2 48.9 52.6 48.9 88.3 0 63-52.2 114.6-116.6 114.6z"
                        ></path>
                      </svg>
                      Apple
                    </Button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}