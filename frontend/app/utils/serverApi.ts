/**
 * Gọi backend từ phía server (generateMetadata, RSC).
 *
 * Khác với axiosClient: chạy trong tiến trình Next nên không đi qua proxy /api mà nối
 * thẳng tới Spring bằng API_ORIGIN, và không mang cookie của người dùng — vì vậy chỉ
 * dùng cho endpoint công khai (GET permitAll trong SecurityConfig).
 *
 * Lỗi mạng hay 4xx/5xx đều trả null: metadata thiếu thì trang vẫn phải render được.
 */

const API_ORIGIN = (process.env.API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

export async function fetchPublicJson<T>(path: string, revalidate = 300): Promise<T | null> {
  try {
    const res = await fetch(`${API_ORIGIN}${path}`, { next: { revalidate } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
