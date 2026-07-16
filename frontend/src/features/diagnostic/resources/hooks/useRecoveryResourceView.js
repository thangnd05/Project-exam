import { useQuery } from '@tanstack/react-query';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { getResourceById, viewResourceContent } from '~/shared/api/recoveryResourceApi';
import { isMarkdownResource } from '~/shared/utils/recoveryResource';
import { getApiBaseUrl } from '~/shared/utils/mediaUrl';

const API_BASE = getApiBaseUrl();

marked.setOptions({
  gfm: true,
  breaks: true,
});

export const recoveryResourceViewKeys = {
  detail: (id) => ['recovery-resource-view', id],
};

const EMPTY_VIEW = { resource: null, markdownHtml: '' };

export function useRecoveryResourceView(resourceId) {
  const query = useQuery({
    queryKey: recoveryResourceViewKeys.detail(resourceId),
    queryFn: async () => {
      const data = await getResourceById(resourceId);

      if (!isMarkdownResource(data)) {
        const viewUrl = API_BASE
          ? `${API_BASE}/api/recovery-resources/${resourceId}/view`
          : `/api/recovery-resources/${resourceId}/view`;
        window.location.replace(viewUrl);
        return EMPTY_VIEW;
      }

      const markdownText = await viewResourceContent(resourceId);
      const renderedHtml = marked.parse(markdownText);
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
