'use client';

import {useMutation, useQuery, useQueryClient, type QueryKey} from '@tanstack/react-query';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import type { PageResponse } from '@/app/types';

type CrudFn<TVariables, TData> = (variables: TVariables) => Promise<TData>;

type ListData<TRaw> = TRaw[] | PageResponse<TRaw>;

const asList = <TRaw,>(data: ListData<TRaw> | null | undefined): TRaw[] =>
  Array.isArray(data) ? data : data?.content ?? [];

type CrudMutationsOptions<TCreateVars, TCreateData, TUpdateVars, TUpdateData, TRemoveVars, TRemoveData> = {
  queryKey: QueryKey;
  create?: CrudFn<TCreateVars, TCreateData>;
  update?: CrudFn<TUpdateVars, TUpdateData>;
  remove?: CrudFn<TRemoveVars, TRemoveData>;
};

export function useCrudMutations<
  TCreateVars = void,
  TCreateData = unknown,
  TUpdateVars = void,
  TUpdateData = unknown,
  TRemoveVars = void,
  TRemoveData = unknown,
>({
  queryKey,
  create,
  update,
  remove,
}: CrudMutationsOptions<TCreateVars, TCreateData, TUpdateVars, TUpdateData, TRemoveVars, TRemoveData>) {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({queryKey});

  const createMutation = useMutation({mutationFn: create, onSuccess: invalidate});
  const updateMutation = useMutation({mutationFn: update, onSuccess: invalidate});
  const deleteMutation = useMutation({mutationFn: remove, onSuccess: invalidate});

  return {createMutation, updateMutation, deleteMutation, invalidate};
}

type AdminCrudOptions<TRaw, TItem, TCreateVars, TCreateData, TUpdateVars, TUpdateData, TRemoveVars, TRemoveData> =
  CrudMutationsOptions<TCreateVars, TCreateData, TUpdateVars, TUpdateData, TRemoveVars, TRemoveData> & {
    list: () => Promise<ListData<TRaw>>;
    mapItem?: (raw: TRaw) => TItem;
    // Nhận danh sách đã chuẩn hoá (mảng hoặc content của trang)
    select?: (data: TRaw[]) => TItem[];
  };

export function useAdminCrud<
  TRaw,
  TItem = TRaw,
  TCreateVars = void,
  TCreateData = unknown,
  TUpdateVars = void,
  TUpdateData = unknown,
  TRemoveVars = void,
  TRemoveData = unknown,
>({
  queryKey,
  list,
  create,
  update,
  remove,
  mapItem,
  select,
}: AdminCrudOptions<TRaw, TItem, TCreateVars, TCreateData, TUpdateVars, TUpdateData, TRemoveVars, TRemoveData>) {
  const mutations = useCrudMutations({queryKey, create, update, remove});

  const listQuery = useQuery({
    queryKey,
    queryFn: list,
    select: (data: ListData<TRaw>): TItem[] => {
      const rows = asList(data);
      if (select) return select(rows);
      // Không có mapItem thì TItem mặc định là TRaw
      return mapItem ? rows.map(mapItem) : (rows as unknown as TItem[]);
    },
  });

  return {
    ...mutations,
    items: listQuery.data ?? EMPTY_LIST,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    listQuery,
  };
}
