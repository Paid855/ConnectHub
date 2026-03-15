'use client';

import React, { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { Toaster } from 'sonner';
import type { Session } from 'next-auth';
import { Heart, RefreshCw, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import ErrorBoundary from '@/components/ErrorBoundary';
import LoadingSpinner from '@/components/LoadingSpinner';
import { Providers } from '@/components/Providers';

const Navbar = dynamic(() => import('@/components/Navbar'), {
  ssr: false,
  loading: () => <LoadingSpinner className="h-16 border-b border-romantic-200 bg-romantic-50" />,
});

const Footer = dynamic(() => import('@/components/Footer'), {
  ssr: false,
  loading: () => <div className="h-24 bg-romantic-50 border-t border-romantic-200" />,
});

const LiveNotification = dynamic(() => import('@/components/LiveNotification'), {
  ssr: false,
  loading: () => null,
});

const AuthModal = dynamic(() => import('@/components/AuthModal'), {
  ssr: false,
  loading: () => null,
});

interface LayoutClientProps {
  children: React.ReactNode;
  modal?: React.ReactNode;
  session?: Session;
}

export default function LayoutClient({ children, modal, session }: LayoutClientProps) {
  const pathname = usePathname();

  const layoutConfig = {
    showNavbar: !pathname?.startsWith('/auth') && !pathname?.startsWith('/error'),
    showFooter: !pathname?.match(/^\/(auth|dashboard|error)/),
    containerClass: pathname?.startsWith('/dashboard')
      ? 'container mx-auto px-4'
      : pathname?.startsWith('/profile')
      ? 'max-w-6xl mx-auto px-4 sm:px-6'
      : '',
  };

  return (
    <Providers session={session}>
      <a href="#main-content" className="skip-to-content-link" aria-label="Skip to main content">
        Skip to content
      </a>

      <ErrorBoundary fallback={<LayoutErrorFallback />}>
        {layoutConfig.showNavbar && (
          <Suspense fallback={<LoadingSpinner className="h-16 border-b border-romantic-200 bg-romantic-50" />}>
            <Navbar session={session} />
          </Suspense>
        )}

        <main
          id="main-content"
          className={cn(
            'min-h-[calc(100vh-10rem)]',
            layoutConfig.containerClass,
            'bg-gradient-to-b from-white to-romantic-50/30'
          )}
          tabIndex={-1}
        >
          <ErrorBoundary>{children}</ErrorBoundary>
        </main>

        <Suspense fallback={null}>
          <LiveNotification />
        </Suspense>

        {layoutConfig.showFooter && (
          <Suspense fallback={<div className="h-24 bg-romantic-50 border-t border-romantic-200" />}>
            <Footer />
          </Suspense>
        )}

        <Suspense fallback={null}>
          <AuthModal />
        </Suspense>

        <Toaster
          position="top-center"
          theme="light"
          richColors
          closeButton
          toastOptions={{
            classNames: {
              toast: '!border !border-romantic-200 !shadow-lg !rounded-xl',
              title: '!font-medium !text-base !text-romantic-800',
              description: '!text-sm !text-romantic-600',
              success: '!bg-emerald-50 !border-emerald-200',
              error: '!bg-rose-50 !border-rose-200',
              actionButton: '!bg-romantic-600 !text-white hover:!bg-romantic-700',
              cancelButton: '!bg-romantic-50 !text-romantic-700 hover:!bg-romantic-100',
            },
          }}
        />

        {modal}
      </ErrorBoundary>

      <style jsx global>{`
        .skip-to-content-link {
          position: absolute;
          left: -9999px;
          z-index: 999;
          padding: 0.75rem 1.5rem;
          background: var(--romantic-600);
          color: white;
          border-radius: 0.5rem;
          font-weight: 500;
          transition: transform 0.2s ease;
          transform: translateY(-100%);
        }
        .skip-to-content-link:focus {
          transform: translateY(1rem);
          left: 1rem;
          outline: 2px solid var(--romantic-400);
          outline-offset: 2px;
        }
      `}</style>
    </Providers>
  );
}

function LayoutErrorFallback() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-gradient-to-br from-romantic-50 to-pink-50 text-center">
      <div className="max-w-md space-y-6 p-8 bg-white rounded-2xl shadow-lg border border-romantic-200">
        <div className="inline-flex items-center justify-center rounded-full bg-rose-100 p-4">
          <Heart className="h-10 w-10 text-rose-500" strokeWidth={1.5} />
        </div>
        <h1 className="text-3xl font-bold text-romantic-800">Connection Interrupted</h1>
        <p className="text-romantic-600">
          Our love connection hit a snag! We're working to restore your romantic experience.
        </p>
        <div className="flex gap-3 justify-center pt-4">
          <Button onClick={() => window.location.reload()} className="bg-romantic-600 hover:bg-romantic-700 shadow-sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
          <Button
            variant="outline"
            asChild
            className="border-romantic-300 hover:bg-romantic-50 text-romantic-700"
          >
            <a href="/">
              <Home className="h-4 w-4 mr-2" />
              Return Home
            </a>
          </Button>
        </div>
      </div>
    </div>
  );
}

function Button({ children, className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  asChild?: boolean;
  variant?: 'outline' | 'solid';
}) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-romantic-400',
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
