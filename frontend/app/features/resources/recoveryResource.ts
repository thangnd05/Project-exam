import routes from '@/app/configs/Routes';

const MARKDOWN_FILE_PATTERN = /\.(md|markdown)$/i;

export type RecoveryResourceLike = {
  resourceId?: string | number | null;
  originalFileName?: string | null;
  url?: string | null;
  resourceUrl?: string | null;
};

export const isMarkdownResource = (resource: RecoveryResourceLike | null | undefined): boolean => {
  const fileName = resource?.originalFileName || resource?.url || '';
  return MARKDOWN_FILE_PATTERN.test(fileName);
};

export const getRecoveryResourceViewPath = (resourceId: string | number | null | undefined): string | null => {
  if (!resourceId) {
    return null;
  }
  return routes.recoveryResourceView.replace(':resourceId', String(resourceId));
};

export const getRecoveryResourceOpenUrl = (
  resource: RecoveryResourceLike | null | undefined,
  apiBase = '',
): string | null => {
  if (!resource) {
    return null;
  }

  if (isMarkdownResource(resource) && resource.resourceId) {
    return getRecoveryResourceViewPath(resource.resourceId);
  }

  if (resource.resourceId) {
    const normalizedApiBase = (apiBase || '').replace(/\/$/, '');
    return normalizedApiBase
      ? `${normalizedApiBase}/api/recovery-resources/${resource.resourceId}/view`
      : `/api/recovery-resources/${resource.resourceId}/view`;
  }

  return resource.url || resource.resourceUrl || null;
};

export const getRecoveryResourceLinkProps = (
  resource: RecoveryResourceLike | null | undefined,
  apiBase = '',
): { href: string; external: boolean } | null => {
  const url = getRecoveryResourceOpenUrl(resource, apiBase);
  if (!url) {
    return null;
  }

  return { href: url, external: true };
};
