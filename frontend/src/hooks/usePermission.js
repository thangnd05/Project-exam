import { useAuth } from './useAuth';

/**
 * RBAC granular ở FE: đọc danh sách permission code từ AuthContext (BE trả ở login/me),
 * không gọi API. Dùng để ẩn/hiện nút theo hành động.
 *
 *   const can = usePermission();
 *   can('EXAM_TYPE:MANAGE')  // true nếu user có quyền
 *
 * Trả về hàm kiểm tra để dùng nhiều lần trong cùng component.
 */
export const usePermission = () => {
  const { permissions } = useAuth();
  return (code) => Array.isArray(permissions) && permissions.includes(code);
};

/** Tiện ích kiểm tra nhanh một permission code. */
export const useHasPermission = (code) => {
  const { permissions } = useAuth();
  return Array.isArray(permissions) && permissions.includes(code);
};
