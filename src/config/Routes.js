const routes = {
  home: '/',
  about: '/about',
  policy: '/policy',
  service: '/service',

  // 🧩 Test / Exam
  testStart: '/tests/:testId/start',
  testResult: '/tests/result/:userTestId',
  createTest: '/admin/create-test',
  classChapterPage: '/class/:classId/chapters',



  createTestNormal: '/admin/create-test-normal',
  createQuestionWithPassage: '/admin/create-questions-with-passage',
  createBulkQuestion: '/admin/create-bulk-question-to-bank',
  createQuestionPage: '/admin/create-question-page',
  createTestWithQuestions: '/admin/create-test-with-questions',
  createTestQuestionBank: '/admin/create-test-question-bank',
  unifiedCreateQuestion: '/admin/unified-create-question',
  premiumBulkQuestion: '/admin/premium-bulk-question',
  bulkPassageGroup: '/admin/bulk-passage-group',






  testHistory: '/tests/history/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  MyTest: '/my-tests',

  editTestPage: '/tests/edit/:testId',
  editQuestion: '/questions/edit/:id',

  myAlbums: '/my-albums',
  albumDelta: '/albums/:albumId',
  vocaPratice: '/practice/:albumId',

  // 🏫 Class routes
  myClasses: '/my-classes',
  classChapterTests: '/classes/:classId/chapters/:chapterId/tests',

  // 👤 Auth
  login: '/login',
  forgot: '/forgot',
  reset: '/reset',
  verifyEmail: '/verify',

  oauth2Redirect: '/oauth2/redirect',

  notFound: '*',


};

export default routes;
