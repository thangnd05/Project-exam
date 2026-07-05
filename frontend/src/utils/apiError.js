/**
 * Trích thông điệp lỗi thân thiện từ error của axios.
 * Why: pattern `error.response?.data?.message ?? ...` bị lặp inline ở rất nhiều page/modal.
 * Gom về một chỗ để hiển thị lỗi nhất quán và dễ đổi format sau này.
 *
 * Thứ tự ưu tiên: message do backend trả -> field error -> fallback truyền vào.
 * Cố ý KHÔNG rơi xuống error.message (vd "Network Error") để tránh lộ chuỗi kỹ thuật cho user;
 * nếu nơi gọi muốn dùng error.message thì truyền nó làm fallback.
 */
export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

export default getApiErrorMessage;
