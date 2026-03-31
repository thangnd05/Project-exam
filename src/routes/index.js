import routes from '../config/Routes';
import Login from '~/pages/user/login/login';
import ForgotPassword from '~/pages/user/login/forgot';
import ResetPassWord from '~/pages/user/login/reset';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/TestByExamTypePage';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';
import TestHistoryPage from '~/pages/history/TestHistoryPage';
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
import NotFoundPage from '~/pages/error/NotFoundPage';
import ChapterOfClass from '~/pages/myclass/chapter/ChapterOfClass';
import CreateTestFromBankPage from '~/pages/create-test-from-bank/CreateTestFromBankPage';
import PersonalQuestionBankPage from '~/pages/question-bank/PersonalQuestionBankPage';
import ProfileOverviewPage from '~/pages/profile/ProfileOverviewPage';

// Admin imports
import AdminLayout from '~/Admin/layouts/AdminLayout';
import AdminDashboard from '~/Admin/pages/Dashboard';
import UsersManagement from '~/Admin/pages/Users';
import ClassesManagement from '~/Admin/pages/Classes';
import TestsManagement from '~/Admin/pages/Tests';
import QuestionsManagement from '~/Admin/pages/Questions';
import VocabularyManagement from '~/Admin/pages/Vocabulary';
import AnalyticsPage from '~/Admin/pages/Analytics';

// ✅ Các trang bất kỳ ai cũng có thể xem
export const publicRoutes = [
  {path: routes.login, component: Login},
  {path: routes.forgot, component: ForgotPassword},
  {path: routes.reset, component: ResetPassWord},
  {path: routes.home, component: TestPage},
  {path: routes.examTypeDetail, component: TestByExamTypePage},
  {path: routes.policy, component: Policy},
  {path: routes.service, component: Service},
  {path: routes.about, component: About},
  {path: routes.verifyEmail, component: VerifyEmailPage},
  {path: routes.notFound, component: NotFoundPage},
];

// ✅ Các trang admin (yêu cầu quyền admin)
export const adminRoutes = [
  {path: routes.adminDashboard, component: AdminDashboard},
  {path: routes.adminUsers, component: UsersManagement},
  {path: routes.adminClasses, component: ClassesManagement},
  {path: routes.adminTests, component: TestsManagement},
  {path: routes.adminQuestions, component: QuestionsManagement},
  {path: routes.adminVocabulary, component: VocabularyManagement},
  {path: routes.adminAnalytics, component: AnalyticsPage},
];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [
  {path: routes.testStart, component: TestStartPage, noContainer: true},
  {path: routes.testResult, component: TestResultPage},
  {path: routes.testHistory, component: TestHistoryPage},
  {path: routes.myClasses, component: MyClassesPage},
  {path: routes.classChapterTests, component: TestByClassPage},
  {path: routes.myAlbums, component: MyAlbumsPage},
  {path: routes.albumDelta, component: AlbumDetailPage},
  {path: routes.vocaPratice, component: PracticePage},
  {path: routes.MyTest, component: MyTestPage},
  {path: routes.oauth2Redirect, component: MyTestPage},
  {path: routes.classChapterPage, component: ChapterOfClass},
  {path: routes.createTestFromBank, component: CreateTestFromBankPage},
  {path: routes.personalQuestionBank, component: PersonalQuestionBankPage},
  {path: routes.profile, component: ProfileOverviewPage},
];

export default {publicRoutes, privateRoutes, adminRoutes};
