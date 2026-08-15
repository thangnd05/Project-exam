import { lazy } from 'react';
import routes from '~/shared/config/Routes';
import { PERMISSIONS as P } from '~/shared/config/permissions';

const Login = lazy(() => import('~/features/user/login/LoginPage'));
const ForgotPassword = lazy(() => import('~/features/user/login/ForgotPasswordPage'));
const ResetPassWord = lazy(() => import('~/features/user/login/ResetPasswordPage'));
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
const Policy = lazy(() => import('~/features/landing/policy/PolicyPage'));
const Service = lazy(() => import('~/features/landing/policy/ServicePage'));
const About = lazy(() => import('~/features/landing/about'));
const PostsPage = lazy(() => import('~/features/posts/PostsPage'));
const PostDetailPage = lazy(() => import('~/features/posts/PostDetailPage'));
const RecoveryResourceViewPage = lazy(() => import('~/features/diagnostic/resources/RecoveryResourceViewPage'));
const MyAlbumsPage = lazy(() => import('~/features/albums/list/MyAlbumPage'));
const AlbumDetailPage = lazy(() => import('~/features/albums/detail/AlbumDetailPage'));
const PracticePage = lazy(() => import('~/features/albums/practice/PracticePage'));
const MyTestPage = lazy(() => import('~/features/user/mytest/MyTestPage'));
// [TẮT XÁC THỰC EMAIL] const VerifyEmailPage = lazy(() => import('~/features/user/login/VerifyEmailPage'));
const OAuth2Redirect = lazy(() => import('~/features/user/login/OAuth2Redirect'));
const NotFoundPage = lazy(() => import('~/app/error/NotFoundPage'));
const ChapterOfClass = lazy(() => import('~/features/classes/chapters/ChapterOfClass'));
const ClassMemberManagementPage = lazy(() => import('~/features/classes/members/ClassMemberManagementPage'));
const CreateTestFromBankPage = lazy(() => import('~/features/tests/create-test-from-bank/CreateTestFromBankPage'));
const PersonalQuestionBankPage = lazy(() => import('~/features/tests/question-bank/PersonalQuestionBankPage'));
const ProfileOverviewPage = lazy(() => import('~/features/user/profile/ProfileOverviewPage'));
const MyCertificatesPage = lazy(() => import('~/features/certificate/MyCertificatesPage'));
const CertificateDetailPage = lazy(() => import('~/features/certificate/CertificateDetailPage'));
const CertificateVerifyPage = lazy(() => import('~/features/certificate/CertificateVerifyPage'));

