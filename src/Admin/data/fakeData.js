// ============================================
// FAKE DATA SERVICE - Dựa trên Database Schema
// Database: english_exam
// ============================================

// ---- Roles ----
export const roles = [
    { role_id: 1, role_name: 'ADMIN', description: 'Quản trị viên' },
    { role_id: 2, role_name: 'TEACHER', description: 'Giáo viên' },
    { role_id: 3, role_name: 'USER', description: 'Học sinh/Người dùng' },
];

// ---- Users ----
export const fakeUsers = [
    { user_id: 1, user_name: 'admin01', full_name: 'Nguyễn Văn Admin', email: 'admin@example.com', role_id: 1, verified: 1, created_at: '2024-01-15', avatar_url: null },
    { user_id: 2, user_name: 'teacher_anh', full_name: 'Trần Thị Anh', email: 'anh.teacher@example.com', role_id: 2, verified: 1, created_at: '2024-02-10', avatar_url: null },
    { user_id: 3, user_name: 'teacher_minh', full_name: 'Lê Văn Minh', email: 'minh.teacher@example.com', role_id: 2, verified: 1, created_at: '2024-02-20', avatar_url: null },
    { user_id: 4, user_name: 'student_hung', full_name: 'Phạm Văn Hùng', email: 'hung.student@example.com', role_id: 3, verified: 1, created_at: '2024-03-05', avatar_url: null },
    { user_id: 5, user_name: 'student_lan', full_name: 'Hoàng Thị Lan', email: 'lan.student@example.com', role_id: 3, verified: 1, created_at: '2024-03-10', avatar_url: null },
    { user_id: 6, user_name: 'student_tuyet', full_name: 'Đỗ Thị Tuyết', email: 'tuyet.student@example.com', role_id: 3, verified: 0, created_at: '2024-03-15', avatar_url: null },
    { user_id: 7, user_name: 'student_duy', full_name: 'Ngô Văn Duy', email: 'duy.student@example.com', role_id: 3, verified: 1, created_at: '2024-03-20', avatar_url: null },
    { user_id: 8, user_name: 'student_nhi', full_name: 'Lý Thị Nhi', email: 'nhi.student@example.com', role_id: 3, verified: 1, created_at: '2024-04-01', avatar_url: null },
    { user_id: 9, user_name: 'student_khoi', full_name: 'Vũ Văn Khôi', email: 'khoi.student@example.com', role_id: 3, verified: 1, created_at: '2024-04-05', avatar_url: null },
    { user_id: 10, user_name: 'student_linh', full_name: 'Trịnh Thị Linh', email: 'linh.student@example.com', role_id: 3, verified: 0, created_at: '2024-04-10', avatar_url: null },
];

// ---- Classes ----
export const fakeClasses = [
    { class_id: 1, class_name: 'Anh Văn Giao Tiếp', description: 'Lớp học anh văn giao tiếp cơ bản', teacher_id: 2, created_at: '2024-02-15' },
    { class_id: 2, class_name: 'IELTS Preparation', description: 'Lớp luyện thi IELTS 6.5+', teacher_id: 2, created_at: '2024-02-20' },
    { class_id: 3, class_name: 'TOIEC Bridge', description: 'Lớp luyện thi TOEIC cơ bản', teacher_id: 3, created_at: '2024-03-01' },
    { class_id: 4, class_name: 'English Grammar', description: 'Ngữ pháp tiếng Anh nâng cao', teacher_id: 3, created_at: '2024-03-10' },
];

// ---- Class Members ----
export const fakeClassMembers = [
    { id: 1, class_id: 1, user_id: 4, status: 'APPROVED', joined_at: '2024-03-06' },
    { id: 2, class_id: 1, user_id: 5, status: 'APPROVED', joined_at: '2024-03-11' },
    { id: 3, class_id: 1, user_id: 6, status: 'PENDING', joined_at: '2024-03-16' },
    { id: 4, class_id: 2, user_id: 4, status: 'APPROVED', joined_at: '2024-03-07' },
    { id: 5, class_id: 2, user_id: 7, status: 'APPROVED', joined_at: '2024-03-21' },
    { id: 6, class_id: 2, user_id: 8, status: 'APPROVED', joined_at: '2024-04-02' },
    { id: 7, class_id: 3, user_id: 5, status: 'APPROVED', joined_at: '2024-03-12' },
    { id: 8, class_id: 3, user_id: 9, status: 'APPROVED', joined_at: '2024-04-06' },
    { id: 9, class_id: 4, user_id: 10, status: 'PENDING', joined_at: '2024-04-11' },
];

