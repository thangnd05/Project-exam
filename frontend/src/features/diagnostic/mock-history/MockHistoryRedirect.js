import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/shared/config/Routes';

function MockHistoryRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${routes.targetDashboard}${search}`} replace />;
}

export default MockHistoryRedirect;