const AdminDashboardPage = lazy(() => import('~/features/admin/overview/AdminDashboardPage'));
const UsersManagementPage = lazy(() => import('~/features/admin/access/UsersManagementPage'));
const RolesManagementPage = lazy(() => import('~/features/admin/access/RolesManagementPage'));
const PermissionsManagementPage = lazy(() => import('~/features/admin/access/PermissionsManagementPage'));
const SkillsManagementPage = lazy(() => import('~/features/admin/exam-content/SkillsManagementPage'));
const ScoringConversionManagementPage = lazy(() => import('~/features/admin/exam-content/ScoringConversionManagementPage'));
const EvaluationsManagementPage = lazy(() => import('~/features/admin/content/EvaluationsManagementPage'));
const AnalyticsPage = lazy(() => import('~/features/admin/overview/AnalyticsPage'));
const AuditLogsPage = lazy(() => import('~/features/admin/overview/AuditLogsPage'));
const EmailsManagementPage = lazy(() => import('~/features/admin/system/EmailsManagementPage'));
const LoginAuditPage = lazy(() => import('~/features/admin/overview/LoginAuditPage'));
const TestsManagementPage = lazy(() => import('~/features/admin/exam-content/TestsManagementPage'));
const ExamTypesManagementPage = lazy(() => import('~/features/admin/exam-content/ExamTypesManagementPage'));
const ExamTypeLayoutEditorPage = lazy(() => import('~/features/admin/exam-content/ExamTypeLayoutEditorPage'));
const ExamCategoriesManagementPage = lazy(() => import('~/features/admin/exam-content/ExamCategoriesManagementPage'));
const ExamPartsManagementPage = lazy(() => import('~/features/admin/exam-content/ExamPartsManagementPage'));
const CategoriesManagementPage = lazy(() => import('~/features/admin/exam-content/CategoriesManagementPage'));
const PostsManagementPage = lazy(() => import('~/features/admin/content/PostsManagementPage'));
const QuestionCollectionsManagementPage = lazy(() => import('~/features/admin/exam-content/QuestionCollectionsManagementPage'));
const TagsManagementPage = lazy(() => import('~/features/admin/exam-content/TagsManagementPage'));
const RecoveryResourcesManagementPage = lazy(() => import('~/features/admin/content/RecoveryResourcesManagementPage'));
const MilestonesManagementPage = lazy(() => import('~/features/admin/gamification/MilestonesManagementPage'));
const CoinsManagementPage = lazy(() => import('~/features/admin/gamification/CoinsManagementPage'));
const QuestsManagementPage = lazy(() => import('~/features/admin/gamification/QuestsManagementPage'));
const CosmeticsManagementPage = lazy(() => import('~/features/admin/gamification/CosmeticsManagementPage'));
const StreakRecoverManagementPage = lazy(() => import('~/features/admin/gamification/StreakRecoverManagementPage'));
const CertificatesManagementPage = lazy(() => import('~/features/admin/certificate/CertificatesManagementPage'));
const UserTargetPage = lazy(() => import('~/features/diagnostic/target/UserTargetPage'));
const TargetDashboardPage = lazy(() => import('~/features/diagnostic/target/TargetDashboardPage'));
const TargetAchievedPage = lazy(() => import('~/features/diagnostic/target/TargetAchievedPage'));
const MockHistoryRedirect = lazy(() => import('~/features/diagnostic/mock-history/MockHistoryRedirect'));
const GeneratePlanPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/GeneratePlanPage'));
const PlanDetailPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanDetailPage'));
const PlanStudyPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanStudyPage'));
const PlanResultPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanResultPage'));
const LearningPlansRedirect = lazy(() => import('~/features/diagnostic/learning-plans/pages/LearningPlansRedirect'));
const PlanComparisonPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanComparisonPage'));
const TaskHistoryPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/TaskHistoryPage'));
const PlanSessionReviewPage = lazy(() => import('~/features/diagnostic/learning-plans/pages/PlanSessionReviewPage'));

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
  // [TẮT XÁC THỰC EMAIL] { path: routes.verifyEmail, component: VerifyEmailPage },
  { path: routes.certificateVerifyHome, component: CertificateVerifyPage },
  { path: routes.certificateVerify, component: CertificateVerifyPage },
  { path: routes.notFoundPage, component: NotFoundPage, noLayout: true },
  { path: routes.notFound, component: NotFoundPage, noLayout: true },
];

/**
 * Mỗi trang admin khai báo đúng quyền mà backend đòi ở các API của trang đó, để một vai trò
 * tự tạo (không phải ADMIN) vẫn vào được đúng phần được giao. Thiếu `permission` thì App.js
 * rơi về khoá cứng vai trò ADMIN.
 */
