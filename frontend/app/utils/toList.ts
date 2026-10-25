import { EMPTY_LIST } from '@/app/utils/stableEmpty';

// API có thể trả mảng trực tiếp hoặc bọc trong { content } (phân trang); dữ liệu lạ trả mảng rỗng ổn định.
export const toList = <T,>(data: T[] | { content?: T[] } | null | undefined): T[] =>
  Array.isArray(data) ? data : Array.isArray(data?.content) ? data.content : EMPTY_LIST;
