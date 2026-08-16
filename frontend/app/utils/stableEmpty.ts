/**
 * Hằng số rỗng dùng chung cho fallback của react-query (`query.data ?? EMPTY_LIST`).
 *
 * Viết `?? []` trực tiếp sẽ tạo mảng mới ở mỗi lần render khi query chưa có data
 * (đang loading hoặc `enabled: false`). Giá trị đó lọt vào dep array của
 * useEffect/useMemo sẽ khiến effect chạy lại vô hạn ("Maximum update depth exceeded").
 *
 * Kiểu `never[]` gán được vào mọi `T[]` nên không làm hỏng type inference.
 */
export const EMPTY_LIST: never[] = [];
