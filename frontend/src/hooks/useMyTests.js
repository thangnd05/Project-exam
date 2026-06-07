import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { keepPreviousData } from '~/config/queryClient';
import { getMyTests, deleteTest } from '../api/testApi';


export const myTestKeys = {
  all: ['my-tests'],
  list: (page, size) => ['my-tests', { page, size }],
};

// Lấy danh sách bài test theo trang (có cache).
// keepPreviousData: khi đổi trang, GIỮ data cũ hiển thị trong lúc fetch -> không nháy.
export function useMyTests({ page = 0, size = 12 } = {}) {
  return useQuery({
    queryKey: myTestKeys.list(page, size),
    queryFn: () => getMyTests({ page, size }),
    placeholderData: keepPreviousData, // v5: giữ data trang trước khi đang fetch trang mới -> không nháy
  });
}

// Xóa bài test -> sau khi thành công invalidate toàn bộ list để tự refetch (không F5).
export function useDeleteTest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (testId) => deleteTest(testId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: myTestKeys.all });
    },
  });
}

// Hàm tiện ích để các nơi khác (vd CreateTestModal onSuccess) làm mới list sau khi tạo.
export function useInvalidateMyTests() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: myTestKeys.all });
}