// ---- Exam Types ----
export const fakeExamTypes = [
    { exam_type_id: 1, name: 'IELTS Academic', description: 'Bài thi IELTS học thuật', duration_minutes: 180, scoring_method: 'BANDS' },
    { exam_type_id: 2, name: 'TOEFL iBT', description: 'Bài thi TOEFL internet-based', duration_minutes: 210, scoring_method: 'SCORE' },
    { exam_type_id: 3, name: 'TOEIC', description: 'Bài thi TOEIC', duration_minutes: 120, scoring_method: 'DEFAULT' },
    { exam_type_id: 4, name: 'Cambridge', description: 'Bài thi Cambridge', duration_minutes: 150, scoring_method: 'SCORE' },
];

// ---- Exam Parts ----
export const fakeExamParts = [
    { exam_part_id: 1, exam_type_id: 1, name: 'Listening', description: 'Phần thi Nghe', default_num_questions: 40, skill_id: 4, has_passage: 0 },
    { exam_part_id: 2, exam_type_id: 1, name: 'Reading', description: 'Phần thi Đọc', default_num_questions: 40, skill_id: 5, has_passage: 1 },
    { exam_part_id: 3, exam_type_id: 1, name: 'Writing', description: 'Phần thi Viết', default_num_questions: 2, skill_id: 6, has_passage: 0 },
    { exam_part_id: 4, exam_type_id: 1, name: 'Speaking', description: 'Phần thi Nói', default_num_questions: 3, skill_id: 3, has_passage: 0 },
    { exam_part_id: 5, exam_type_id: 3, name: 'Listening', description: 'Phần thi Nghe', default_num_questions: 100, skill_id: 4, has_passage: 0 },
    { exam_part_id: 6, exam_type_id: 3, name: 'Reading', description: 'Phần thi Đọc', default_num_questions: 100, skill_id: 5, has_passage: 1 },
];

// ---- Skills ----
export const fakeSkills = [
    { skill_id: 1, name: 'Vocabulary', description: 'Từ vựng' },
    { skill_id: 2, name: 'Grammar', description: 'Ngữ pháp' },
    { skill_id: 3, name: 'Speaking', description: 'Nói' },
    { skill_id: 4, name: 'Listening', description: 'Nghe' },
    { skill_id: 5, name: 'Reading', description: 'Đọc' },
    { skill_id: 6, name: 'Writing', description: 'Viết' },
];

// ---- Chapters ----
export const fakeChapters = [
    { chapter_id: 1, class_id: 1, title: 'Unit 1: Greetings', description: 'Bài học về cách chào hỏi', created_at: '2024-02-16' },
    { chapter_id: 2, class_id: 1, title: 'Unit 2: Self Introduction', description: 'Bài học về tự giới thiệu', created_at: '2024-02-23' },
    { chapter_id: 3, class_id: 2, title: 'Unit 1: Reading Strategy', description: 'Chiến lược đọc IELTS', created_at: '2024-02-21' },
    { chapter_id: 4, class_id: 2, title: 'Unit 2: Writing Task 1', description: 'Bài viết Task 1', created_at: '2024-02-28' },
    { chapter_id: 5, class_id: 3, title: 'Part 1: Photographs', description: 'Phần 1: Hình ảnh', created_at: '2024-03-02' },
];

