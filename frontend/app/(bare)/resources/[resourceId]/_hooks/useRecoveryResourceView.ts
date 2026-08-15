'use client';

import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getResourceById, viewResourceContent } from '@/app/apis/recoveryResourceApi';
import { isMarkdownResource } from '@/app/utils/recoveryResource';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';
import type { RecoveryResourceResponse } from '@/app/types';

const API_BASE = getApiBaseUrl();

marked.setOptions({
  gfm: true,
  breaks: true,
});

export const recoveryResourceViewKeys = {
  detail: (id?: string) => ['recovery-resource-view', id],
};

type RecoveryResourceView = {
  resource: RecoveryResourceResponse | null;
  markdownHtml: string;
};

const EMPTY_VIEW: RecoveryResourceView = { resource: null, markdownHtml: '' };

export function useRecoveryResourceView(resourceId?: string) {
  const query = useQuery({
    queryKey: recoveryResourceViewKeys.detail(resourceId),
    queryFn: async (): Promise<RecoveryResourceView> => {
      const data = await getResourceById(resourceId as string);

      if (!isMarkdownResource(data)) {
        const viewUrl = API_BASE
          ? `${API_BASE}/api/recovery-resources/${resourceId}/view`
          : `/api/recovery-resources/${resourceId}/view`;
        window.location.replace(viewUrl);
        return EMPTY_VIEW;
      }

      const markdownText = await viewResourceContent(resourceId as string);
      // marked.parse khai báo string | Promise<string>; không bật async nên luôn là string.
      const renderedHtml = marked.parse(markdownText) as string;
      return { resource: data, markdownHtml: DOMPurify.sanitize(renderedHtml) };
    },
    enabled: !!resourceId,
  });

  const { resource, markdownHtml } = query.data ?? EMPTY_VIEW;

  return {
    resource,
    markdownHtml,
    isLoading: query.isLoading,
    errorMessage: query.isError
      ? 'Không thể mở tài liệu markdown. Vui lòng thử lại sau.'
      : '',
  };
}
