const routes = {
  home: '/',
  about: '/about',
  posts: '/posts',
  postDetail: '/posts/:postId',
  recoveryResourceView: '/resources/:resourceId',
  policy: '/privacy-policy',
  service: '/terms',
  contact: '/contact',

  classChapterPage: '/class/:classId/chapters',

  personalQuestionBank: '/dashboard/question-bank',

  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminRoles: '/admin/roles',
  adminPermissions: '/admin/permissions',
  adminSkills: '/admin/skills',
  adminScoringConversion: '/admin/scoring-conversion',
  adminEvaluations: '/admin/evaluations',
  adminExamTypes: '/admin/exam-types',
  adminExamTypeLayout: '/admin/exam-types/:examTypeId/layout',
  adminTags: '/admin/tags',
  adminRecoveryResources: '/admin/recovery-resources',
  adminExamCategories: '/admin/exam-categories',
  adminExamParts: '/admin/exam-parts',
  adminTests: '/admin/tests',
  adminCategories: '/admin/categories',
  adminQuestions: '/admin/questions',
  adminQuestionCollections: '/admin/question-collections',
  adminPosts: '/admin/posts',
  adminMilestones: '/admin/milestones',
  adminAnalytics: '/admin/analytics',
  adminEmails: '/admin/emails',
  adminAuditLogs: '/admin/audit-logs',
  adminLoginAudit: '/admin/audit-login',
  adminCoins: '/admin/coins',
  adminQuests: '/admin/quests',
  adminCosmetics: '/admin/cosmetics',
  adminStreakRecover: '/admin/streak-recover',
  adminCertificates: '/admin/certificates',

  examTypes: '/exams',
  resources: '/resources',
  comingSoon: '/coming-soon',

  myCertificates: '/dashboard/certificates',
  certificateVerifyHome: '/certificates/verify',

  learningPlans: '/learning-paths',
  generatePlan: '/learning-paths/create',
  // Chi tiết lộ trình và các trang con là trang cá nhân: /dashboard/learning-paths/<id>/...
  learningPlanBase: '/dashboard/learning-paths',
  planCompare: '/dashboard/learning-paths/compare',

  myAlbums: '/my-albums',

  myClasses: '/my-classes',
  classChapterTests: '/classes/:classId/chapters/:chapterId/tests',
  classMemberManagement: '/class/:classId/members',

  login: '/login',
  forgot: '/forgot-password',
  reset: '/reset',
  dashboard: '/dashboard',
  myTarget: '/goals/new',
  targetDashboard: '/dashboard/goals',
  targetAchieved: '/dashboard/goals/achieved',

  notFoundPage: '/404',
} as const;

type ExamTypeRef =
  | string
  | number
  | null
  | undefined
  | { examTypeId?: string | null; slug?: string | null; parentSlug?: string | null };

// Có slug thì dùng đường dẫn slug (/exams/aws/saa-c03); chỉ có id thì dùng /exams/<id>,
// trang chi tiết sẽ tự chuyển hướng 308 sang đường dẫn slug.
function examTypeSegment(exam: ExamTypeRef): string {
  if (exam && typeof exam === 'object') {
    if (exam.slug) {
      return exam.parentSlug
        ? `${encodeURIComponent(exam.parentSlug)}/${encodeURIComponent(exam.slug)}`
        : encodeURIComponent(exam.slug);
    }
    return exam.examTypeId ? encodeURIComponent(exam.examTypeId) : '';
  }
  return exam ? encodeURIComponent(exam) : '';
}

export function buildExamTypeDetailPath(exam: ExamTypeRef): string {
  const segment = examTypeSegment(exam);
  return segment ? `/exams/${segment}` : routes.home;
}

export function buildExamTypeCollectionPath(
  exam: ExamTypeRef,
  collectionId: string | number | null | undefined,
): string {
  const segment = examTypeSegment(exam);
  if (!segment || !collectionId) return routes.home;
  return `/exams/${segment}/collections/${encodeURIComponent(collectionId)}`;
}

export type TestPage = 'start' | 'history' | 'leaderboard';

// Làm bài là trang chung (/mock-exams/<đề>/take); lịch sử và bảng xếp hạng là trang cá nhân dưới /dashboard/mock-exams.
const TEST_PAGE_PATH: Record<TestPage, (key: string) => string> = {
  start: (key) => `/mock-exams/${key}/take`,
  history: (key) => `/dashboard/mock-exams/${key}/attempts`,
  leaderboard: (key) => `/dashboard/mock-exams/${key}/leaderboard`,
};

// Có slug thì dùng slug của đề (aws-dop-c02-test-1); chỉ có id thì dùng id, trang server tự tra ra đề.
export function buildTestPath(
  test: { slug?: string | null; testId: string },
  page: TestPage,
): string {
  return TEST_PAGE_PATH[page](encodeURIComponent(test.slug || test.testId));
}

// Mã kỳ thi trên URL mục tiêu: slug nhóm + slug kỳ thi (aws-saa-c03), kỳ thi một cấp thì chỉ slug.
export function examGoalCode(exam: { slug?: string | null; parentSlug?: string | null }): string {
  if (!exam.slug) return '';
  return exam.parentSlug ? `${exam.parentSlug}-${exam.slug}` : exam.slug;
}

/** Trang mục tiêu của một kỳ thi: /dashboard/goals/aws-saa-c03 (chưa có slug thì về danh sách mục tiêu). */
export function buildGoalPath(exam: { slug?: string | null; parentSlug?: string | null } | null | undefined): string {
  const code = exam ? examGoalCode(exam) : '';
  return code ? `${routes.targetDashboard}/${encodeURIComponent(code)}` : routes.targetDashboard;
}

export default routes;
