'use client';

import { useMutation, useQuery, useQueryClient, type UseMutationOptions } from '@tanstack/react-query';
import {
  albumDeltaKeys,
  bulkCreateVocabularies,
  createVocabulary,
  deleteVocabulary,
  getVocabulariesByAlbum,
  updateVocabulary,
} from '@/app/apis/vocabularyApi';
import type { VocabularyRequest, VocabularyResponse } from '@/app/types';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';

type MutationCallbacks<T> = {
  onSuccess?: (data: T, ...rest: unknown[]) => void;
  onError?: (err: any) => void;
};

const normalizeVocabularies = (data: VocabularyResponse[]): VocabularyResponse[] =>
  Array.isArray(data) ? data : Array.isArray((data as any)?.content) ? (data as any).content : [];

export function useAlbumVocabularies(albumId?: string) {
  const query = useQuery({
    queryKey: albumDeltaKeys.vocabularies(albumId),
    queryFn: () => getVocabulariesByAlbum(albumId!),
    enabled: !!albumId,
    select: normalizeVocabularies,
  });

  return {
    vocabularies: query.data ?? EMPTY_LIST,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}

export function useDeleteVocabulary(albumId?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (vocabId: string) => deleteVocabulary(vocabId),
    onSuccess: () => qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) }),
  });
}

export function useCreateVocabulary(
  albumId?: string,
  { onSuccess, onError }: MutationCallbacks<VocabularyResponse> = {}
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VocabularyRequest) => createVocabulary(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

export function useBulkCreateVocabularies(
  albumId?: string,
  { onSuccess, onError }: MutationCallbacks<VocabularyResponse[]> = {}
) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: VocabularyRequest[]) => bulkCreateVocabularies(payload),
    onSuccess: (...args) => {
      qc.invalidateQueries({ queryKey: albumDeltaKeys.vocabularies(albumId) });
      if (onSuccess) onSuccess(...args);
    },
    onError,
  });
}

type UpdateVocabularyVariables = { vocabId: string; data: VocabularyRequest };

/**
 * Không tự invalidate: chỗ gọi đang tự quyết định làm gì sau khi sửa (đóng modal, cập nhật
 * tại chỗ), nên giữ nguyên hành vi cũ thay vì áp thêm refetch.
 */
export function useUpdateVocabulary(
  options: Omit<
    UseMutationOptions<VocabularyResponse, any, UpdateVocabularyVariables>,
    'mutationFn'
  > = {}
) {
  return useMutation({
    mutationFn: ({ vocabId, data }: UpdateVocabularyVariables) => updateVocabulary(vocabId, data),
    ...options,
  });
}
