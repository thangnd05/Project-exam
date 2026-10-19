'use client';

import { useEffect, useState } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- cờ đã mount trên client: phải lệch 1 nhịp sau hydrate để tránh mismatch với SSR
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default useMounted;
