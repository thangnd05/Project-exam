'use client';

// Ranh giới client duy nhất của toàn app: mọi context/provider vốn nằm trong App.js cũ
// chuyển hết về đây. Root layout (server component) chỉ việc bọc children bằng component này,
// nhờ vậy layout vẫn export được `metadata` — thứ mà một client component không làm được.

import { QueryClientProvider } from '@tanstack/react-query';
import { ToastContainer } from 'react-toastify';
import { queryClient } from '~/shared/config/queryClient';
import { AuthProvider } from '~/shared/context/AuthContext';
import { StreakProvider } from '~/shared/context/StreakContext';
import { CoinProvider } from '~/shared/context/CoinContext';
import { CosmeticProvider } from '~/shared/context/CosmeticContext';
import StreakCelebration from '~/features/gamification/streak/StreakCelebration';
import ScrollHandler from '~/layout/ScrollToTopOnRouteChange';
import VisitTracker from '~/layout/VisitTracker';
import ErrorBoundary from '~/shared/ui/ErrorBoundary';

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
