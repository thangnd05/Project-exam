'use client';

import { PALETTE_STORAGE_KEY, PALETTES, THEME_STORAGE_KEY } from '@/app/constants/theme';

// Áp theme sáng/tối và bảng màu đã lưu trước khi vẽ trang để không nháy màu mặc định.
const THEME_INIT_SCRIPT = `(function(){try{var d=document.documentElement;if(localStorage.getItem(${JSON.stringify(THEME_STORAGE_KEY)})==='dark'){d.setAttribute('data-theme','dark');d.setAttribute('data-bs-theme','dark')}var p=localStorage.getItem(${JSON.stringify(PALETTE_STORAGE_KEY)});if(${JSON.stringify(PALETTES)}.indexOf(p)>-1){d.setAttribute('data-palette',p)}}catch(e){}})();`;

// Script chỉ cần chạy một lần khi trình duyệt parse HTML từ server. Đi giữa hai ngôn ngữ làm root layout
// ([locale]) mount lại ở client: lúc đó script không chạy nữa mà React 19 còn cảnh báo "Encountered a
// script tag", nên phía client đánh dấu nó là khối dữ liệu (text/plain) để React bỏ qua.
export default function ThemeInitScript() {
  return (
    <script
      id="theme-init"
      type={typeof window === 'undefined' ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }}
    />
  );
}
