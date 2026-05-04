import {useEffect, useState} from 'react';
import axios from '../api/axiosClient';
import {Navigate, useLocation} from 'react-router-dom';
import routes from '~/config/Routes';
import {useAuth} from '../hook/useAuth';

function ProtectedRoute({children, requiredRoleName}) {
  const {isAuthenticated, loading, roleId} = useAuth();
  const location = useLocation();
  const [roleChecking, setRoleChecking] = useState(false);
  const [hasRequiredRole, setHasRequiredRole] = useState(true);

  useEffect(() => {
    let cancelled = false;
    if (!requiredRoleName || !isAuthenticated || !roleId) {
      setHasRequiredRole(true);
      return undefined;
    }

    const checkRole = async () => {
      setRoleChecking(true);
      try {
        const response = await axios.get('/api/roles');
        const roles = Array.isArray(response.data) ? response.data : [];
        const currentRole = roles.find(
          (role) => String(role.roleId) === String(roleId),
        );
        const matched = currentRole?.roleName === requiredRoleName;
        if (!cancelled) {
          setHasRequiredRole(Boolean(matched));
        }
      } catch (error) {
        if (!cancelled) {
          setHasRequiredRole(false);
        }
      } finally {
        if (!cancelled) {
          setRoleChecking(false);
        }
      }
    };

    checkRole();
    return () => {
      cancelled = true;
    };
  }, [requiredRoleName, isAuthenticated, roleId]);

  if (loading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to={routes.login}
        state={{
          from: location,
          flashMessage: 'Bạn cần đăng nhập để truy cập trang này!',
        }}
        replace
      />
    );
  }

  if (requiredRoleName && roleChecking) {
    // return <div>Đang kiểm tra quyền truy cập...</div>;
  }

  if (requiredRoleName && !hasRequiredRole) {
    return <Navigate to={routes.notFoundPage} replace />;
  }

  return children;
}

export default ProtectedRoute;
