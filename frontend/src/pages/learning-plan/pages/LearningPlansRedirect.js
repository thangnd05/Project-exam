import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/config/Routes';

/** URL cũ `/learning-plans` → trang sinh lộ trình (đã gộp danh sách plan). */
function LearningPlansRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${routes.generatePlan}${search}`} replace />;
}

export default LearningPlansRedirect;
