import routes from '~/shared/config/Routes';
import Login from '~/features/user/login/login';
import ForgotPassword from '~/features/user/login/forgot';
import ResetPassWord from '~/features/user/login/reset';
import TestPage from '~/features/home/HomePage';
import TestByExamTypePage from '~/features/exam/examtype/examtypeById/TestByExamTypePage';
import TestByCollectionPage from '~/features/exam/examtype/examtypeById/TestByCollectionPage';
import TestStartPage from '~/features/exam/examtype/examtypeById/testStart/TestStartPage';
import TestResultPage from '~/features/exam/examtype/examtypeById/result/TestResultPage';
import TestReviewPage from '~/features/exam/examtype/examtypeById/result/TestReviewPage';
import TestHistoryPage from '~/features/history/TestHistoryPage';
import TestLeaderboardPage from '~/features/leaderboard/TestLeaderboardPage';
import MyClassesPage from '~/features/myclass/MyClassPage';
import TestByClassPage from '~/features/myclass/testclass/TestByClassPage';
import Policy from '~/features/static/policy/policy';
import Service from '~/features/static/policy/service';
import About from '~/features/static/about';
import PostsPage from '~/features/posts/PostsPage';
import PostDetailPage from '~/features/posts/PostDetailPage';
import RecoveryResourceViewPage from '~/features/resources/RecoveryResourceViewPage';
import MyAlbumsPage from '~/features/album/list/MyAlbumPage';
import AlbumDetailPage from '~/features/album/detail/AlbumDetailPage';
import PracticePage from '~/features/album/practice/PracticePage';
import MyTestPage from '~/features/mytest/MyTestPage';
import VerifyEmailPage from '~/features/user/login/VerifyEmailPage';
import OAuth2Redirect from '~/features/user/login/OAuth2Redirect';
import NotFoundPage from '~/features/static/error/NotFoundPage';
import ChapterOfClass from '~/features/myclass/chapter/ChapterOfClass';
import ClassMemberManagementPage from '~/features/myclass/class-member/ClassMemberManagementPage';
import CreateTestFromBankPage from '~/features/create-test-from-bank/CreateTestFromBankPage';
import PersonalQuestionBankPage from '~/features/question-bank/PersonalQuestionBankPage';
import ProfileOverviewPage from '~/features/profile/ProfileOverviewPage';

import AdminDashboard from '~/admin/overview/Dashboard';
import UsersManagement from '~/admin/access/Users';
import RolesManagement from '~/admin/access/Roles';
import PermissionsManagement from '~/admin/access/Permissions';
import SkillsManagement from '~/admin/exam-content/Skills';
import ScoringConversionManagement from '~/admin/exam-content/ScoringConversion';
import EvaluationsManagement from '~/admin/content/Evaluations';
import AnalyticsPage from '~/admin/overview/Analytics';
import AuditLogs from '~/admin/overview/AuditLogs';
import LoginAudit from '~/admin/overview/LoginAudit';
import TestsManagement from '~/admin/exam-content/Tests';
import ExamTypesManagement from '~/admin/exam-content/ExamTypes';
import ExamTypeLayoutEditor from '~/admin/exam-content/ExamTypeLayoutEditor';
import ExamCategoriesManagement from '~/admin/exam-content/ExamCategories';
import ExamPartsManagement from '~/admin/exam-content/ExamParts';
import CategoriesManagement from '~/admin/exam-content/Categories';
import PostsManagement from '~/admin/content/Posts';
import QuestionCollectionsManagement from '~/admin/exam-content/QuestionCollections';
import TagsManagement from '~/admin/exam-content/Tags';
import RecoveryResourcesManagement from '~/admin/content/RecoveryResources';
import MilestonesManagement from '~/admin/gamification/Milestones';
import CoinsManagement from '~/admin/gamification/Coins';
import QuestsManagement from '~/admin/gamification/Quests';
import CosmeticsManagement from '~/admin/gamification/Cosmetics';
import StreakRecoverManagement from '~/admin/gamification/StreakRecover';
import UserTargetPage from '~/features/user/target/UserTargetPage';
import TargetDashboardPage from '~/features/user/target/TargetDashboardPage';
import TargetAchievedPage from '~/features/user/target/TargetAchievedPage';
import MockHistoryPage from '~/features/user/mock-history/MockHistoryPage';
import NextStepPage from '~/features/user/next-step/NextStepPage';
import GeneratePlanPage from '~/features/learning-plan/pages/GeneratePlanPage';
import PlanDetailPage from '~/features/learning-plan/pages/PlanDetailPage';
import PlanStudyPage from '~/features/learning-plan/pages/PlanStudyPage';
import LearningPlansRedirect from '~/features/learning-plan/pages/LearningPlansRedirect';
import PlanComparisonPage from '~/features/learning-plan/pages/PlanComparisonPage';
import TaskHistoryPage from '~/features/learning-plan/pages/TaskHistoryPage';

