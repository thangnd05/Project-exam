// Query key dùng chung cho exam-type: trang public ((public)/_components/ExamTypeGrid, HeroSection),
// các hook admin (useExamTypes, useTags) cùng trỏ về một nguồn nên invalidate không bị lệch key.
export const examTypeKeys = {
  all: ['exam-types'],
  standard: ['exam-types', 'standard'],
  detail: (examTypeId?: string | null) => ['exam-type', examTypeId ?? null],
  layout: (examTypeId?: string | null) => ['exam-type-layout', examTypeId ?? null],
};
