// URL cũ -> URL mới sau mỗi lần đổi đường dẫn (bảng SEO). next.config.mjs trả 308 cho từng cặp và tự thêm bản /en,
// để link đã chia sẻ và thứ hạng tìm kiếm chuyển sang URL mới. File .mjs vì next.config.mjs không import được TypeScript.
// Chạy trước proxy.ts, nên /exam-types/<uuid> thành /exams/<uuid> rồi proxy mới đổi tiếp sang slug.
// Next dùng luật khớp đầu tiên: luật cụ thể phải đứng trước luật có :path*. Query luôn được giữ nguyên.

/** @type {ReadonlyArray<readonly [source: string, destination: string]>} */
const legacyRedirects = [
  ['/exam-types', '/exams'],
  ['/exam-types/:path*', '/exams/:path*'],
  ['/policy', '/privacy-policy'],
  ['/service', '/terms'],
  ['/forgot', '/forgot-password'],
  // Trang cá nhân gom về /dashboard (vd ?exam= giữ nguyên, trang mục tiêu tự đổi sang path).
  ['/my-target', '/goals/new'],
  ['/my-target/dashboard', '/dashboard/goals'],
  ['/my-target/mocks', '/dashboard/goals'],
  ['/my-target/achieved', '/dashboard/goals/achieved'],
  ['/learning-plans', '/learning-paths'],
  ['/learning-plans/generate', '/learning-paths/create'],
  ['/learning-plans/:path*', '/dashboard/learning-paths/:path*'],
  // Lịch sử nhiệm vụ không còn lồng dưới lộ trình.
  ['/dashboard/learning-paths/:learningPlanId/tasks/:taskId/history', '/dashboard/tasks/:taskId/history'],
  // Làm bài, kết quả, xem lại đáp án.
  ['/tests/:testId/start', '/mock-exams/:testId/take'],
  ['/tests/result/:userTestId', '/attempts/:userTestId'],
  ['/tests/result/:userTestId/review', '/attempts/:userTestId/review'],
  ['/tests/:testId/history', '/dashboard/mock-exams/:testId/attempts'],
  ['/tests/:testId/leaderboard', '/dashboard/mock-exams/:testId/leaderboard'],
  ['/my-certificates', '/dashboard/certificates'],
  // Ngân hàng câu hỏi cá nhân chỉ cần đăng nhập, không thuộc khu quản trị /admin.
  ['/admin/personal-question-bank', '/dashboard/question-bank'],
  ['/admin/create-test-from-bank', '/dashboard/question-bank/create-test'],
  // /certificates/verify/** vẫn là trang công khai, không chuyển.
  ['/certificates/:certificateId((?!verify$)[^/]+)', '/dashboard/certificates/:certificateId'],
];

export default legacyRedirects;
