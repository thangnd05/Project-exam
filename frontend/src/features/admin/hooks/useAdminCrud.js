'use client';

import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

/**
 * Khuôn CRUD dùng chung cho các trang admin: 1 query danh sách + create/update/delete,
 * mọi mutation thành công đều invalidate lại đúng queryKey đó.
 *
 * Hook nào có thêm query/mutation riêng thì gọi factory rồi bổ sung, không cần copy khuôn.
 */

const asList = (data) => (Array.isArray(data) ? data : data?.content ?? []);

export function useCrudMutations({queryKey, create, update, remove}) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({queryKey});

  const createMutation = useMutation({mutationFn: create, onSuccess: invalidate});
  const updateMutation = useMutation({mutationFn: update, onSuccess: invalidate});
  const deleteMutation = useMutation({mutationFn: remove, onSuccess: invalidate});

  return {createMutation, updateMutation, deleteMutation, invalidate};
}

export function useAdminCrud({queryKey, list, create, update, remove, mapItem, select}) {
  const mutations = useCrudMutations({queryKey, create, update, remove});

  const listQuery = useQuery({
    queryKey,
    queryFn: list,
    select: select ?? ((data) => (mapItem ? asList(data).map(mapItem) : asList(data))),
  });

  return {
    ...mutations,
    items: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    listQuery,
  };
}
