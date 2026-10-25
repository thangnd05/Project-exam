'use client';

// Next 16 + React 19 chỉ chạy trên Chrome/Edge/Firefox 111+ và Safari 16.4+ (khớp browserslist).
// Trình duyệt cũ hơn sẽ ra trang trắng, nên chuyển sang trang tĩnh giải thích cách khắc phục.
// Script viết bằng ES5 để chính trình duyệt cũ cũng chạy được; lookbehind trong RegExp có từ Safari 16.4.
const UNSUPPORTED_PAGE = '/unsupported-browser.html';

const BROWSER_SUPPORT_SCRIPT = `(function(){var ok;try{ok=typeof structuredClone==='function';new RegExp('(?<=a)b')}catch(e){ok=false}if(!ok){location.replace(${JSON.stringify(UNSUPPORTED_PAGE)})}})();`;

// Phía client đánh dấu text/plain vì cùng lý do với ThemeInitScript: root layout mount lại khi đổi ngôn ngữ.
export default function BrowserSupportScript() {
  return (
    <script
      id="browser-support"
      type={typeof window === 'undefined' ? undefined : 'text/plain'}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: BROWSER_SUPPORT_SCRIPT }}
    />
  );
}
