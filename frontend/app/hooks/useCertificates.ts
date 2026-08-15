'use client';

import { useQuery } from '@tanstack/react-query';

import {
  getCertificateByAttempt,
  getCertificateById,
  getMyCertificates,
  verifyCertificate,
} from '@/app/apis/certificateApi';

export const certificateKeys = {
  mine: ['certificates', 'mine'],
  detail: (certificateId?: string) => ['certificates', 'detail', certificateId],
  verify: (code?: string) => ['certificates', 'verify', code],
  byAttempt: (userTestId?: string) => ['certificates', 'by-attempt', userTestId],
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

/**
 * Trạng thái chứng chỉ của một lượt làm bài. Chỉ gọi khi đã đăng nhập  khách làm bài
 * không bao giờ được cấp chứng chỉ nên hỏi cũng vô ích.
 */
export function useAttemptCertificate(userTestId?: string, enabled = true) {
  return useQuery({
    queryKey: certificateKeys.byAttempt(userTestId),
    queryFn: () => getCertificateByAttempt(userTestId as string),
    enabled: Boolean(userTestId) && enabled,
    retry: false,
  });
}
