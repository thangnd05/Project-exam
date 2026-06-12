import { useEffect, useState } from 'react';
import { getRoles } from '~/api/roleApi';
import { useAuth } from './useAuth';

// Phân giải roleId -> roleName để biết user hiện tại có phải ADMIN không.
// Dùng chung cho UI cần ẩn/hiện theo quyền admin (vd: ô giá xu khi tạo bài).
export const useIsAdmin = () => {
  const { isAuthenticated, roleId } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!isAuthenticated || !roleId) {
      setIsAdmin(false);
      return undefined;
    }
    getRoles()
      .then((data) => {
        const roles = Array.isArray(data) ? data : [];
        const current = roles.find((role) => String(role.roleId) === String(roleId));
        if (!cancelled) setIsAdmin(current?.roleName === 'ADMIN');
      })
      .catch(() => {
        if (!cancelled) setIsAdmin(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, roleId]);

  return isAdmin;
};
