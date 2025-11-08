const routes = {
  home: '/',
  about: '/about',
  policy: '/policy',
  service: '/service',

  // 🧩 Test / Exam
  testStart: '/tests/:testId/start',
  testResult: '/tests/result/:userTestId',
  createTest: '/admin/create-test',
  createTestNormal: '/admin/create-test-normal',
  createQuestion: '/admin/create-question',
  testHistory: '/tests/history/:testId',
  examTypeDetail: '/exam-types/:examTypeId',
  MyTest: '/my-test',

  editTestPage: '/tests/edit/:testId',
  editQuestion: '/questions/edit/:id',

  myAlbums: '/my-albums',
  albumDelta: '/albums/:albumId',
  vocaPratice: '/practice/:albumId',

  // 🏫 Class routes
  myClasses: '/my-classes',
  testClasses: '/class/:classId/tests',

  // 👤 Auth
  login: '/login',
  register: '/register',
  forgot: '/forgot',
  reset: '/reset',
};

export default routes;
