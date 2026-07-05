// Tiện ích dựng URL tới backend cho media/TTS.
// Gom về đây để page/modal không phải import axiosClient chỉ để đọc baseURL
// (baseURL của axiosClient chính là REACT_APP_API_BASE_URL).

// Base URL của backend, đã bỏ dấu "/" ở cuối.
export const getApiBaseUrl = () =>
  (process.env.REACT_APP_API_BASE_URL || '').trim().replace(/\/$/, '');

// Ghép URL media tương đối từ BE thành URL tuyệt đối; URL http(s) giữ nguyên.
export const getFullMediaUrl = (url) => {
  if (!url) return null;
  const clean = url.trim();
  if (clean.startsWith('http')) return clean;
  const base = getApiBaseUrl();
  return `${base}/${clean.startsWith('/') ? clean.slice(1) : clean}`;
};

// URL đọc phát âm (TTS) cho một từ/cụm từ.
export const getTtsUrl = (text) =>
  `${getApiBaseUrl()}/api/tts?text=${encodeURIComponent(text || '')}`;
