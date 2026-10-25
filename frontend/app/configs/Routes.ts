const routes = {
  home: '/',
  about: '/about',
  posts: '/posts',
  postDetail: '/posts/:postId',
  recoveryResourceView: '/resources/:resourceId',
  policy: '/policy',
  service: '/service',

  classChapterPage: '/class/:classId/chapters',

  personalQuestionBank: '/admin/personal-question-bank',

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

  testHistory: '/tests/:testId/history',
  examTypes: '/exam-types',
  resources: '/resources',
  comingSoon: '/coming-soon',

  myCertificates: '/my-certificates',
  certificateVerifyHome: '/certificates/verify',

  learningPlans: '/learning-plans',
  generatePlan: '/learning-plans/generate',

  myAlbums: '/my-albums',

  myClasses: '/my-classes',
  classChapterTests: '/classes/:classId/chapters/:chapterId/tests',
  classMemberManagement: '/class/:classId/members',

  login: '/login',
  forgot: '/forgot',
  reset: '/reset',
  dashboard: '/dashboard',
  myTarget: '/my-target',
  targetDashboard: '/my-target/dashboard',

  notFoundPage: '/not-found',
} as const;

type ExamTypeRef =
  | string
  | number
  | null
  | undefined
  | { examTypeId?: string | null; slug?: string | null; parentSlug?: string | null };

// Có slug thì dùng đường dẫn slug (/exam-types/aws/saa-c03); chỉ có id thì dùng /exam-types/<id>,
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
  return segment ? `/exam-types/${segment}` : routes.home;
}

export function buildExamTypeCollectionPath(
  exam: ExamTypeRef,
  collectionId: string | number | null | undefined,
): string {
  const segment = examTypeSegment(exam);
  if (!segment || !collectionId) return routes.home;
  return `/exam-types/${segment}/collections/${encodeURIComponent(collectionId)}`;
}

export type TestPage = 'start' | 'history' | 'leaderboard';

// Có slug thì dùng /tests/aws-dop-c02-test-1/<trang>; chỉ có id thì /tests/<id>/<trang>, proxy chuyển hướng 308 sang slug.
export function buildTestPath(
  test: { slug?: string | null; testId: string },
  page: TestPage,
): string {
  return `/tests/${encodeURIComponent(test.slug || test.testId)}/${page}`;
}

export default routes;
