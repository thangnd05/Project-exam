export const examTypeKeys = {
  all: ['exam-types'],
  standard: ['exam-types', 'standard'],
  detail: (examTypeId?: string | null) => ['exam-type', examTypeId ?? null],
  layout: (examTypeId?: string | null) => ['exam-type-layout', examTypeId ?? null],
};
