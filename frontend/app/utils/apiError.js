export function getApiErrorMessage(error, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.') {
  return (
    error?.response?.data?.message ||
    error?.response?.data?.error ||
    fallback
  );
}

export default getApiErrorMessage;
