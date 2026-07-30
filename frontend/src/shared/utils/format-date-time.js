/**
 * Đổ mốc thời gian từ API vào `<input type="datetime-local">`.
 *
 * Backend trả ISO-8601 UTC ("2026-07-30T03:00:00Z") vì mọi mốc thời gian là
 * java.time.Instant. Input datetime-local lại chỉ nhận giờ địa phương không hậu
 * tố ("2026-07-30T10:00"), nên phải quy đổi chứ không được cắt chuỗi thô —
 * cắt thẳng sẽ hiển thị giờ UTC và lệch 7 tiếng.
 */
export const toDateTimeLocalInput = (value) => {
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


/** Ngược lại: giá trị `<input type="datetime-local">` -> ISO-8601 UTC để gửi API. */
export const fromDateTimeLocalInput = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value); // chuỗi không hậu tố -> trình duyệt hiểu là giờ địa phương
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date.toISOString();
};


export const formatDateTime = (value) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN');
};


export const formatDateTime24 = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleString('vi-VN', { hour12: false });
};


export const formatDayMonth = (value) => {
  if (!value) {
    return '—';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
};


export const formatHourMinute24 = (value) => {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  return date.toLocaleTimeString('vi-VN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};
