type ApiErrorLike = {
  // `detail` là trường của ProblemDetail (Spring) mà các endpoint import/preview trả về.
  response?: { data?: { message?: string; detail?: string; error?: string } };
};

export function getApiErrorMessage(error: unknown, fallback = 'Đã có lỗi xảy ra. Vui lòng thử lại.'): string {
  const err = error as ApiErrorLike | null | undefined;
  return (
    err?.response?.data?.message ||
    err?.response?.data?.detail ||
    err?.response?.data?.error ||
    fallback
  );
}

export default getApiErrorMessage;
