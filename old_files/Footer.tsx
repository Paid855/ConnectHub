// File: src/components/Footer.tsx
'use client'

import Link from 'next/link'
import { Heart, Mail, Phone, MapPin, Facebook, Twitter, Instagram } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export default function Footer() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-b from-romantic-50 to-romantic-100 border-t border-romantic-200">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          {/* Brand Column */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Heart className="w-6 h-6 text-romantic-600 fill-current" />
              <span className="text-2xl font-bold bg-gradient-to-r from-romantic-600 to-pink-600 bg-clip-text text-transparent">
                ConnectSHub
              </span>
            </div>
            <p className="text-romantic-700">
              Finding meaningful connections in the digital age.
            </p>
            <div className="flex gap-4">
              <Button variant="ghost" size="icon" className="rounded-full text-romantic-600 hover:text-romantic-800">
                <Facebook className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-romantic-600 hover:text-romantic-800">
                <Twitter className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="rounded-full text-romantic-600 hover:text-romantic-800">
                <Instagram className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-romantic-800">Quick Links</h3>
            <nav className="space-y-2">
              <FooterLink href="/about">About Us</FooterLink>
              <FooterLink href="/success-stories">Success Stories</FooterLink>
              <FooterLink href="/blog">Dating Tips</FooterLink>
              <FooterLink href="/safety">Safety Guide</FooterLink>
            </nav>
          </div>

          {/* Legal */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-romantic-800">Legal</h3>
            <nav className="space-y-2">
              <FooterLink href="/terms">Terms of Service</FooterLink>
              <FooterLink href="/privacy">Privacy Policy</FooterLink>
              <FooterLink href="/cookie-policy">Cookie Policy</FooterLink>
              <FooterLink href="/community-guidelines">Community Guidelines</FooterLink>
            </nav>
          </div>

          {/* Contact */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-romantic-800">Contact Us</h3>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-romantic-600 mt-0.5 flex-shrink-0" />
                <span className="text-romantic-700">support@connectshub.com</span>
              </div>
              <div className="flex items-start gap-3">
                <Phone className="h-5 w-5 text-romantic-600 mt-0.5 flex-shrink-0" />
                <span className="text-romantic-700">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-start gap-3">
                <MapPin className="h-5 w-5 text-romantic-600 mt-0.5 flex-shrink-0" />
                <span className="text-romantic-700">123 Love Lane, Romance City</span>
              </div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-romantic-200 my-8"></div>

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-romantic-600">
            © {currentYear} ConnectSHub. All rights reserved.
          </p>
          
          <div className="flex items-center gap-2">
            <span className="text-sm text-romantic-600">Made with</span>
            <Heart className="h-4 w-4 text-rose-500 fill-current" />
            <span className="text-sm text-romantic-600">by ConnectSHub Team</span>
          </div>

          <div className="flex gap-4">
            <Button variant="link" size="sm" className="text-romantic-600 hover:text-romantic-800 p-0 h-auto">
              Accessibility
            </Button>
            <Button variant="link" size="sm" className="text-romantic-600 hover:text-romantic-800 p-0 h-auto">
              Sitemap
            </Button>
          </div>
        </div>
      </div>
    </footer>
  )
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="block text-romantic-700 hover:text-romantic-900 transition-colors hover:underline underline-offset-4"
    >
      {children}
    </Link>
  )
}