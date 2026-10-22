type DateInput = string | number | Date | null | undefined;

// Hàm thuần nên không gọi được hook của next-intl: lấy ngôn ngữ từ <html lang> (do app/[locale]/layout đặt
// theo URL). Ngày giờ ở đây chỉ hiện sau khi dữ liệu tải ở client nên không lệch với HTML từ server.
const dateLocale = (): string =>
  typeof document !== 'undefined' && document.documentElement.lang === 'en' ? 'en-US' : 'vi-VN';

export const toDateTimeLocalInput = (value: DateInput): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

export const fromDateTimeLocalInput = (value: DateInput): string | null => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};

export const formatDateTime = (value: DateInput): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(dateLocale());
};

export const formatDateTime24 = (value: DateInput): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleString(dateLocale(), { hour12: false });
};

// dd/MM HH:mm - không có năm, dùng cho lịch mở/đóng đề.
export const formatDayMonthTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString(dateLocale(), {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// dd/MM/yyyy HH:mm:ss
export const formatFullDateTime = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString(dateLocale(), {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
};

export const formatDayMonth = (value: DateInput): string => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value);
  }

  return date.toLocaleDateString(dateLocale(), { day: '2-digit', month: '2-digit' });
};

export const formatHourMinute24 = (value: DateInput): string => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString(dateLocale(), {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
