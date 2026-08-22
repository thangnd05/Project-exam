'use client';

import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import {
  getCertificateByAttempt,
  getCertificateById,
  getMyCertificates,
  getPublicCertificates,
  verifyCertificate,
} from '@/app/apis/certificateApi';

export const certificateKeys = {
  mine: ['certificates', 'mine'],
  detail: (certificateId?: string) => ['certificates', 'detail', certificateId],
  verify: (code?: string) => ['certificates', 'verify', code],
  byAttempt: (userTestId?: string) => ['certificates', 'by-attempt', userTestId],
  publicFeed: (examTypeId?: string) => ['certificates', 'public', 'feed', examTypeId || 'all'],
};

export function useMyCertificates() {
  return useQuery({
    queryKey: certificateKeys.mine,
    queryFn: getMyCertificates,
    select: (data) => (Array.isArray(data) ? data : []),
  });
}

export function useCertificateDetail(certificateId?: string) {
  return useQuery({
    queryKey: certificateKeys.detail(certificateId),
    queryFn: () => getCertificateById(certificateId as string),
    enabled: Boolean(certificateId),
  });
}

export function useCertificateVerification(code?: string) {
  return useQuery({
    queryKey: certificateKeys.verify(code),
    queryFn: () => verifyCertificate(code as string),
    enabled: Boolean(code),
    retry: false,
  });
}

export function useAttemptCertificate(userTestId?: string, enabled = true) {
  return useQuery({
    queryKey: certificateKeys.byAttempt(userTestId),
    queryFn: () => getCertificateByAttempt(userTestId as string),
    enabled: Boolean(userTestId) && enabled,
    retry: false,
  });
}

/**
 * Danh sách chứng chỉ đã cấp (công khai), tải thêm theo trang.
 * Trần size do backend áp (24), truyền lớn hơn cũng bị cắt.
 */
export function usePublicCertificates(examTypeId?: string, pageSize = 12) {
  return useInfiniteQuery({
    queryKey: certificateKeys.publicFeed(examTypeId),
    queryFn: ({ pageParam = 0 }) =>
      getPublicCertificates({ examTypeId, page: pageParam as number, size: pageSize }),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => (lastPage?.hasNext ? lastPage.currentPage + 1 : undefined),
  });
}
