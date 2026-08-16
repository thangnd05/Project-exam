'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { queryClient } from '@/app/configs/queryClient';
import { AuthProvider } from '@/app/contexts/AuthContext';
import { StreakProvider } from '@/app/contexts/StreakContext';
import { CoinProvider } from '@/app/contexts/CoinContext';
import { CosmeticProvider } from '@/app/contexts/CosmeticContext';
import StreakCelebration from '@/app/components/gamification/streak/StreakCelebration';
import ScrollHandler from '@/app/components/layouts/ScrollToTopOnRouteChange';
import VisitTracker from '@/app/components/layouts/VisitTracker';
import ErrorBoundary from '@/app/components/ErrorBoundary/ErrorBoundary';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StreakProvider>
          <CoinProvider>
            <CosmeticProvider>
              <ScrollHandler />
              <VisitTracker />
              <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={false}
                closeOnClick
                pauseOnFocusLoss
                draggable
                pauseOnHover
                limit={3}
                style={{ zIndex: 99999 }}
              />
              <div className="App">
                <StreakCelebration />
                <ErrorBoundary>{children}</ErrorBoundary>
              </div>
            </CosmeticProvider>
          </CoinProvider>
        </StreakProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
