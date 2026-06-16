import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/config/Routes';
import { useAuth } from '../hooks/useAuth';

// requiredRoleName: yêu cầu đúng tên role (vd "ADMIN").
// requiredPermission: yêu cầu một permission code (RBAC granular), vd "USER:MANAGE".
// Cả hai đọc từ AuthContext (BE trả ở login/me) → không gọi API, không nhấp nháy.
function ProtectedRoute({ children, requiredRoleName, requiredPermission, allowGuest = false }) {
  const { isAuthenticated, loading, roleName, permissions } = useAuth();
  const location = useLocation();

  if (loading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }

  // allowGuest=true: cho phép vào trang dù chưa đăng nhập; trang tự xử lý nhánh guest.
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
