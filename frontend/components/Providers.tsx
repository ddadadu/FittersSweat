'use client';

import React, { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AuthModal from '@/components/AuthModal';
import { ToastContainer } from '@/components/ToastContainer';
import { useAuthStore } from '@/stores/useAuthStore';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000,
            refetchOnWindowFocus: false,
          },
        },
      })
  );

  useEffect(() => {
    useAuthStore.getState().checkAuth();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <AuthModal />
      <ToastContainer />
    </QueryClientProvider>
  );
}
