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

// Ngày giờ đầy đủ, định dạng 24h, trả '—' khi rỗng (dùng cho bảng/lịch sử bài thi).
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

// Nhãn ngắn dd/mm cho trục biểu đồ.
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
