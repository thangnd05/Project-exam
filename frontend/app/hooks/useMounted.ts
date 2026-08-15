'use client';

// Trả về true sau lần render đầu ở trình duyệt.
//
// Cần cho mọi chỗ dùng createPortal(..., document.body): trên Vite chỉ có trình duyệt chạy code
// nên `document` luôn tồn tại, còn Next render component ở server trước nên `document` chưa có.
// Gate bằng hook này thì lần render phía server trả về null, portal chỉ dựng khi đã ở client.

import { useEffect, useState } from 'react';

export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

export default useMounted;