export const publicRoutes = [
  { path: routes.login, component: Login },
  { path: routes.forgot, component: ForgotPassword },
  { path: routes.reset, component: ResetPassWord },
  { path: routes.home, component: TestPage },
  { path: routes.examTypeDetail, component: TestByExamTypePage },
  { path: routes.examTypeCollection, component: TestByCollectionPage },
  { path: routes.policy, component: Policy },
  { path: routes.service, component: Service },
  { path: routes.about, component: About },
  { path: routes.posts, component: PostsPage },
  { path: routes.postDetail, component: PostDetailPage },
  { path: routes.recoveryResourceView, component: RecoveryResourceViewPage, noLayout: true },
  { path: routes.verifyEmail, component: VerifyEmailPage },
  { path: routes.notFoundPage, component: NotFoundPage },
  { path: routes.notFound, component: NotFoundPage },
];

export const adminRoutes = [
  { path: routes.adminDashboard, component: AdminDashboard },
  { path: routes.adminUsers, component: UsersManagement },
  { path: routes.adminRoles, component: RolesManagement },
  { path: routes.adminPermissions, component: PermissionsManagement },
  { path: routes.adminSkills, component: SkillsManagement },
  { path: routes.adminScoringConversion, component: ScoringConversionManagement },
  { path: routes.adminEvaluations, component: EvaluationsManagement },
  { path: routes.adminExamTypes, component: ExamTypesManagement },
  { path: routes.adminExamTypeLayout, component: ExamTypeLayoutEditor },
  { path: routes.adminExamCategories, component: ExamCategoriesManagement },
  { path: routes.adminExamParts, component: ExamPartsManagement },
  { path: routes.adminTests, component: TestsManagement },
  { path: routes.adminAnalytics, component: AnalyticsPage },
  { path: routes.adminAuditLogs, component: AuditLogs },
  { path: routes.adminLoginAudit, component: LoginAudit },
  { path: routes.adminCategories, component: CategoriesManagement },
  { path: routes.adminPosts, component: PostsManagement },
  { path: routes.adminQuestionCollections, component: QuestionCollectionsManagement },
  { path: routes.adminTags, component: TagsManagement },
  { path: routes.adminRecoveryResources, component: RecoveryResourcesManagement },
  { path: routes.adminMilestones, component: MilestonesManagement },
  { path: routes.adminCoins, component: CoinsManagement },
  { path: routes.adminQuests, component: QuestsManagement },
  { path: routes.adminCosmetics, component: CosmeticsManagement },
  { path: routes.adminStreakRecover, component: StreakRecoverManagement },
];

export const privateRoutes = [
  {
    path: routes.testStart,
    component: TestStartPage,
    noContainer: true,
    allowGuest: true,
    hideFooter: true,
    hideScrollToTop: true,
  },
  { path: routes.testResult, component: TestResultPage, allowGuest: true },
  {
    path: routes.testReview,
    component: TestReviewPage,
    allowGuest: true,
    hideFooter: true,
    hideScrollToTop: true,
  },
  { path: routes.testHistory, component: TestHistoryPage },
  { path: routes.testLeaderboard, component: TestLeaderboardPage },
  { path: routes.myClasses, component: MyClassesPage },
  { path: routes.classChapterTests, component: TestByClassPage },
  { path: routes.myAlbums, component: MyAlbumsPage },
  { path: routes.albumDelta, component: AlbumDetailPage },
  { path: routes.vocaPratice, component: PracticePage },
  { path: routes.MyTest, component: MyTestPage },
  { path: routes.oauth2Redirect, component: OAuth2Redirect },
  { path: routes.classChapterPage, component: ChapterOfClass },
  { path: routes.classMemberManagement, component: ClassMemberManagementPage },
  { path: routes.createTestFromBank, component: CreateTestFromBankPage },
  { path: routes.personalQuestionBank, component: PersonalQuestionBankPage },
  { path: routes.profile, component: ProfileOverviewPage },
  { path: routes.myTarget, component: UserTargetPage },
  { path: '/learning-plans', component: LearningPlansRedirect },
  { path: routes.generatePlan, component: GeneratePlanPage },
  { path: routes.planCompare, component: PlanComparisonPage },
  { path: routes.planDetail, component: PlanDetailPage },
  { path: routes.planStudy, component: PlanStudyPage },
  { path: routes.taskHistory, component: TaskHistoryPage },
  { path: routes.targetDashboard, component: TargetDashboardPage },
  { path: routes.mockHistory, component: MockHistoryPage },
  { path: routes.targetAchieved, component: TargetAchievedPage },
  { path: routes.nextStep, component: NextStepPage },
];

const appRoutes = { publicRoutes, privateRoutes, adminRoutes };

export default appRoutes;
