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
