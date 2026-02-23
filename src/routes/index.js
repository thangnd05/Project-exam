import routes from '../config/Routes';
import Login from '~/pages/user/login/login';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/examtypeId';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';
import TestHistoryPage from '~/pages/history/TestHistoryPage';
import CreateQuestionPage from '~/pages/question/CreateQuestionsWithPassage';
import MyClassesPage from '~/pages/myclass/MyClassPage';
import TestByClassPage from '~/pages/myclass/testclass/TestByClassPage';
import Policy from '~/pages/policy/policy';
import Service from '~/pages/policy/service';
import About from '~/pages/intro';
import MyAlbumsPage from '~/pages/album-voca/MyAlbumPage';
import AlbumDetailPage from '~/pages/album-delta/AlbumDeltaPage';
import PracticePage from '~/pages/album-pratice/PracticePage';
import MyTestPage from '~/pages/mytest/MyTestPage';
import VerifyEmailPage from '~/pages/user/login/VerifyEmailPage';
import NotFoundPage from "~/pages/error/NotFoundPage";
import PremiumBulkQuestionCreator from '~/pages/question/bulk-question/PremiumBulkQuestionCreator';
import CreateQuestionsWithPassage from "~/pages/question/CreateQuestionsWithPassage";
import ChapterOfClass from '~/pages/myclass/chapter/ChapterOfClass';
import BulkQuestionGroupCreator from '~/pages/test23/BulkQuestionGroupCreator';
import CreateTestFromBankPage from '~/pages/create-test-from-bank/CreateTestFromBankPage';
import AdminDashboard from '~/Admin/AdminDashboard';

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
  { path: routes.adminDashboard, component: AdminDashboard, noContainer: true },


];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [
  { path: routes.testStart, component: TestStartPage, noContainer: true },
  { path: routes.testResult, component: TestResultPage },


  { path: routes.createQuestionWithPassage, component: CreateQuestionsWithPassage },
  { path: routes.createQuestionPage, component: CreateQuestionPage },



  { path: routes.testHistory, component: TestHistoryPage },
  { path: routes.myClasses, component: MyClassesPage },
  { path: routes.classChapterTests, component: TestByClassPage },
  { path: routes.myAlbums, component: MyAlbumsPage },
  { path: routes.albumDelta, component: AlbumDetailPage },
  { path: routes.vocaPratice, component: PracticePage },
  { path: routes.MyTest, component: MyTestPage },
  { path: routes.oauth2Redirect, component: MyTestPage },
  { path: routes.classChapterPage, component: ChapterOfClass },
  { path: routes.createTestFromBank, component: CreateTestFromBankPage },
  { path: routes.premiumBulkQuestion, component: PremiumBulkQuestionCreator },
  { path: routes.bulkPassageGroup, component: BulkQuestionGroupCreator },
  // {
  //   path: routes.oauth2Redirect,
  //   component: MyTestPage,
  //   noContainer: true, // nếu cần full màn
  // },



];

export default { publicRoutes, privateRoutes };
