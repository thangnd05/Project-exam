import routes from '../config/index';
import Login from '~/pages/user/login/login';
import Register from '~/pages/user/login/register';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/examtypeId';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';
import TestCreationForm from '~/pages/testnormal/TestCreateForm';
import CreateTestPage from '~/pages/test/CreateTestPage';
import TestHistoryPage from '~/pages/history/TestHistoryPage';
import CreateQuestionPage from '~/pages/question/CreateQuestionPage';

// ✅ Các trang bất kỳ ai cũng có thể xem
export const publicRoutes = [
  { path: routes.login, component: Login },
  { path: routes.register, component: Register },
  { path: routes.home, component: TestPage },
  { path: routes.examTypeDetail, component: TestByExamTypePage },
];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [

  { path: routes.testStart, component: TestStartPage },
  { path: routes.testResult, component: TestResultPage },
  { path: routes.createTest, component: CreateTestPage},
  { path: routes.createTestNormal, component: TestCreationForm},
  { path: routes.createQuestion, component: CreateQuestionPage},
  { path: routes.testHistory, component: TestHistoryPage},


  // Thêm các trang riêng tư khác ở đây, ví dụ: trang profile
  // { path: routes.profile, component: ProfilePage },
];

export default { publicRoutes, privateRoutes };