// ---- Tests ----
export const fakeTests = [
    { test_id: 1, exam_type_id: 1, title: 'IELTS Mock Test 1', description: 'Đề thi thử IELTS số 1', created_by: 2, created_at: '2024-03-01', duration_minutes: 180, max_attempts: 3, class_id: 2, chapter_id: 3 },
    { test_id: 2, exam_type_id: 1, title: 'IELTS Mock Test 2', description: 'Đề thi thử IELTS số 2', created_by: 2, created_at: '2024-03-05', duration_minutes: 180, max_attempts: 2, class_id: 2, chapter_id: 4 },
    { test_id: 3, exam_type_id: 3, title: 'TOEIC Practice Test 1', description: 'Bài luyện TOEIC số 1', created_by: 3, created_at: '2024-03-10', duration_minutes: 120, max_attempts: 5, class_id: 3, chapter_id: 5 },
    { test_id: 4, exam_type_id: 3, title: 'Full TOEIC Test', description: 'Đề thi TOEIC đầy đủ', created_by: 3, created_at: '2024-03-15', duration_minutes: 120, max_attempts: 3, class_id: 3, chapter_id: null },
    { test_id: 5, exam_type_id: 1, title: 'IELTS Reading Practice', description: 'Luyện đọc IELTS', created_by: 2, created_at: '2024-03-20', duration_minutes: 60, max_attempts: 10, class_id: null, chapter_id: null },
];

// ---- Questions ----
export const fakeQuestions = [
    { question_id: 1, exam_part_id: 1, passage_id: null, question_text: 'What time does the conversation take place?', question_type: 'MCQ', explanation: 'The conversation mentions "morning" multiple times', created_by: 2, class_id: null, chapter_id: null, is_bank: 1 },
    { question_id: 2, exam_part_id: 1, passage_id: null, question_text: 'Where is the woman going?', question_type: 'MCQ', explanation: 'She says she is going to the library', created_by: 2, class_id: null, chapter_id: null, is_bank: 1 },
    { question_id: 3, exam_part_id: 2, passage_id: 1, question_text: 'What is the main idea of the passage?', question_type: 'MCQ', explanation: 'The passage discusses climate change impacts', created_by: 2, class_id: null, chapter_id: null, is_bank: 1 },
    { question_id: 4, exam_part_id: 2, passage_id: 1, question_text: 'According to the passage, what causes sea level rise?', question_type: 'MCQ', explanation: 'The passage mentions multiple factors', created_by: 2, class_id: 2, chapter_id: 3, is_bank: 0 },
    { question_id: 5, exam_part_id: 5, passage_id: null, question_text: 'Listen and choose the correct answer for the photograph.', question_type: 'MCQ', explanation: 'Focus on details in the image', created_by: 3, class_id: 3, chapter_id: 5, is_bank: 0 },
];

// ---- Answers ----
export const fakeAnswers = [
    { answer_id: 1, question_id: 1, answer_label: 'A', answer_text: 'In the morning', is_correct: 1 },
    { answer_id: 2, question_id: 1, answer_label: 'B', answer_text: 'In the afternoon', is_correct: 0 },
    { answer_id: 3, question_id: 1, answer_label: 'C', answer_text: 'In the evening', is_correct: 0 },
    { answer_id: 4, question_id: 1, answer_label: 'D', answer_text: 'At night', is_correct: 0 },
    { answer_id: 5, question_id: 2, answer_label: 'A', answer_text: 'To the library', is_correct: 1 },
    { answer_id: 6, question_id: 2, answer_label: 'B', answer_text: 'To the park', is_correct: 0 },
    { answer_id: 7, question_id: 2, answer_label: 'C', answer_text: 'To the school', is_correct: 0 },
    { answer_id: 8, question_id: 2, answer_label: 'D', answer_text: 'To the office', is_correct: 0 },
];

// ---- Vocabulary Albums ----
export const fakeVocabularyAlbums = [
    { album_id: 1, name: 'IELTS Essential Words', description: 'Từ vựng thiết yếu IELTS', user_id: 2, created_at: '2024-02-01' },
    { album_id: 2, name: 'Business English', description: 'Tiếng Anh thương mại', user_id: 2, created_at: '2024-02-15' },
    { album_id: 3, name: 'Daily Conversation', description: 'Hội thoại hàng ngày', user_id: 3, created_at: '2024-03-01' },
];

