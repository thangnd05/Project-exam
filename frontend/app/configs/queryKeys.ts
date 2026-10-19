// Query key cho các tài nguyên được đọc ở nhiều nơi. Mỗi tài nguyên có đúng một gốc key:
// mutation chỉ cần invalidate gốc là mọi nơi đang đọc đều được làm mới.
// Các nơi dùng chung một key phải gọi cùng một hàm API với cùng tham số; muốn biến đổi dữ liệu
// thì làm trong `select` (chạy riêng cho từng nơi), không làm trong `queryFn` vì cache là dùng chung.

type Id = string | number | null | undefined;
const id = (value: Id) => (value == null || value === '' ? null : String(value));

export const examTypeKeys = {
  all: ['exam-types'], // getExamTypes
  standard: ['exam-types', 'standard'], // getStandardExamTypes
  detail: (examTypeId?: Id) => ['exam-types', 'detail', id(examTypeId)],
  layout: (examTypeId?: Id) => ['exam-types', 'layout', id(examTypeId)],
  // Layout thô của admin (getOwnExamTypeLayout) và layout đã resolve cho trang làm bài là hai
  // dạng dữ liệu khác nhau nên phải tách key; cùng gốc `layout` để lưu layout là cả hai làm mới.
  ownLayout: (examTypeId?: Id) => ['exam-types', 'layout', id(examTypeId), 'own'],
  resolvedLayout: (examTypeId?: Id) => ['exam-types', 'layout', id(examTypeId), 'resolved'],
};

export const examCategoryKeys = {
  all: ['exam-categories'], // getExamCategories
};

export const examPartKeys = {
  all: ['exam-parts'], // getExamParts
  byExamType: (examTypeId?: Id) => ['exam-parts', 'by-exam-type', id(examTypeId)],
  detail: (examPartId?: Id) => ['exam-parts', 'detail', id(examPartId)], // getExamPartById
};

export const skillKeys = {
  all: ['skills'], // getSkills
};

export const tagKeys = {
  all: ['tags'],
  byExamType: (examTypeId?: Id) => ['tags', id(examTypeId)],
  flat: (examTypeId?: Id) => ['tags', id(examTypeId), 'flat'], // getTagsFlatByExamType
};

export const questionCollectionKeys = {
  all: ['question-collections'], // getQuestionCollections
};

export const scoringConversionKeys = {
  all: ['scoring-conversions'],
  list: ['scoring-conversions', 'all'], // getScoringConversions
  bySkill: (skillId?: Id, examTypeId?: Id) =>
    ['scoring-conversions', 'by-skill', id(skillId), id(examTypeId)], // getScoringConversionsBySkill
};

export const milestoneKeys = {
  all: ['milestones'],
  list: (examTypeId?: Id) => ['milestones', id(examTypeId)], // getMilestones
};

export const userTargetKeys = {
  all: ['user-target'],
  byExamType: (examTypeId?: Id) => ['user-target', id(examTypeId)], // getUserTarget
};

export const completedUserTestKeys = {
  all: ['completed-user-tests'],
  byExamType: (examTypeId?: Id) => ['completed-user-tests', id(examTypeId)], // getMyCompletedUserTests
};

export const postCategoryKeys = {
  all: ['post-categories'], // getCategories
};

export const classKeys = {
  detail: (classId?: Id) => ['class-info', id(classId)], // getClassById
};

export const classChapterKeys = {
  byClass: (classId?: Id) => ['chapters', id(classId)], // getChaptersByClass
};
