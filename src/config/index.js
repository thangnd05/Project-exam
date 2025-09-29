const routes = {
    home: '/',

    about: '/about',
    policy:'/policy',
    service:'/service',

    testStart: '/tests/:testId/start',

    testResult :'/tests/:testId/result/:userTestId',
    createTest:'/admin/create-test',

    examTypeDetail: '/exam-types/:examTypeId',

    login: '/login',
    register: '/register',
    forgot:"/forgot",
    reset:'/reset',
};

export default routes;
