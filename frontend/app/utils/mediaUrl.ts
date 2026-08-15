export const getApiBaseUrl = (): string =>
  (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim().replace(/\/$/, '');

export const getFullMediaUrl = (url: string | null | undefined): string | null => {
  if (!url) return null;
  const clean = url.trim();
  if (clean.startsWith('http')) return clean;
  const base = getApiBaseUrl();
  return `${base}/${clean.startsWith('/') ? clean.slice(1) : clean}`;
};

export const getTtsUrl = (text: string | null | undefined): string =>
  `${getApiBaseUrl()}/api/tts?text=${encodeURIComponent(text || '')}`;
