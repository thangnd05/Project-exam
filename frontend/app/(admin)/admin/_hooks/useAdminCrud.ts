'use client';

import {useMutation, useQuery, useQueryClient, type QueryKey} from '@tanstack/react-query';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

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
    items: listQuery.data ?? EMPTY_LIST,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    listQuery,
  };
}
