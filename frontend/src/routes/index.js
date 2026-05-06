import routes from '../config/Routes';
import Login from '~/pages/user/login/login';
import ForgotPassword from '~/pages/user/login/forgot';
import ResetPassWord from '~/pages/user/login/reset';
import TestPage from '~/pages/exam/TestPage';
import TestByExamTypePage from '~/pages/exam/examtype/examtypeById/TestByExamTypePage';
import TestStartPage from '~/pages/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/pages/exam/examtype/examtypeById/result/TestResultPage';
import TestHistoryPage from '~/pages/history/TestHistoryPage';
import TestLeaderboardPage from '~/pages/leaderboard/TestLeaderboardPage';
import MyClassesPage from '~/pages/myclass/MyClassPage';
import TestByClassPage from '~/pages/myclass/testclass/TestByClassPage';
import Policy from '~/pages/policy/policy';
import Service from '~/pages/policy/service';
import About from '~/pages/intro';
import PostsPage from '~/pages/posts/PostsPage';
import PostDetailPage from '~/pages/posts/PostDetailPage';
import MyAlbumsPage from '~/pages/album-voca/MyAlbumPage';
import AlbumDetailPage from '~/pages/album-delta/AlbumDeltaPage';
import PracticePage from '~/pages/album-pratice/PracticePage';
import MyTestPage from '~/pages/mytest/MyTestPage';
import VerifyEmailPage from '~/pages/user/login/VerifyEmailPage';
import OAuth2Redirect from '~/pages/user/login/OAuth2Redirect';
import NotFoundPage from '~/pages/error/NotFoundPage';
import ChapterOfClass from '~/pages/myclass/chapter/ChapterOfClass';
import ClassMemberManagementPage from '~/pages/myclass/class-member/ClassMemberManagementPage';
import CreateTestFromBankPage from '~/pages/create-test-from-bank/CreateTestFromBankPage';
import PersonalQuestionBankPage from '~/pages/question-bank/PersonalQuestionBankPage';
import ProfileOverviewPage from '~/pages/profile/ProfileOverviewPage';
import MyEvaluationsPage from '~/pages/profile/MyEvaluationsPage';
import MyPostsPage from '~/pages/profile/MyPostsPage';
import SavedPostsPage from '~/pages/profile/SavedPostsPage';

// Admin imports
import AdminDashboard from '~/Admin/pages/Dashboard';
import UsersManagement from '~/Admin/pages/Users';
import RolesManagement from '~/Admin/pages/Roles';
import SkillsManagement from '~/Admin/pages/Skills';
import ScoringConversionManagement from '~/Admin/pages/ScoringConversion';
import EvaluationsManagement from '~/Admin/pages/Evaluations';
import AnalyticsPage from '~/Admin/pages/Analytics';
import AuditLogs from '~/Admin/pages/AuditLogs';
import LoginAudit from '~/Admin/pages/LoginAudit';
import TestsManagement from '~/Admin/pages/Tests';
import ExamTypesManagement from '~/Admin/pages/ExamTypes';
import ExamPartsManagement from '~/Admin/pages/ExamParts';
import CategoriesManagement from '~/Admin/pages/Categories';
import PostsManagement from '~/Admin/pages/Posts';

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
  {path: routes.posts, component: PostsPage},
  {path: routes.postDetail, component: PostDetailPage},
  {path: routes.verifyEmail, component: VerifyEmailPage},
  {path: routes.notFoundPage, component: NotFoundPage},
  {path: routes.notFound, component: NotFoundPage},
];

// ✅ Các trang admin (yêu cầu quyền admin)
export const adminRoutes = [
  {path: routes.adminDashboard, component: AdminDashboard},
  {path: routes.adminUsers, component: UsersManagement},
  {path: routes.adminRoles, component: RolesManagement},
  {path: routes.adminSkills, component: SkillsManagement},
  {path: routes.adminScoringConversion, component: ScoringConversionManagement},
  {path: routes.adminEvaluations, component: EvaluationsManagement},
  {path: routes.adminExamTypes, component: ExamTypesManagement},
  {path: routes.adminExamParts, component: ExamPartsManagement},
  {path: routes.adminTests, component: TestsManagement},
  {path: routes.adminAnalytics, component: AnalyticsPage},
  {path: routes.adminAuditLogs, component: AuditLogs},
  {path: routes.adminLoginAudit, component: LoginAudit},
  {path: routes.adminCategories, component: CategoriesManagement},
  {path: routes.adminPosts, component: PostsManagement},
];

// ✅ Các trang yêu cầu phải đăng nhập
export const privateRoutes = [
  {path: routes.testStart, component: TestStartPage, noContainer: true},
  {path: routes.testResult, component: TestResultPage},
  {path: routes.testHistory, component: TestHistoryPage},
  {path: routes.testLeaderboard, component: TestLeaderboardPage},
  {path: routes.myClasses, component: MyClassesPage},
  {path: routes.classChapterTests, component: TestByClassPage},
  {path: routes.myAlbums, component: MyAlbumsPage},
  {path: routes.albumDelta, component: AlbumDetailPage},
  {path: routes.vocaPratice, component: PracticePage},
  {path: routes.MyTest, component: MyTestPage},
  {path: routes.oauth2Redirect, component: OAuth2Redirect},
  {path: routes.classChapterPage, component: ChapterOfClass},
  {path: routes.classMemberManagement, component: ClassMemberManagementPage},
  {path: routes.createTestFromBank, component: CreateTestFromBankPage},
  {path: routes.personalQuestionBank, component: PersonalQuestionBankPage},
  {path: routes.profile, component: ProfileOverviewPage},
  {path: routes.myEvaluations, component: MyEvaluationsPage},
  {path: routes.myPosts, component: MyPostsPage},
  {path: routes.savedPosts, component: SavedPostsPage},
];

const appRoutes = {publicRoutes, privateRoutes, adminRoutes};

export default appRoutes;
