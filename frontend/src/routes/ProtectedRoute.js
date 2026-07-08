import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/config/Routes';
import { useAuth } from '../hooks/useAuth';

function ProtectedRoute({ children, requiredRoleName, requiredPermission, allowGuest = false }) {
  const { isAuthenticated, loading, roleName, permissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  if (!isAuthenticated && !allowGuest) {
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

  if (requiredRoleName && roleName !== requiredRoleName) {
    return <Navigate to={routes.notFoundPage} replace />;
  }

  if (
    requiredPermission &&
    !(Array.isArray(permissions) && permissions.includes(requiredPermission))
  ) {
    return <Navigate to={routes.notFoundPage} replace />;
  }

  return children;
}

export default ProtectedRoute;
