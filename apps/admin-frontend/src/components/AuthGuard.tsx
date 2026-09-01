'use client';

import React, { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuthStore } from '@/store/useAuthStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  const isLoginPage = pathname === '/login';

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isLoginPage) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, isLoginPage, router]);

  // If on login page, render directly
  if (isLoginPage) {
    return <>{children}</>;
  }

  // If initializing auth state, display sovereign loading screen
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] text-[#ededed] flex flex-col items-center justify-center space-y-4 font-sans selection:bg-cyan-500/20">
        <div className="relative">
          <motion.div
            animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ repeat: Infinity, duration: 2, ease: 'easeInOut' }}
            className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center"
          >
            <ShieldCheck className="w-8 h-8 text-cyan-400" />
          </motion.div>
          <div className="absolute -bottom-1 -right-1">
            <RefreshCw className="w-4 h-4 text-emerald-400 animate-spin" />
          </div>
        </div>
        <div className="text-center space-y-1">
          <div className="text-sm font-medium text-gray-200 font-mono tracking-tight">
            Verifying Sovereign Authorization
          </div>
          <div className="text-xs text-gray-500 font-mono">
            Auditing X.509 CRL &amp; Session Credentials
          </div>
        </div>
      </div>
    );
  }

  // If unauthenticated after loading, prevent flash of protected content
  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}
