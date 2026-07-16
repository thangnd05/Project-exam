export const getApiBaseUrl = () =>
  (import.meta.env.VITE_API_BASE_URL || '').trim().replace(/\/$/, '');

export const getFullMediaUrl = (url) => {
  if (!url) return null;
  const clean = url.trim();
  if (clean.startsWith('http')) return clean;
  const base = getApiBaseUrl();
  return `${base}/${clean.startsWith('/') ? clean.slice(1) : clean}`;
};

export const getTtsUrl = (text) =>
  `${getApiBaseUrl()}/api/tts?text=${encodeURIComponent(text || '')}`;
