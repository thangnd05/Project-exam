export const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.data || [];

export const filterCompletedTests = (data, examTypeId) =>
  normalizeList(data)
    .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
    .filter((u) => !examTypeId || !u.examTypeId || u.examTypeId === examTypeId)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