export const adminRoutes = [
  { path: routes.adminDashboard, component: AdminDashboardPage, permission: P.DASHBOARD_VIEW },
  { path: routes.adminUsers, component: UsersManagementPage, permission: P.USER_MANAGE },
  { path: routes.adminRoles, component: RolesManagementPage, permission: P.ROLE_MANAGE },
  { path: routes.adminPermissions, component: PermissionsManagementPage, permission: P.ROLE_MANAGE },
  { path: routes.adminSkills, component: SkillsManagementPage, permission: P.SKILL_MANAGE },
  { path: routes.adminScoringConversion, component: ScoringConversionManagementPage, permission: P.SCORING_CONVERSION_MANAGE },
  { path: routes.adminEvaluations, component: EvaluationsManagementPage, permission: P.EVALUATION_MANAGE },
  { path: routes.adminExamTypes, component: ExamTypesManagementPage, permission: P.EXAM_TYPE_MANAGE },
  { path: routes.adminExamTypeLayout, component: ExamTypeLayoutEditorPage, permission: P.EXAM_TYPE_LAYOUT_MANAGE },
  { path: routes.adminExamCategories, component: ExamCategoriesManagementPage, permission: P.EXAM_CATEGORY_MANAGE },
  { path: routes.adminExamParts, component: ExamPartsManagementPage, permission: P.EXAM_PART_MANAGE },
  { path: routes.adminTests, component: TestsManagementPage, permission: P.TEST_MANAGE },
  { path: routes.adminAnalytics, component: AnalyticsPage, permission: P.DASHBOARD_VIEW },
  { path: routes.adminEmails, component: EmailsManagementPage, permission: P.EMAIL_MANAGE },
  { path: routes.adminAuditLogs, component: AuditLogsPage, permission: P.AUDIT_VIEW },
  { path: routes.adminLoginAudit, component: LoginAuditPage, permission: P.AUDIT_VIEW },
  { path: routes.adminCategories, component: CategoriesManagementPage, permission: P.POST_CATEGORY_MANAGE },
  { path: routes.adminPosts, component: PostsManagementPage, permission: P.POST_MODERATE },
  { path: routes.adminQuestionCollections, component: QuestionCollectionsManagementPage, permission: P.QUESTION_COLLECTION_MANAGE },
  { path: routes.adminTags, component: TagsManagementPage, permission: P.TAG_MANAGE },
  { path: routes.adminRecoveryResources, component: RecoveryResourcesManagementPage, permission: P.RECOVERY_RESOURCE_MANAGE },
  { path: routes.adminMilestones, component: MilestonesManagementPage, permission: P.MILESTONE_MANAGE },
  { path: routes.adminCoins, component: CoinsManagementPage, permission: P.COIN_MANAGE },
  { path: routes.adminQuests, component: QuestsManagementPage, permission: P.QUEST_MANAGE },
  { path: routes.adminCosmetics, component: CosmeticsManagementPage, permission: P.COSMETIC_MANAGE },
  { path: routes.adminStreakRecover, component: StreakRecoverManagementPage, permission: P.STREAK_CONFIG_MANAGE },
  { path: routes.adminCertificates, component: CertificatesManagementPage, permission: P.CERTIFICATE_MANAGE },
];

/** Tra quyền theo path, để sidebar ẩn mục mà người dùng không mở được. */
export const adminPermissionByPath = Object.fromEntries(
  adminRoutes.filter((route) => route.permission).map((route) => [route.path, route.permission]),
);

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
  { path: routes.myCertificates, component: MyCertificatesPage },
  { path: routes.certificateDetail, component: CertificateDetailPage },
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
  {
    path: routes.planStudy,
    component: PlanStudyPage,
    hideFooter: true,
    hideScrollToTop: true,
  },
  {
    path: routes.planResult,
    component: PlanResultPage,
    hideFooter: true,
    hideScrollToTop: true,
  },
  { path: routes.taskHistory, component: TaskHistoryPage },
  {
    path: routes.planSessionReview,
    component: PlanSessionReviewPage,
    hideFooter: true,
    hideScrollToTop: true,
  },
  { path: routes.targetDashboard, component: TargetDashboardPage },
  { path: routes.mockHistory, component: MockHistoryRedirect },
  { path: routes.targetAchieved, component: TargetAchievedPage },
];

const appRoutes = { publicRoutes, privateRoutes, adminRoutes };

export default appRoutes;
