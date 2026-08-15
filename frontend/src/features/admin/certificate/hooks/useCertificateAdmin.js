import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';

import { useAdminCrud } from '~/features/admin/hooks/useAdminCrud';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import {
  createCertificateTemplate,
  deleteCertificateTemplate,
  getCertificateTemplates,
  getIssuedCertificates,
  revokeCertificate,
  updateCertificateTemplate,
} from '~/shared/api/certificateApi';

export const certificateAdminKeys = {
  templates: ['admin-certificates', 'templates'],
  examTypes: ['admin-certificates', 'exam-types'],
  issued: (params) => ['admin-certificates', 'issued', params],
};

const normalizeArray = (data) => (Array.isArray(data) ? data : data?.content ?? []);

export function useCertificateTemplates() {
  const crud = useAdminCrud({
    queryKey: certificateAdminKeys.templates,
    list: getCertificateTemplates,
    create: createCertificateTemplate,
    update: ({ templateId, payload }) => updateCertificateTemplate(templateId, payload),
    remove: deleteCertificateTemplate,
  });

  const examTypesQuery = useQuery({
    queryKey: certificateAdminKeys.examTypes,
    queryFn: getStandardExamTypes,
    select: normalizeArray,
  });

  return {
    templates: crud.items,
    examTypes: examTypesQuery.data ?? [],
    isLoading: crud.isLoading,
    isError: crud.isError,
    createMutation: crud.createMutation,
    updateMutation: crud.updateMutation,
    deleteMutation: crud.deleteMutation,
  };
}

export function useIssuedCertificates(params) {
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: certificateAdminKeys.issued(params),
    queryFn: () => getIssuedCertificates(params),
  });

  const revokeMutation = useMutation({
    mutationFn: ({ certificateId, reason }) => revokeCertificate(certificateId, reason),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ['admin-certificates', 'issued'] }),
  });

  return {
    certificates: listQuery.data?.content ?? [],
    totalPages: listQuery.data?.totalPages ?? 0,
    totalElements: listQuery.data?.totalElements ?? 0,
    isLoading: listQuery.isLoading,
    isError: listQuery.isError,
    revokeMutation,
  };
}
