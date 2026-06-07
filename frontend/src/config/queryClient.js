import { QueryClient, keepPreviousData } from '@tanstack/react-query';

// Re-export để các nơi khác chỉ cần import từ một chỗ:
//   import { queryClient, keepPreviousData } from '~/config/queryClient';
export { keepPreviousData };

// QueryClient dùng chung cho toàn app.
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1, // thử lại 1 lần khi lỗi mạng tạm thời
      refetchOnWindowFocus: false, // không refetch mỗi lần quay lại tab
      refetchOnReconnect: true, // có mạng lại thì làm mới
      staleTime: 1000 * 60, // 1 phút coi là "tươi" -> tránh gọi API thừa
    },
  },
});
