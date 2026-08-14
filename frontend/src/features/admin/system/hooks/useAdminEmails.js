import {useMutation, useQuery, useQueryClient} from '@tanstack/react-query';

import {
  createEmail,
  deleteEmail,
  getAutoEmails,
  getEmailAudience,
  getEmailRecipients,
  getManualEmails,
  previewEmail,
  retryFailedEmail,
  sendEmail,
  testSendEmail,
  updateEmail,
} from '~/shared/api/emailApi';

export const emailKeys = {
  auto: ['admin-emails', 'auto'],
  manual: (page, size) => ['admin-emails', 'manual', page, size],
  recipients: (emailId, page) => ['admin-emails', 'recipients', emailId, page],
  audience: ['admin-emails', 'audience'],
};

const emptyPage = {content: [], totalPages: 1, totalElements: 0, currentPage: 0};

export function useAutoEmails() {
  const query = useQuery({queryKey: emailKeys.auto, queryFn: getAutoEmails});
  return {
    emails: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useManualEmails(page, size) {
  const query = useQuery({
    queryKey: emailKeys.manual(page, size),
    queryFn: () => getManualEmails({page, size}),
  });
  return {
    page: query.data ?? emptyPage,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEmailRecipients(emailId, page, size) {
  const query = useQuery({
    queryKey: emailKeys.recipients(emailId, page),
    queryFn: () => getEmailRecipients(emailId, {page, size}),
    enabled: Boolean(emailId),
    // Worker gửi nền nên trạng thái đổi sau khi mở bảng  tự làm mới trong lúc đang xem.
    refetchInterval: 5000,
  });
  return {
    page: query.data ?? emptyPage,
    isLoading: query.isLoading,
  };
}

export function useEmailAudience(enabled) {
  const query = useQuery({
    queryKey: emailKeys.audience,
    queryFn: getEmailAudience,
    enabled: Boolean(enabled),
  });
  return {
    users: query.data ?? [],
    isLoading: query.isLoading,
  };
}

export function useEmailMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({queryKey: ['admin-emails']});

  const create = useMutation({mutationFn: createEmail, onSuccess: invalidate});
  const update = useMutation({
    mutationFn: ({emailId, payload}) => updateEmail(emailId, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({mutationFn: deleteEmail, onSuccess: invalidate});
  const send = useMutation({
    mutationFn: ({emailId, userIds}) => sendEmail(emailId, userIds),
    onSuccess: invalidate,
  });
  const retry = useMutation({mutationFn: retryFailedEmail, onSuccess: invalidate});
  const preview = useMutation({mutationFn: previewEmail});
  const testSend = useMutation({
    mutationFn: ({emailId, payload}) => testSendEmail(emailId, payload),
    onSuccess: invalidate,
  });

  return {
    createEmail: create.mutateAsync,
    updateEmail: update.mutateAsync,
    removeEmail: remove.mutateAsync,
    sendEmail: send.mutateAsync,
    retryFailed: retry.mutateAsync,
    previewEmail: preview.mutateAsync,
    testSendEmail: testSend.mutateAsync,
  };
}
