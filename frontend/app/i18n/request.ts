import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

const loaders = {
  vi: () => import('./messages/vi'),
  en: () => import('./messages/en'),
};

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: (await loaders[locale]()).default,
    // Chỉ để next-intl không cảnh báo thiếu múi giờ. Ngày giờ hiển thị đi qua app/utils/format-date-time
    // (toLocaleString, theo múi giờ máy người dùng); đừng dùng useFormatter().dateTime vì nó ép múi giờ này.
    timeZone: 'Asia/Ho_Chi_Minh',
  };
});
