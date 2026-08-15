'use client';

import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { useAdminCrud } from '@/app/hooks/useAdminCrud';
import { getStandardExamTypes } from '@/app/apis/examTypeApi';
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  deleteIssuedCertificate,
  getCertificateTemplates,
  getIssuedCertificates,
  revokeCertificate,
  updateCertificateTemplate,
} from '@/app/apis/certificateApi';
import type {
  CertificateTemplateRequest,
  CertificateTemplateResponse,
  ExamTypeResponse,
} from '@/app/types';

export interface IssuedCertificateParams {
  examTypeId?: string;
  status?: string;
  keyword?: string;
  page?: number;
  size?: number;
}

export const certificateAdminKeys = {
  templates: ['admin-certificates', 'templates'] as const,
  examTypes: ['admin-certificates', 'exam-types'] as const,
  issued: (params: IssuedCertificateParams) => ['admin-certificates', 'issued', params] as const,
};

const normalizeArray = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : data?.content ?? [];

export function useCertificateTemplates() {
  const crud = useAdminCrud({
    queryKey: certificateAdminKeys.templates,
    list: getCertificateTemplates,
    create: createCertificateTemplate,
    update: ({ templateId, payload }: { templateId: string; payload: CertificateTemplateRequest }) =>
      updateCertificateTemplate(templateId, payload),
    remove: deleteCertificateTemplate,
  });

  const examTypesQuery = useQuery({
    queryKey: certificateAdminKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: normalizeArray,
  });

  return {
    templates: crud.items as CertificateTemplateResponse[],
    examTypes: (examTypesQuery.data ?? []) as ExamTypeResponse[],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function useIssuedCertificates(params: IssuedCertificateParams) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: certificateAdminKeys.issued(params),
    queryFn: () => getIssuedCertificates(params),
  });

  // Cả thu hồi lẫn xoá đều đổi số chứng chỉ còn hiệu lực nên phải làm mới cả bảng mẫu.
  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-certificates', 'issued'] });
    queryClient.invalidateQueries({ queryKey: certificateAdminKeys.templates });
  };

  const revokeMutation = useMutation({
    mutationFn: ({ certificateId, reason }: { certificateId: string; reason?: string }) =>
      revokeCertificate(certificateId, reason),
    onSuccess: invalidateAll,
  });

  const deleteMutation = useMutation({
    mutationFn: (certificateId: string) => deleteIssuedCertificate(certificateId),
    onSuccess: invalidateAll,
  });

  return {
    certificates: listQuery.data?.content ?? [],
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    revokeMutation,
    deleteMutation,
  };
}
