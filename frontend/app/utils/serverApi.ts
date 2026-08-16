/**
 * Gọi backend từ phía server (generateMetadata, RSC).
 *
 * Khác với axiosClient: chạy trong tiến trình Next nên không đi qua proxy /api mà nối
 * thẳng tới Spring bằng API_ORIGIN, và không mang cookie của người dùng — vì vậy chỉ
 * dùng cho endpoint công khai (GET permitAll trong SecurityConfig).
 */

const API_ORIGIN = (process.env.API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

/**
 * Phân biệt "backend nói không có" với "không hỏi được backend".
 * Nhầm hai ca này là hỏng nặng: backend chết mà trả `missing` thì cả site thành 404.
 */
export type PublicResource<T> =
  | { ok: true; data: T }
  | { ok: false; missing: true }
  | { ok: false; missing: false };

export async function fetchPublicResource<T>(
  path: string,
  revalidate = 300,
): Promise<PublicResource<T>> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate } });
    if (res.status === 404) return { ok: false, missing: true };
    if (!res.ok) return { ok: false, missing: false };
    return { ok: true, data: (await res.json()) as T };
  } catch {
    return { ok: false, missing: false };
  }
}

/** Bản rút gọn cho chỗ chỉ cần dữ liệu, không quan tâm vì sao thiếu (metadata, sitemap). */
export async function fetchPublicJson<T>(path: string, revalidate = 300): Promise<T | null> {
  const res = await fetchPublicResource<T>(path, revalidate);
  return res.ok ? res.data : null;
}
