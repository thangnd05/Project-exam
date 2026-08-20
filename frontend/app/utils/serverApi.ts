const API_ORIGIN = (process.env.API_ORIGIN || 'http://localhost:8080').replace(/\/$/, '');

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

export async function fetchPublicJson<T>(path: string, revalidate = 300): Promise<T | null> {
  const res = await fetchPublicResource<T>(path, revalidate);
  return res.ok ? res.data : null;
}
