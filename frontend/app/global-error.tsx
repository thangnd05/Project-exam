'use client';

import { useSyncExternalStore } from 'react';
import { routing, splitLocale, type Locale } from '@/app/i18n/routing';
import viSystem from '@/app/i18n/messages/vi/System.json';
import enSystem from '@/app/i18n/messages/en/System.json';

// Trang này tự render <html> riêng, nằm ngoài NextIntlClientProvider nên không dùng được hook của next-intl:
// lấy ngôn ngữ từ URL, server render bản mặc định rồi client đổi theo đường dẫn sau khi hydrate.
const MESSAGES: Record<Locale, typeof viSystem.globalError> = {
  vi: viSystem.globalError,
  en: enSystem.globalError,
};

const subscribe = () => () => {};
const getLocale = () => splitLocale(window.location.pathname).locale;
const getServerLocale = () => routing.defaultLocale;

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const locale = useSyncExternalStore(subscribe, getLocale, getServerLocale);
  const t = MESSAGES[locale];

  return (
    <html lang={locale}>
      <body
        style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '16px',
          fontFamily: 'system-ui, sans-serif',
          textAlign: 'center',
          padding: '24px',
        }}
      >
        <h2 style={{ fontSize: '22px', margin: 0 }}>{t.title}</h2>
        <p style={{ fontSize: '15px', margin: 0, maxWidth: '520px' }}>
          {t.message}
        </p>
        <button
          type="button"
          onClick={reset}
          style={{
            padding: '10px 20px',
            fontSize: '15px',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          {t.retry}
        </button>
        {error.digest ? (
          <span style={{ fontSize: '12px', fontFamily: 'monospace' }}>{t.codeLabel} {error.digest}</span>
        ) : null}
      </body>
    </html>
  );
}
