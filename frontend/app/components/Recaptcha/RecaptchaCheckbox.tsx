'use client';

import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';

// Script của Google gắn grecaptcha vào window; chưa có @types nên khai báo any có chủ đích.
declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const SCRIPT_ID = 'google-recaptcha-script';
const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=vi';

let scriptPromise: Promise<any> | null = null;

/** Nạp script của Google đúng một lần cho cả ứng dụng, kể cả khi có nhiều ô cùng lúc. */
function loadRecaptchaScript(): Promise<any> {
  if (window.grecaptcha?.render) {
    return Promise.resolve(window.grecaptcha);
  }
  if (scriptPromise) {
    return scriptPromise;
  }

  scriptPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById(SCRIPT_ID);
    const script = (existing || document.createElement('script')) as HTMLScriptElement;

    const handleLoad = () => {
      // Script đã tải xong nhưng grecaptcha còn khởi tạo tiếp, phải chờ ready.
      window.grecaptcha.ready(() => resolve(window.grecaptcha));
    };

    script.addEventListener('load', handleLoad);
    script.addEventListener('error', () => {
      scriptPromise = null;
      reject(new Error('Không tải được reCAPTCHA'));
    });

    if (!existing) {
      script.id = SCRIPT_ID;
      script.src = SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    } else if (window.grecaptcha?.render) {
      handleLoad();
    }
  });

  return scriptPromise;
}

type RecaptchaCheckboxProps = {
  siteKey?: string;
  onChange?: (token: string) => void;
  className?: string;
};

export type RecaptchaCheckboxHandle = {
  reset: () => void;
};

/**
 * Ô "Tôi không phải là người máy" (reCAPTCHA v2).
 *
 * Không dùng thư viện bọc sẵn để khỏi thêm phụ thuộc: widget này chỉ cần script của Google
 * cộng một lời gọi grecaptcha.render.
 *
 * Token trả về qua onChange chỉ sống vài phút và dùng được một lần  backend xác minh lại
 * với Google, nên bỏ qua bước đó thì bot gọi thẳng API vẫn đăng ký được.
 */
const RecaptchaCheckbox = forwardRef<RecaptchaCheckboxHandle, RecaptchaCheckboxProps>(
  function RecaptchaCheckbox({siteKey, onChange, className}, ref) {
    const containerRef = useRef<HTMLDivElement>(null);
    const widgetIdRef = useRef<number | null>(null);
    const onChangeRef = useRef(onChange);

    onChangeRef.current = onChange;

    useImperativeHandle(ref, () => ({
      reset() {
        if (widgetIdRef.current !== null && window.grecaptcha) {
          window.grecaptcha.reset(widgetIdRef.current);
          onChangeRef.current?.('');
        }
      },
    }));

    useEffect(() => {
      if (!siteKey || !containerRef.current || widgetIdRef.current !== null) {
        return undefined;
      }
      let cancelled = false;

      loadRecaptchaScript()
        .then((grecaptcha) => {
          if (cancelled || widgetIdRef.current !== null || !containerRef.current) {
            return;
          }
          widgetIdRef.current = grecaptcha.render(containerRef.current, {
            sitekey: siteKey,
            callback: (token: string) => onChangeRef.current?.(token),
            'expired-callback': () => onChangeRef.current?.(''),
            'error-callback': () => onChangeRef.current?.(''),
          });
        })
        .catch(() => {
          onChangeRef.current?.('');
        });

      return () => {
        cancelled = true;
      };
    }, [siteKey]);

    if (!siteKey) {
      return null;
    }

    return <div ref={containerRef} className={className} />;
  },
);

export default RecaptchaCheckbox;
