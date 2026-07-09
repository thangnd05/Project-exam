import routes from '~/shared/config/Routes';

const MARKDOWN_FILE_PATTERN = /\.(md|markdown)$/i;

export const isMarkdownResource = (resource) => {
  const fileName = resource?.originalFileName || resource?.url || '';
  return MARKDOWN_FILE_PATTERN.test(fileName);
};

export const getRecoveryResourceViewPath = (resourceId) => {
  if (!resourceId) {
    return null;
  }
  return routes.recoveryResourceView.replace(':resourceId', String(resourceId));
};

export const getRecoveryResourceOpenUrl = (resource, apiBase = '') => {
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

export const getRecoveryResourceLinkProps = (resource, apiBase = '') => {
  const url = getRecoveryResourceOpenUrl(resource, apiBase);
  if (!url) {
    return null;
  }

  return { href: url, external: true };
};
