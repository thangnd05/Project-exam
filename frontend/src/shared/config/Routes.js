const routes = {
  home: '/',
  about: '/about',
  posts: '/posts',
  postDetail: '/posts/:postId',
  recoveryResourceView: '/resources/:resourceId',
  policy: '/policy',
  service: '/service',

  testStart: '/tests/:testId/start',
  testResult: '/tests/result/:userTestId',
  testReview: '/tests/result/:userTestId/review',
  classChapterPage: '/class/:classId/chapters',

  createTestFromBank: '/admin/create-test-from-bank',
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
  adminClasses: '/admin/classes',
  adminTests: '/admin/tests',
  adminQuestions: '/admin/questions',
  adminVocabulary: '/admin/vocabulary',
  adminCategories: '/admin/categories',
  adminQuestionCollections: '/admin/question-collections',
  adminPosts: '/admin/posts',
  adminMilestones: '/admin/milestones',
  adminAnalytics: '/admin/analytics',
  adminAuditLogs: '/admin/audit-logs',
  adminLoginAudit: '/admin/audit-login',
  adminCoins: '/admin/coins',
  adminQuests: '/admin/quests',
  adminCosmetics: '/admin/cosmetics',
  adminStreakRecover: '/admin/streak-recover',

  testHistory: '/tests/history/:testId',
  testLeaderboard: '/tests/leaderboard/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  examTypeCollection: '/exam-types/:examTypeId/collections/:collectionId',
  MyTest: '/my-tests',

  generatePlan: '/learning-plans/generate',
  planCompare: '/learning-plans/compare',
  planDetail: '/learning-plans/:learningPlanId',
  planStudy: '/learning-plans/:learningPlanId/study',
  planResult: '/learning-plans/:learningPlanId/tasks/:taskId/result',
  taskHistory: '/learning-plans/:learningPlanId/tasks/:taskId/history',

  myAlbums: '/my-albums',
  albumDelta: '/albums/:albumId',
  vocaPratice: '/practice/:albumId',

  myClasses: '/my-classes',
  classChapterTests: '/classes/:classId/chapters/:chapterId/tests',
  classMemberManagement: '/class/:classId/members',

  login: '/login',
  forgot: '/forgot',
  reset: '/reset',
  verifyEmail: '/verify',
  profile: '/profile',
  myTarget: '/my-target',
  targetDashboard: '/my-target/dashboard',
  mockHistory: '/my-target/mocks',
  targetAchieved: '/my-target/achieved',
  nextStep: '/next-step',

  oauth2Redirect: '/oauth2/redirect',

  notFoundPage: '/not-found',
  notFound: '*',
};

export function buildExamTypeDetailPath(examTypeId) {
  if (!examTypeId) return routes.home;
  return `/exam-types/${encodeURIComponent(examTypeId)}`;
}

export function buildExamTypeCollectionPath(examTypeId, collectionId) {
  if (!examTypeId || !collectionId) return routes.home;
  return `/exam-types/${encodeURIComponent(examTypeId)}/collections/${encodeURIComponent(collectionId)}`;
}

export function buildNextStepPath(examTypeId) {
  if (!examTypeId) return routes.nextStep;
  return `${routes.nextStep}?examTypeId=${encodeURIComponent(examTypeId)}`;
}

export default routes;
