// Chuẩn hoá response thành mảng: API có thể trả thẳng mảng hoặc { data: [...] }.
export const normalizeList = (data) =>
  Array.isArray(data) ? data : data?.data || [];

/**
 * Lọc các bài thi đã hoàn thành (COMPLETED + có finishedAt), sắp xếp mới → cũ.
 * @param {*} data response từ getMyUserTests (mảng hoặc { data })
 * @param {string} [examTypeId] nếu truyền, chỉ giữ bài cùng loại kỳ thi
 *        (bài không gắn examTypeId luôn được giữ lại)
 * @returns {Array} danh sách bài đã hoàn thành đã sort desc theo finishedAt
 */
export const filterCompletedTests = (data, examTypeId) =>
  normalizeList(data)
    .filter((u) => u.status === 'COMPLETED' && u.finishedAt)
    .filter((u) => !examTypeId || !u.examTypeId || u.examTypeId === examTypeId)
    .sort((a, b) => new Date(b.finishedAt) - new Date(a.finishedAt));
