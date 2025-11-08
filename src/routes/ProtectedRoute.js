import React from 'react';
import {useLocation, Navigate} from 'react-router-dom';
import {useAuth} from '../hook/useAuth';

function ProtectedRoute({children}) {
  // Lấy trạng thái đăng nhập từ hook useAuth
  const {isAuthenticated, loading} = useAuth();
  const location = useLocation();

  // Nếu đang trong quá trình kiểm tra session, hiển thị loading để tránh bị redirect oan
  if (loading) {
    return <div>Đang tải trang, vui lòng chờ...</div>;
  }

  // Nếu chưa được xác thực (chưa đăng nhập)
  if (!isAuthenticated) {
    // Chuyển hướng người dùng đến trang /login
    // Đồng thời, gửi kèm 'location' hiện tại vào state
    // để trang Login biết và chuyển hướng ngược lại sau khi đăng nhập thành công.

    return <Navigate to="/login" state={{from: location}} replace />;
  }

  // Nếu đã đăng nhập, cho phép hiển thị nội dung của trang
  return children;
}

export default ProtectedRoute;
