// Hook dùng chung cho nhiều route.
export * from './examTypeKeys';
export * from './plan-cache';
export * from './useAdminCrud';
export * from './useAuth';
export * from './useAuthActions';
export * from './useBankTestBuilder';
export * from './useBaseMetaData';
export * from './useCertificates';
export * from './useCoins';
export * from './useCosmetics';
export * from './useCreateTest';
export * from './useDashboardStats';
export * from './useDebouncedValue';
export * from './useDeletePassageMedia';
export * from './useEditQuestionModal';
export * from './useExamCategories';
export * from './useExamTypes';
export * from './useMilestoneScoring';
export * from './useMounted';
export * from './useMyClasses';
export * from './useMyTests';
export * from './usePermission';
export * from './usePlanDetail';
export * from './usePosts';
export * from './useQuestionCollections';
export * from './useQuestionDetail';
export * from './useResyncPlan';
export * from './useSavePost';
export * from './useSavedPosts';
export * from './useSearchParamsState';
export * from './useStreak';
export * from './useTargetAchieved';
export * from './useTargetDashboard';
export * from './useTestSubmission';
export * from './useUpdateQuestion';

// useGeneratePlan cũng export một `useExamTypes` RIÊNG (lấy loại đề chuẩn cho trang lập kế
// hoạch, khác bản CRUD admin trong useExamTypes.ts) nên không gom vào đây — import trực tiếp
// '@/app/hooks/useGeneratePlan'.
