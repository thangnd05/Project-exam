'use client';

import {useMutation, useQuery, useQueryClient, type QueryKey} from '@tanstack/react-query';

/**
 * Khuôn CRUD dùng chung cho các trang admin: 1 query danh sách + create/update/delete,
 * mọi mutation thành công đều invalidate lại đúng queryKey đó.
 *
 * Hook nào có thêm query/mutation riêng thì gọi factory rồi bổ sung, không cần copy khuôn.
 */

// `any` có chủ đích: payload/response của từng trang admin khác nhau hoàn toàn,
// consumer (hook riêng của từng trang) vẫn là .js nên chưa ràng kiểu chi tiết được.
type CrudFn = (variables: any) => Promise<any>;

const asList = (data: any): any[] => (Array.isArray(data) ? data : data?.content ?? []);

type CrudMutationsOptions = {
  queryKey: QueryKey;
  create?: CrudFn;
  update?: CrudFn;
  remove?: CrudFn;
};

export function useCrudMutations({queryKey, create, update, remove}: CrudMutationsOptions) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({queryKey});

  const createMutation = useMutation({mutationFn: create, onSuccess: invalidate});
  const updateMutation = useMutation({mutationFn: update, onSuccess: invalidate});
  const deleteMutation = useMutation({mutationFn: remove, onSuccess: invalidate});

  return {createMutation, updateMutation, deleteMutation, invalidate};
}

type AdminCrudOptions = CrudMutationsOptions & {
  list: () => Promise<any>;
  mapItem?: (item: any) => any;
  select?: (data: any) => any;
};

export function useAdminCrud({queryKey, list, create, update, remove, mapItem, select}: AdminCrudOptions) {
  const mutations = useCrudMutations({queryKey, create, update, remove});

  const listQuery = useQuery({
    queryKey,
    queryFn: list,
    select: select ?? ((data: any) => (mapItem ? asList(data).map(mapItem) : asList(data))),
  });

  return {
    ...mutations,
    items: listQuery.data ?? [],
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    listQuery,
  };
}
