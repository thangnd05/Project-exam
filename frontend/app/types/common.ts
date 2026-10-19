import type { AxiosError } from 'axios';

export interface MessageResponse {
  message?: string;
}

export interface PageResponse<T> {
  content: T[];
  currentPage: number;
  size: number;
  totalElements: number;
  totalPages: number;
  hasNext: boolean;
}

/** Body lỗi backend trả về (message hoặc error). */
export interface ApiErrorBody {
  message?: string;
  error?: string;
}

/** Lỗi request qua axiosClient — dùng làm TError cho useMutation. */
export type ApiError = AxiosError<ApiErrorBody>;
