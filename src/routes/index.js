import routes from '../config/Routes';
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
import MyClassesPage from '~/pages/myclass/MyClassPage';
import TestByClassPage from '~/pages/myclass/testclass/TestByClassPage';
import EditTestPage from '~/pages/edit/EditTestPage';
import Policy from '~/pages/policy/policy';
import Service from '~/pages/policy/service';
import About from '~/pages/intro';
import QuestionUpdatePage from '~/pages/edit/QuestionUpdatePage';
import MyAlbumsPage from '~/pages/album-voca/MyAlbumPage';
import AlbumDetailPage from '~/pages/album-delta/AlbumDeltaPage';

// ✅ Các trang bất kỳ ai cũng có thể xem
export const publicRoutes = [
  { path: routes.login, component: Login },
  { path: routes.register, component: Register },
  { path: routes.home, component: TestPage },
  { path: routes.examTypeDetail, component: TestByExamTypePage },
  { path:routes.policy,component:Policy},
  { path:routes.service,component:Service},
  { path:routes.about,component:About},


];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [

  { path: routes.testStart, component: TestStartPage },
  { path: routes.testResult, component: TestResultPage },
  { path: routes.createTest, component: CreateTestPage},
  { path: routes.createTestNormal, component: TestCreationForm},
  { path: routes.createQuestion, component: CreateQuestionPage},
  { path: routes.testHistory, component: TestHistoryPage},
  { path: routes.myClasses, component: MyClassesPage},
  { path: routes.testClasses, component: TestByClassPage},
  { path: routes.editTestPage, component: EditTestPage},
  { path: routes.editQuestion, component: QuestionUpdatePage},
  { path: routes.myAlbums, component: MyAlbumsPage},
  { path: routes.albumDelta, component: AlbumDetailPage},








  // Thêm các trang riêng tư khác ở đây, ví dụ: trang profile
  // { path: routes.profile, component: ProfilePage },
];

export default { publicRoutes, privateRoutes };