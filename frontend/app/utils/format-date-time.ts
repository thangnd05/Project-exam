type DateInput = string | number | Date | null | undefined;

// Hàm thuần nên không gọi được hook của next-intl: lấy ngôn ngữ từ <html lang> (do app/[locale]/layout đặt
// theo URL). Ngày giờ ở đây chỉ hiện sau khi dữ liệu tải ở client nên không lệch với HTML từ server.
const dateLocale = (): string =>
  typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN';

const toDate = (value: DateInput): Date | null => {
  if (value === null || value === undefined || value === '') return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const timePart = (date: Date, withSeconds = false): string =>
  date.toLocaleTimeString(dateLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    ...(withSeconds ? { second: '2-digit' } : {}),
    hour12: false,
  });

// Bộ định dạng chung của cả web. vi-VN mặc định đặt giờ trước ngày ("14:03 26/10/2026") nên
// ngày và giờ được ghép tay để luôn là "ngày giờ" ở mọi ngôn ngữ:
//   formatDate          26/10/2026            bảng, danh sách, thẻ
//   formatDateTime      26/10/2026 14:03      mốc có giờ (lượt làm bài, ghi chú, email...)
//   formatFullDateTime  26/10/2026 14:03:22   nhật ký cần tới giây (audit log)
//   formatLongDate      26 tháng 10, 2026     tiêu đề, bài viết, chứng chỉ
export const formatDate = (value: DateInput, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit', year: 'numeric' });
};

export const formatDateTime = (value: DateInput, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDate(date)} ${timePart(date)}`;
};

export const formatFullDateTime = (value: DateInput, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDate(date)} ${timePart(date, true)}`;
};

export const formatLongDate = (value: DateInput, options: { weekday?: boolean } = {}, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(dateLocale(), {
    ...(options.weekday ? { weekday: 'long' } : {}),
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

// dd/MM HH:mm - không có năm, dùng cho lịch mở/đóng đề.
export const formatDayMonthTime = (value: DateInput, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return `${formatDayMonth(date)} ${timePart(date)}`;
};

export const formatDayMonth = (value: DateInput, fallback = '-'): string => {
  const date = toDate(value);
  if (!date) return fallback;
  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });
};

export const formatHourMinute24 = (value: DateInput): string => {
  const date = toDate(value);
  return date ? timePart(date) : '';
};

export const toDateTimeLocalInput = (value: DateInput): string => {
  const date = toDate(value);
  if (!date) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const fromDateTimeLocalInput = (value: DateInput): string | null => {
  const date = toDate(value);
  return date ? date.toISOString() : null;
};
