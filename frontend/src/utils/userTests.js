export const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.data || [];

export const filterCompletedTests = (data, examTypeId) =>
  normalizeList(data)
    .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
    .filter((u) => !examTypeId || !u.examTypeId || u.examTypeId === examTypeId)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));

// Bài mock = làm đề đầy đủ (FULL_TEST, gồm cả Quick Challenge).
// Loại PRACTICE (luyện theo Part). Row cũ mode = null được coi như FULL_TEST.
export const isMockAttempt = (u) => u?.mode !== 'PRACTICE';

// Lịch sử mock: chỉ giữ bài làm đề đầy đủ, bỏ các buổi luyện tập theo Part.
export const filterMockTests = (data, examTypeId) =>
  filterCompletedTests(data, examTypeId).filter(isMockAttempt);
