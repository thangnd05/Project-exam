
const routes = {


    home: '/',
   


    about: '/about',
    policy:'/policy',
    service:'/service',
    testStart: '/tests/:testId/start',  // <--- đây là teststart
    testResult :'/test/:testId/result/:userTestId',

    examTypeDetail: '/exam-types/:examTypeId',



    login: '/login',
    register: '/register',
    forgot:"/forgot",
    reset:'/reset',




};

export default routes;
