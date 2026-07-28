import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/shared/config/Routes';

/**
 * Lịch sử bài thi đã gộp vào Tổng quan mục tiêu (biểu đồ + bảng nằm ngay trong đó).
 * Giữ route cũ để link/bookmark không chết — chuyển hướng và giữ nguyên examTypeId.
 */
function MockHistoryRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${routes.targetDashboard}${search}`} replace />;
}

export default MockHistoryRedirect;
