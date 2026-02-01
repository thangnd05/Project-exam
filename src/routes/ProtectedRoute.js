import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hook/useAuth";

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();


  if (loading) {
    return <div>Đang kiểm tra đăng nhập...</div>;
  }


  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{
          from: location,
          flashMessage: "Bạn cần đăng nhập để truy cập trang này!"
        }}
        replace
      />
    );
  }

  return children;
}

export default ProtectedRoute;
