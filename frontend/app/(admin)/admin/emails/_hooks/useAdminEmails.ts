'use client';

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
} from '@/app/apis/emailApi';
import type {
  EmailPreviewRequest,
  EmailRecipientResponse,
  EmailResponse,
  EmailSaveRequest,
  PageResponse,
} from '@/app/types';

export const emailKeys = {
  auto: ['admin-emails', 'auto'],
  manual: (page: number, size: number) => ['admin-emails', 'manual', page, size],
  recipients: (emailId: string | null | undefined, page: number) => ['admin-emails', 'recipients', emailId, page],
  audience: ['admin-emails', 'audience'],
};

type EmailListPage<T> = Pick<PageResponse<T>, 'content' | 'totalPages' | 'totalElements' | 'currentPage'>;

const emptyPage = {content: [], totalPages: 1, totalElements: 0, currentPage: 0};

export function useAutoEmails() {
  const query = useQuery({queryKey: emailKeys.auto, queryFn: getAutoEmails});
  return {
    emails: query.data ?? [],
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useManualEmails(page: number, size: number) {
  const query = useQuery({
    queryKey: emailKeys.manual(page, size),
    queryFn: () => getManualEmails({page, size}),
  });
  return {
    page: (query.data ?? emptyPage) as EmailListPage<EmailResponse>,
    isLoading: query.isLoading,
    isError: query.isError,
  };
}

export function useEmailRecipients(emailId: string | null | undefined, page: number, size: number) {
  const query = useQuery({
    queryKey: emailKeys.recipients(emailId, page),
    queryFn: () => getEmailRecipients(emailId as string, {page, size}),
    enabled: Boolean(emailId),
    refetchInterval: 5000,
  });
  return {
    page: (query.data ?? emptyPage) as EmailListPage<EmailRecipientResponse>,
    isLoading: query.isLoading,
  };
}

export function useEmailAudience(enabled: boolean) {
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
    mutationFn: ({emailId, payload}: {emailId: string; payload: EmailSaveRequest}) => updateEmail(emailId, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({mutationFn: deleteEmail, onSuccess: invalidate});
  const send = useMutation({
    mutationFn: ({emailId, userIds}: {emailId: string; userIds: string[]}) => sendEmail(emailId, userIds),
    onSuccess: invalidate,
  });
  const retry = useMutation({mutationFn: retryFailedEmail, onSuccess: invalidate});
  const preview = useMutation({mutationFn: previewEmail});
  const testSend = useMutation({
    mutationFn: ({emailId, payload}: {emailId: string; payload: EmailPreviewRequest}) => testSendEmail(emailId, payload),
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
