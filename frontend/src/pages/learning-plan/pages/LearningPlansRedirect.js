import { Navigate, useLocation } from 'react-router-dom';
import routes from '~/config/Routes';

function LearningPlansRedirect() {
  const { search } = useLocation();
  return <Navigate to={`${routes.generatePlan}${search}`} replace />;
}

export default LearningPlansRedirect;