// ---- Vocabulary ----
export const fakeVocabulary = [
    { vocab_id: 1, word: 'Accelerate', phonetic: '/əkˈseləreɪt/', meaning: 'Tăng tốc, đẩy nhanh', example: 'The government must accelerate economic reforms.', album_id: 1, voice_url: null },
    { vocab_id: 2, word: 'Advocate', phonetic: '/ˈædvəkeɪt/', meaning: 'Ủng hộ, đề xướng', example: 'He advocates for environmental protection.', album_id: 1, voice_url: null },
    { vocab_id: 3, word: 'Collaboration', phonetic: '/kəˌlæbəˈreɪʃən/', meaning: 'Sự hợp tác', example: 'Successful collaboration leads to better results.', album_id: 2, voice_url: null },
    { vocab_id: 4, word: 'Negotiate', phonetic: '/nɪˈɡəʊʃieɪt/', meaning: 'Đàm phán', example: 'We need to negotiate a better deal.', album_id: 2, voice_url: null },
    { vocab_id: 5, word: 'Greeting', phonetic: '/ˈɡriːtɪŋ/', meaning: 'Lời chào', example: 'A warm greeting makes a good impression.', album_id: 3, voice_url: null },
];

// ---- User Tests (Exam Results) ----
export const fakeUserTests = [
    { user_test_id: 1, user_id: 4, test_id: 1, started_at: '2024-03-20 09:00', finished_at: '2024-03-20 12:30', total_score: 7, status: 'COMPLETED' },
    { user_test_id: 2, user_id: 5, test_id: 1, started_at: '2024-03-20 10:00', finished_at: '2024-03-20 13:00', total_score: 6, status: 'COMPLETED' },
    { user_test_id: 3, user_id: 7, test_id: 2, started_at: '2024-03-21 08:00', finished_at: null, total_score: 0, status: 'IN_PROGRESS' },
    { user_test_id: 4, user_id: 8, test_id: 2, started_at: '2024-03-21 09:00', finished_at: '2024-03-21 12:30', total_score: 6, status: 'COMPLETED' },
    { user_test_id: 5, user_id: 4, test_id: 3, started_at: '2024-03-22 14:00', finished_at: '2024-03-22 16:00', total_score: 450, status: 'COMPLETED' },
    { user_test_id: 6, user_id: 9, test_id: 3, started_at: '2024-03-22 15:00', finished_at: '2024-03-22 17:00', total_score: 380, status: 'COMPLETED' },
    { user_test_id: 7, user_id: 5, test_id: 4, started_at: '2024-03-23 08:00', finished_at: null, total_score: 0, status: 'EXPIRED' },
];

// ---- Evaluations ----
export const fakeEvaluations = [
    { id: 1, user_id: 4, content: 'Ứng dụng rất hữu ích cho việc học tiếng Anh!', rating: 5, created_at: '2024-03-25' },
    { id: 2, user_id: 5, content: 'Tôi đã cải thiện được kỹ năng listening của mình.', rating: 4, created_at: '2024-03-26' },
    { id: 3, user_id: 7, content: 'Giao diện đẹp, dễ sử dụng.', rating: 5, created_at: '2024-03-27' },
];

// ---- Dashboard Statistics (Aggregated) ----
export const dashboardStats = {
    totalUsers: fakeUsers.length,
    totalTeachers: fakeUsers.filter(u => u.role_id === 2).length,
    totalStudents: fakeUsers.filter(u => u.role_id === 3).length,
    totalClasses: fakeClasses.length,
    totalTests: fakeTests.length,
    totalQuestions: fakeQuestions.length,
    totalVocabulary: fakeVocabulary.length,
    totalExamsTaken: fakeUserTests.length,
    completedExams: fakeUserTests.filter(ut => ut.status === 'COMPLETED').length,
    avgScore: Math.round(
        fakeUserTests
            .filter(ut => ut.status === 'COMPLETED')
            .reduce((acc, ut) => acc + ut.total_score, 0) / 
        fakeUserTests.filter(ut => ut.status === 'COMPLETED').length
    ),
    pendingMembers: fakeClassMembers.filter(cm => cm.status === 'PENDING').length,
    verifiedUsers: fakeUsers.filter(u => u.verified === 1).length,
};

