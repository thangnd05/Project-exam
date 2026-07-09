import { QueryClient, keepPreviousData } from '@tanstack/react-query';

export { keepPreviousData };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      refetchOnReconnect: true,
      staleTime: 1000 * 60,
    },
  },
});
