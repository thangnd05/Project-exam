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
  adminExamCategories: '/admin/exam-categories',
  adminExamParts: '/admin/exam-parts',
  adminClasses: '/admin/classes',
  adminTests: '/admin/tests',
  adminQuestions: '/admin/questions',
  adminVocabulary: '/admin/vocabulary',
  adminCategories: '/admin/categories',
  adminQuestionCollections: '/admin/question-collections',
  adminPosts: '/admin/posts',
  adminAnalytics: '/admin/analytics',
  adminAuditLogs: '/admin/audit-logs',
  adminLoginAudit: '/admin/audit-login',

  testHistory: '/tests/history/:testId',
  testLeaderboard: '/tests/leaderboard/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  MyTest: '/my-tests',

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
  myEvaluations: '/my-evaluations',
  myPosts: '/my-posts',
  savedPosts: '/saved-posts',

  oauth2Redirect: '/oauth2/redirect',

  notFoundPage: '/not-found',
  notFound: '*',
};

export default routes;
