import type messages from './messages/vi';
import type { routing } from './routing';

// Key dịch được kiểm tra lúc biên dịch: gõ sai key trong t('...') là tsc báo lỗi.
declare module 'next-intl' {
  interface AppConfig {
    Locale: (typeof routing.locales)[number];
    Messages: typeof messages;
  }
}
