import routes from '../config/index';
import Login from '~/pages/user/login/login';
import Register from '~/pages/user/login/register';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/examtypeId';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';

export const publicRoutes = [
  { path: routes.login, component: Login },
  { path: routes.register, component: Register },
  {path:routes.home, component: TestPage},
  {path:routes.examTypeDetail, component: TestByExamTypePage},
  {path:routes.testStart, component: TestStartPage},
    {path:routes.testResult, component: TestResultPage}



];

export const privateRoutes = [];

export default { publicRoutes, privateRoutes };
