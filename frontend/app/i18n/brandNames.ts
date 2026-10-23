import { SITE_NAME, SITE_SHORT_NAME } from '@/app/constants/site';

const BRAND_TOKENS: [RegExp, string][] = [
  [/\{siteName\}/g, SITE_NAME],
  [/\{siteShortName\}/g, SITE_SHORT_NAME],
];

// Thay tên thương hiệu vào bản dịch ngay khi nạp, nên t('...') không phải truyền siteName ở từng chỗ gọi.
// Thay trước khi next-intl đọc cú pháp ICU, nên dùng được cả trong câu có plural/select.
export function withBrandNames<T>(messages: T): T {
  if (typeof messages === 'string') {
    return BRAND_TOKENS.reduce<string>((text, [token, value]) => text.replace(token, value), messages) as T;
  }
  if (Array.isArray(messages)) {
    return messages.map((item) => withBrandNames(item)) as T;
  }
  if (messages && typeof messages === 'object') {
    return Object.fromEntries(
      Object.entries(messages).map(([key, value]) => [key, withBrandNames(value)]),
    ) as T;
  }
  return messages;
}
