'use client'

import Link from 'next/link'
import dynamic from 'next/dynamic'
import { Suspense, useState, useEffect } from 'react'
import { Button } from './ui/button'
import { Loader2, Heart, MessageCircle, Search, User, Flame, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { User } from 'next-auth'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'

// Dynamic UserMenu import with enhanced fallback
const UserMenu = dynamic(() => import('@/components/UserMenu').catch(() => ({
  default: ({ user }: { user: User | undefined }) => (
    <div className="flex items-center gap-2">
      <Button 
        variant="ghost" 
        size="sm"
        className="text-rose-500 hover:bg-rose-50"
        asChild
      >
        <Link href="/api/auth/signout">Sign Out</Link>
      </Button>
    </div>
  )
})), {
  ssr: false,
  loading: () => (
    <div className="flex items-center gap-2">
      <Loader2 className="h-4 w-4 animate-spin text-romantic-400" />
      <span className="text-sm text-romantic-600">Loading...</span>
    </div>
  )
})

interface NavbarProps {
  session?: {
    user?: User
  } | null
}

export default function Navbar({ session }: NavbarProps) {
  const pathname = usePathname()
  const [scrolled, setScrolled] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const navLinks = [
    { name: 'Discover', href: '/discover', icon: Search },
    { name: 'Matches', href: '/matches', icon: Heart },
    { name: 'Messages', href: '/messages', icon: MessageCircle },
    { name: 'Premium', href: '/premium', icon: Flame }
  ]

  return (
    <header className={cn(
      "sticky top-0 z-50 transition-all duration-300",
      scrolled ? "bg-white/95 backdrop-blur-lg shadow-sm border-b border-romantic-100" : "bg-white/80 backdrop-blur-md",
      mobileMenuOpen && "bg-white" // Solid background when mobile menu is open
    )}>
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          {/* Logo/Brand */}
          <Link 
            href="/" 
            className="flex items-center gap-2 group"
            aria-label="ConnectSHub Home"
          >
            <Heart className="h-6 w-6 text-rose-500 fill-current group-hover:scale-110 transition-transform" />
            <span className="text-2xl font-bold bg-gradient-to-r from-romantic-600 to-pink-600 bg-clip-text text-transparent">
              ConnectSHub
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className={cn(
                  "flex items-center gap-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors",
                  "text-romantic-700 hover:bg-romantic-50 hover:text-romantic-900",
                  pathname.startsWith(link.href) ? "text-romantic-900 bg-romantic-50" : ""
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.name}
              </Link>
            ))}
          </nav>

          {/* Auth Section */}
          <div className="flex items-center gap-3">
            {session ? (
              <Suspense fallback={
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin text-romantic-400" />
                </div>
              }>
                <UserMenu user={session.user} />
              </Suspense>
            ) : (
              <>
                <Button 
                  variant="ghost" 
                  className="hidden md:flex text-romantic-700 hover:bg-romantic-50"
                  asChild
                >
                  <Link href="/auth/signin">Sign In</Link>
                </Button>
                <Button 
                  className={cn(
                    "bg-gradient-to-r from-romantic-500 to-pink-500 hover:from-romantic-600 hover:to-pink-600",
                    "text-white shadow-sm hover:shadow-md transition-all"
                  )}
                  asChild
                >
                  <Link href="/auth/signup">
                    Get Started
                  </Link>
                </Button>
              </>
            )}

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2 rounded-lg text-romantic-700 hover:bg-romantic-50"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle menu"
            >
              <div className="w-5 flex flex-col gap-1">
                <span className={cn(
                  "h-0.5 bg-romantic-600 rounded-full transition-all",
                  mobileMenuOpen ? "rotate-45 translate-y-1.5" : ""
                )} />
                <span className={cn(
                  "h-0.5 bg-romantic-600 rounded-full transition-all",
                  mobileMenuOpen ? "opacity-0" : "opacity-100"
                )} />
                <span className={cn(
                  "h-0.5 bg-romantic-600 rounded-full transition-all",
                  mobileMenuOpen ? "-rotate-45 -translate-y-1.5" : ""
                )} />
              </div>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pb-4 pt-2 space-y-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 px-4 py-3 rounded-lg text-base font-medium",
                      "text-romantic-800 hover:bg-romantic-50",
                      pathname.startsWith(link.href) ? "bg-romantic-50" : ""
                    )}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.name}
                    {link.name === 'Messages' && (
                      <span className="ml-auto bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        3
                      </span>
                    )}
                  </Link>
                ))}

                {!session && (
                  <div className="flex gap-2 pt-2 px-4">
                    <Button 
                      variant="outline" 
                      className="flex-1 border-romantic-300 text-romantic-700 hover:bg-romantic-50"
                      asChild
                    >
                      <Link href="/auth/signin">Sign In</Link>
                    </Button>
                    <Button 
                      className="flex-1 bg-gradient-to-r from-romantic-500 to-pink-500 text-white"
                      asChild
                    >
                      <Link href="/auth/signup">Sign Up</Link>
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}