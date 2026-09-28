import routes from '@/app/configs/Routes';
import { buildGuestSignupUrl } from '@/app/utils/authRedirect';

type PlanFromTestOptions = {
  userTestId?: string;
  examTypeId?: string;
  hasTarget?: boolean;
  isGuest?: boolean;
};

export const buildGeneratePlanUrl = (userTestId?: string, examTypeId?: string): string => {
  const params = new URLSearchParams();
  if (userTestId) params.set('userTestId', userTestId);
  if (examTypeId) params.set('examTypeId', String(examTypeId));
  const qs = params.toString();
  return qs ? `${routes.generatePlan}?${qs}` : routes.generatePlan;
};

export const buildTargetUrl = (examTypeId?: string, next?: string): string => {
  const params = new URLSearchParams();
  if (examTypeId) params.set('examTypeId', String(examTypeId));
  if (next) params.set('next', next);
  const qs = params.toString();
  return qs ? `${routes.myTarget}?${qs}` : routes.myTarget;
};

// Giữ userTestId suốt luồng: khách đăng ký → đặt mục tiêu → sinh lộ trình từ đúng bài vừa làm.
export const buildPlanFromTestUrl = ({
  userTestId,
  examTypeId,
  hasTarget,
  isGuest,
}: PlanFromTestOptions): string => {
  const generateUrl = buildGeneratePlanUrl(userTestId, examTypeId);
  if (isGuest) return buildGuestSignupUrl(buildTargetUrl(examTypeId, generateUrl));
  // Chưa biết có mục tiêu hay chưa thì cứ sang trang sinh lộ trình, trang đó tự nhắc đặt mục tiêu.
  if (hasTarget !== false) return generateUrl;
  return buildTargetUrl(examTypeId, generateUrl);
};
