'use client';

// useSearchParams của Next chỉ ĐỌC, còn bản react-router trả về cặp [params, setParams].
// Hook này dựng lại vế ghi để 4 trang đang lọc theo query không phải viết lại logic:
// vẫn nhận cả object, URLSearchParams, hoặc hàm (prev) => next như trước.
//
// Mặc định push (thêm một mục lịch sử) đúng như react-router; truyền {replace: true} nếu
// không muốn người dùng phải bấm Back nhiều lần chỉ vì đổi bộ lọc.

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

type SearchParamsInit = string | URLSearchParams | Record<string, string> | string[][];
type NextSearchParams = SearchParamsInit | ((prev: URLSearchParams) => SearchParamsInit);

export function useSearchParamsState() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const setSearchParams = useCallback(
    (next: NextSearchParams, { replace = false }: { replace?: boolean } = {}) => {
      const resolved =
        typeof next === 'function'
          ? next(new URLSearchParams(searchParams.toString()))
          : next;
      const params =
        resolved instanceof URLSearchParams ? resolved : new URLSearchParams(resolved);
      const qs = params.toString();
      const url = qs ? `${pathname}?${qs}` : pathname;
      if (replace) router.replace(url);
      else router.push(url);
    },
    [pathname, router, searchParams],
  );

  return [searchParams, setSearchParams] as const;
}

export default useSearchParamsState;
