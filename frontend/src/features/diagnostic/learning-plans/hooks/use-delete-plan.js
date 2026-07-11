import { useMutation } from '@tanstack/react-query';
import { deletePlan } from '~/shared/api/learningPlanApi';

// Danh sách plan (useLearningPlanList) dùng state + reload thủ công, không có query key
// react-query nên hook chỉ bọc thao tác ghi; caller tự gọi reload() trong onSuccess.
export function useDeletePlan({ onSuccess, onError } = {}) {
  return useMutation({
    mutationFn: (learningPlanId) => deletePlan(learningPlanId),
    onSuccess,
    onError,
  });
}