// ---- Weekly User Registration Data ----
export const weeklyUserRegistrations = [
    { day: 'Mon', users: 12, exams: 45 },
    { day: 'Tue', users: 19, exams: 52 },
    { day: 'Wed', users: 15, exams: 48 },
    { day: 'Thu', users: 25, exams: 65 },
    { day: 'Fri', users: 22, exams: 58 },
    { day: 'Sat', users: 30, exams: 72 },
    { day: 'Sun', users: 18, exams: 40 },
];

// ---- Monthly Test Performance ----
export const monthlyTestPerformance = [
    { month: 'Jan', tests: 120, avgScore: 68 },
    { month: 'Feb', tests: 145, avgScore: 71 },
    { month: 'Mar', tests: 180, avgScore: 74 },
    { month: 'Apr', tests: 165, avgScore: 72 },
    { month: 'May', tests: 200, avgScore: 76 },
    { month: 'Jun', tests: 220, avgScore: 78 },
];

// ---- Recent Activities ----
export const recentActivities = [
    { id: 1, type: 'exam_completed', user: 'Phạm Văn Hùng', action: 'Hoàn thành IELTS Mock Test 1', score: '7.0', time: '5 phút trước' },
    { id: 2, type: 'user_registered', user: 'Trịnh Thị Linh', action: 'Đăng ký tài khoản mới', score: '-', time: '15 phút trước' },
    { id: 3, type: 'class_joined', user: 'Đỗ Thị Tuyết', action: 'Yêu cầu tham gia lớp Anh Văn Giao Tiếp', score: '-', time: '30 phút trước' },
    { id: 4, type: 'exam_completed', user: 'Lý Thị Nhi', action: 'Hoàn thành IELTS Mock Test 2', score: '6.5', time: '1 giờ trước' },
    { id: 5, type: 'test_created', user: 'Trần Thị Anh', action: 'Tạo bài thi mới: IELTS Reading Practice', score: '-', time: '2 giờ trước' },
    { id: 6, type: 'exam_completed', user: 'Vũ Văn Khôi', action: 'Hoàn thành TOEIC Practice Test 1', score: '380', time: '3 giờ trước' },
];

// ---- Exam Type Distribution ----
export const examTypeDistribution = [
    { name: 'IELTS', value: 45 },
    { name: 'TOEFL', value: 25 },
    { name: 'TOEIC', value: 30 },
    { name: 'Cambridge', value: 15 },
];

// ---- Skill Distribution ----
export const skillDistribution = [
    { name: 'Listening', max: 100, value: 82 },
    { name: 'Reading', max: 100, value: 78 },
    { name: 'Writing', max: 100, value: 65 },
    { name: 'Speaking', max: 100, value: 58 },
    { name: 'Vocabulary', max: 100, value: 88 },
    { name: 'Grammar', max: 100, value: 75 },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export const getUserById = (userId) => fakeUsers.find(u => u.user_id === userId);

export const getClassById = (classId) => fakeClasses.find(c => c.class_id === classId);

export const getTestById = (testId) => fakeTests.find(t => t.test_id === testId);

export const getExamTypeById = (examTypeId) => fakeExamTypes.find(et => et.exam_type_id === examTypeId);

export const getClassMemberCount = (classId) => fakeClassMembers.filter(cm => cm.class_id === classId && cm.status === 'APPROVED').length;

export const getUserTestsByUserId = (userId) => fakeUserTests.filter(ut => ut.user_id === userId);

export const getTestsByClassId = (classId) => fakeTests.filter(t => t.class_id === classId);

export const getRoleName = (roleId) => {
    const role = roles.find(r => r.role_id === roleId);
    return role ? role.role_name : 'UNKNOWN';
};

export const getQuestionCountByTest = (testId) => {
    // In real app, this would query through test_parts and test_questions
    return Math.floor(Math.random() * 50) + 10;
};
