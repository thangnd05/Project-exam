import { hasLocale } from 'next-intl';
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';
import { withBrandNames } from './brandNames';

const loaders = {
  vi: () => import('./messages/vi'),
  en: () => import('./messages/en'),
};

// Bản dịch không đổi trong suốt vòng đời server nên chỉ thay tên thương hiệu một lần mỗi ngôn ngữ.
type Messages = Awaited<ReturnType<(typeof loaders)['vi']>>['default'];
const cache = new Map<string, Messages>();

async function loadMessages(locale: keyof typeof loaders) {
  let messages = cache.get(locale);
  if (!messages) {
    messages = withBrandNames((await loaders[locale]()).default);
    cache.set(locale, messages);
  }
  return messages;
}

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;

  return {
    locale,
    messages: await loadMessages(locale),
    // Chỉ để next-intl không cảnh báo thiếu múi giờ. Ngày giờ hiển thị đi qua app/utils/format-date-time
    // (toLocaleString, theo múi giờ máy người dùng); đừng dùng useFormatter().dateTime vì nó ép múi giờ này.
    timeZone: 'Asia/Ho_Chi_Minh',
  };
});
