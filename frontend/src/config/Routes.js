const routes = {
  home: '/',
  about: '/about',
  posts: '/posts',
  postDetail: '/posts/:postId',
  policy: '/policy',
  service: '/service',

  // 🧩 Test / Exam
  testStart: '/tests/:testId/start',
  testResult: '/tests/result/:userTestId',
  classChapterPage: '/class/:classId/chapters',

  createTestFromBank: '/admin/create-test-from-bank',
  personalQuestionBank: '/admin/personal-question-bank',

  // 🛠️ Admin Dashboard
  adminDashboard: '/admin/dashboard',
  adminUsers: '/admin/users',
  adminRoles: '/admin/roles',
  adminSkills: '/admin/skills',
  adminScoringConversion: '/admin/scoring-conversion',
  adminEvaluations: '/admin/evaluations',
  adminExamTypes: '/admin/exam-types',
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

  testHistory: '/tests/history/:testId',
  testLeaderboard: '/tests/leaderboard/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  MyTest: '/my-tests',

  // 📚 Learning Plan
  generatePlan: '/learning-plans/generate',
  planCompare: '/learning-plans/compare',
  myPlans: '/learning-plans',
  planDetail: '/learning-plans/:learningPlanId',
  planStudy: '/learning-plans/:learningPlanId/study',
  taskHistory: '/learning-plans/:learningPlanId/tasks/:taskId/history',

  myAlbums: '/my-albums',
  albumDelta: '/albums/:albumId',
  vocaPratice: '/practice/:albumId',

  // 🏫 Class routes
  myClasses: '/my-classes',
  classChapterTests: '/classes/:classId/chapters/:chapterId/tests',
  classMemberManagement: '/class/:classId/members',

  // 👤 Auth
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
  myEvaluations: '/my-evaluations',
  myPosts: '/my-posts',
  savedPosts: '/saved-posts',

  oauth2Redirect: '/oauth2/redirect',

  notFoundPage: '/not-found',
  notFound: '*',
};

export default routes;
