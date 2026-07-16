import { lazy } from 'react';
import routes from '~/shared/config/Routes';

// Lazy-load tất cả trang -> mỗi route thành 1 chunk riêng, giảm bundle khởi tạo.
// (App.js bọc <Routes> trong <Suspense>.)
const Login = lazy(() => import('~/features/user/login/login'));
const ForgotPassword = lazy(() => import('~/features/user/login/forgot'));
const ResetPassWord = lazy(() => import('~/features/user/login/reset'));
const TestPage = lazy(() => import('~/features/landing/HomePage'));
const TestByExamTypePage = lazy(() => import('~/features/tests/exam/exam-types/detail/TestByExamTypePage'));
const TestByCollectionPage = lazy(() => import('~/features/tests/exam/exam-types/detail/TestByCollectionPage'));
const TestStartPage = lazy(() => import('~/features/tests/exam/exam-types/detail/testStart/TestStartPage'));
const TestResultPage = lazy(() => import('~/features/tests/exam/exam-types/detail/result/TestResultPage'));
const TestReviewPage = lazy(() => import('~/features/tests/exam/exam-types/detail/result/TestReviewPage'));
const TestHistoryPage = lazy(() => import('~/features/tests/history/TestHistoryPage'));
const TestLeaderboardPage = lazy(() => import('~/features/tests/leaderboard/TestLeaderboardPage'));
const MyClassesPage = lazy(() => import('~/features/classes/MyClassPage'));
const TestByClassPage = lazy(() => import('~/features/classes/class-tests/TestByClassPage'));
const Policy = lazy(() => import('~/features/landing/policy/policy'));
const Service = lazy(() => import('~/features/landing/policy/service'));
const About = lazy(() => import('~/features/landing/about'));
const PostsPage = lazy(() => import('~/features/posts/PostsPage'));
const PostDetailPage = lazy(() => import('~/features/posts/PostDetailPage'));
const RecoveryResourceViewPage = lazy(() => import('~/features/diagnostic/resources/RecoveryResourceViewPage'));
const MyAlbumsPage = lazy(() => import('~/features/albums/list/MyAlbumPage'));
const AlbumDetailPage = lazy(() => import('~/features/albums/detail/AlbumDetailPage'));
const PracticePage = lazy(() => import('~/features/albums/practice/PracticePage'));
const MyTestPage = lazy(() => import('~/features/user/mytest/MyTestPage'));
const VerifyEmailPage = lazy(() => import('~/features/user/login/VerifyEmailPage'));
const OAuth2Redirect = lazy(() => import('~/features/user/login/OAuth2Redirect'));
const NotFoundPage = lazy(() => import('~/app/error/NotFoundPage'));
const ChapterOfClass = lazy(() => import('~/features/classes/chapters/ChapterOfClass'));
const ClassMemberManagementPage = lazy(() => import('~/features/classes/members/ClassMemberManagementPage'));
const CreateTestFromBankPage = lazy(() => import('~/features/tests/create-test-from-bank/CreateTestFromBankPage'));
const PersonalQuestionBankPage = lazy(() => import('~/features/tests/question-bank/PersonalQuestionBankPage'));
const ProfileOverviewPage = lazy(() => import('~/features/user/profile/ProfileOverviewPage'));

const AdminDashboard = lazy(() => import('~/features/admin/overview/Dashboard'));
const UsersManagement = lazy(() => import('~/features/admin/access/Users'));
const RolesManagement = lazy(() => import('~/features/admin/access/Roles'));
const PermissionsManagement = lazy(() => import('~/features/admin/access/Permissions'));
const SkillsManagement = lazy(() => import('~/features/admin/exam-content/Skills'));
const ScoringConversionManagement = lazy(() => import('~/features/admin/exam-content/ScoringConversion'));
const EvaluationsManagement = lazy(() => import('~/features/admin/content/Evaluations'));
const AnalyticsPage = lazy(() => import('~/features/admin/overview/Analytics'));
const AuditLogs = lazy(() => import('~/features/admin/overview/AuditLogs'));
const LoginAudit = lazy(() => import('~/features/admin/overview/LoginAudit'));
const TestsManagement = lazy(() => import('~/features/admin/exam-content/Tests'));
const ExamTypesManagement = lazy(() => import('~/features/admin/exam-content/ExamTypes'));
const ExamTypeLayoutEditor = lazy(() => import('~/features/admin/exam-content/ExamTypeLayoutEditor'));
const ExamCategoriesManagement = lazy(() => import('~/features/admin/exam-content/ExamCategories'));
const ExamPartsManagement = lazy(() => import('~/features/admin/exam-content/ExamParts'));
const CategoriesManagement = lazy(() => import('~/features/admin/exam-content/Categories'));
const PostsManagement = lazy(() => import('~/features/admin/content/Posts'));
const QuestionCollectionsManagement = lazy(() => import('~/features/admin/exam-content/QuestionCollections'));
const TagsManagement = lazy(() => import('~/features/admin/exam-content/Tags'));
const RecoveryResourcesManagement = lazy(() => import('~/features/admin/content/RecoveryResources'));
const MilestonesManagement = lazy(() => import('~/features/admin/gamification/Milestones'));
const CoinsManagement = lazy(() => import('~/features/admin/gamification/Coins'));
const QuestsManagement = lazy(() => import('~/features/admin/gamification/Quests'));
const CosmeticsManagement = lazy(() => import('~/features/admin/gamification/Cosmetics'));
const StreakRecoverManagement = lazy(() => import('~/features/admin/gamification/StreakRecover'));
const UserTargetPage = lazy(() => import('~/features/diagnostic/target/UserTargetPage'));
const TargetDashboardPage = lazy(() => import('~/features/diagnostic/target/TargetDashboardPage'));
const TargetAchievedPage = lazy(() => import('~/features/diagnostic/target/TargetAchievedPage'));
const MockHistoryPage = lazy(() => import('~/features/diagnostic/mock-history/MockHistoryPage'));
const NextStepPage = lazy(() => import('~/features/diagnostic/next-step/NextStepPage'));
const GeneratePlanPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/GeneratePlanPage'));
const PlanDetailPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanDetailPage'));
const PlanStudyPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanStudyPage'));
const LearningPlansRedirect = lazy(() => import('~/features/diagnostic/learning-plans/pages/LearningPlansRedirect'));
const PlanComparisonPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanComparisonPage'));
const TaskHistoryPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/TaskHistoryPage'));

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
    examMode: true,
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
