import routes from '../config/Routes';
import Login from '~/pages/user/login/login';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/examtypeId';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';
import TestCreationForm from '~/pages/testnormal/TestCreateForm';
import CreateTestPage from '~/pages/test/CreateTestPage';
import TestHistoryPage from '~/pages/history/TestHistoryPage';
import CreateQuestionPage from '~/pages/question/CreateQuestionsWithPassage';
import MyClassesPage from '~/pages/myclass/MyClassPage';
import TestByClassPage from '~/pages/myclass/testclass/TestByClassPage';
import EditTestPage from '~/pages/edit/EditTestPage';
import Policy from '~/pages/policy/policy';
import Service from '~/pages/policy/service';
import About from '~/pages/intro';
import QuestionUpdatePage from '~/pages/edit/QuestionUpdatePage';
import MyAlbumsPage from '~/pages/album-voca/MyAlbumPage';
import AlbumDetailPage from '~/pages/album-delta/AlbumDeltaPage';
import PracticePage from '~/pages/album-pratice/PracticePage';
import MyTestPage from '~/pages/mytest/MyTestPage';
import VerifyEmailPage from '~/pages/user/login/VerifyEmailPage';
import NotFoundPage from "~/pages/error/NotFoundPage";
import CreateBulkQuestionsToBank from '~/pages/question/bulk-question/CreateBulkQuestionsToBank';
import CreateRealTest from '~/pages/question/CreateRealTest';
import CreateQuestionsWithPassage from "~/pages/question/CreateQuestionsWithPassage"

// ✅ Các trang bất kỳ ai cũng có thể xem
export const publicRoutes = [
  { path: routes.login, component: Login },
  { path: routes.home, component: TestPage },
  { path: routes.examTypeDetail, component: TestByExamTypePage },
  { path: routes.policy, component: Policy },
  { path: routes.service, component: Service },
  { path: routes.about, component: About },
  { path: routes.verifyEmail, component: VerifyEmailPage },
  { path: routes.notFound, component: NotFoundPage },

];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [
  { path: routes.testStart, component: TestStartPage },
  { path: routes.testResult, component: TestResultPage },


  { path: routes.createTest, component: CreateTestPage },
  { path: routes.createTestNormal, component: TestCreationForm },
  { path: routes.createQuestionWithPassage, component: CreateQuestionsWithPassage },
  { path: routes.createQuestionPage, component: CreateQuestionPage },
  { path: routes.createTestWithQuestions, component: CreateRealTest },
  { path: routes.createBulkQuestion, component: CreateBulkQuestionsToBank },



  { path: routes.testHistory, component: TestHistoryPage },
  { path: routes.myClasses, component: MyClassesPage },
  { path: routes.testClasses, component: TestByClassPage },
  { path: routes.editTestPage, component: EditTestPage },
  { path: routes.editQuestion, component: QuestionUpdatePage },
  { path: routes.myAlbums, component: MyAlbumsPage },
  { path: routes.albumDelta, component: AlbumDetailPage },
  { path: routes.vocaPratice, component: PracticePage },
  { path: routes.MyTest, component: MyTestPage },
  { path: routes.oauth2Redirect, component: MyTestPage },
  // {
  //   path: routes.oauth2Redirect,
  //   component: MyTestPage,
  //   noContainer: true, // nếu cần full màn
  // },



];

export default { publicRoutes, privateRoutes };
