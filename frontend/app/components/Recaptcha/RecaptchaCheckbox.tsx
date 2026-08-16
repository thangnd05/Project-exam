'use client';

import {forwardRef, useEffect, useImperativeHandle, useRef} from 'react';

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const SCRIPT_ID = 'google-recaptcha-script';
const SCRIPT_SRC = 'https://www.google.com/recaptcha/api.js?render=explicit&hl=vi';

let scriptPromise: Promise<any> | null = null;

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
