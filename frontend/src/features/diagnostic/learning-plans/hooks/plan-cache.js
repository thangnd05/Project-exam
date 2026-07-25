// Các truy vấn phản ánh trạng thái plan ở nhiều tab (danh sách, chi tiết, so sánh,
// "tiếp theo nên làm gì", tổng quan mục tiêu). switch/delete plan phải làm mới hết
// để không còn hiển thị plan cũ/đã xoá. Dùng prefix nên bao mọi examTypeId.
const PLAN_QUERY_PREFIXES = [
  ['learning-plan-list'], // useLearningPlanList
  ['learning-plans'], // usePlanComparison
  ['learning-plan-detail'], // usePlanDetail
  ['next-step-overview'], // useNextStepOverview
  ['target-dashboard'], // useTargetDashboard
];

export function invalidatePlanQueries(queryClient) {
  PLAN_QUERY_PREFIXES.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
}
