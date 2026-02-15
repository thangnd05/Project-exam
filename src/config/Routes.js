const routes = {
  home: '/',
  about: '/about',
  policy: '/policy',
  service: '/service',

  // 🧩 Test / Exam
  testStart: '/tests/:testId/start',
  testResult: '/tests/result/:userTestId',
  classChapterPage: '/class/:classId/chapters',



  createQuestionWithPassage: '/admin/create-questions-with-passage',
  createQuestionPage: '/admin/create-question-page',
  createTestQuestionBank: '/admin/create-test-question-bank',
  premiumBulkQuestion: '/admin/premium-bulk-question',
  bulkPassageGroup: '/admin/bulk-passage-group',






  testHistory: '/tests/history/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  MyTest: '/my-tests',


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
