"use client";

import { createContext } from "react";
import { EmotionRegistry } from "@/lib/emotion-registry";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "sonner";
import { SessionProvider } from "next-auth/react";
import { CSPostHogProvider } from "@/lib/posthog-provider";
import { TailwindIndicator } from "@/components/tailwind-indicator";
import { ProgressBar } from "@/components/progress-bar";
import { ModalProvider } from "@/components/modal-provider";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ConfettiProvider } from "@/components/confetti-provider";
import { ReactQueryProvider } from "@/lib/react-query-provider";
import { SocketProvider } from "@/lib/socket-provider";
import { AuthProvider } from "@/context/AuthContext";

interface ProvidersProps {
  children: React.ReactNode;
  session: any;
}

// NAMED export
export function Providers({ children, session }: ProvidersProps) {
  return (
    <EmotionRegistry>
      <ReactQueryProvider>
        <SessionProvider session={session}>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <CSPostHogProvider>
              <SocketProvider>
                <TooltipProvider delayDuration={300}>
                  <ModalProvider>
                    <ConfettiProvider>
                      <ProgressBar />
                      <AuthProvider>
                        {children}
                      </AuthProvider>
                      <TailwindIndicator />
                      <Toaster
                        position="top-center"
                        richColors
                        closeButton
                        expand
                        visibleToasts={3}
                      />
                    </ConfettiProvider>
                  </ModalProvider>
                </TooltipProvider>
              </SocketProvider>
            </CSPostHogProvider>
          </ThemeProvider>
        </SessionProvider>
      </ReactQueryProvider>
    </EmotionRegistry>
  );
}