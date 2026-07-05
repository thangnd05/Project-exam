/**
 * State machine + helper dùng chung cho luồng "Tạo đề thi từ kho câu hỏi".
 *
 * Why: logic quản lý cấu hình từng Part (chọn mode, group theo passage, đếm số câu hiệu dụng,
 * chọn thủ công, tải câu theo part) trước đây bị copy gần như y hệt ở 2 nơi:
 *   - components/test/creator/CreateFromBankBody.js (bản đầy đủ: có bộ đề/lớp/kho admin)
 *   - pages/create-test-from-bank/CreateTestFromBankPage.js (bản rút gọn: chỉ kho cá nhân)
 * Gom về một hook để sửa-một-lần. Hai màn hình vẫn giữ "vỏ" JSX + SCSS riêng.
 *
 * Điểm khác biệt duy nhất giữa 2 màn là "phạm vi câu theo bộ đề": truyền vào qua `getScopedQuestions`.
 * Page không có bộ đề -> để mặc định (identity) trả nguyên cfg.bankQuestions, nên toàn bộ helper
 * quy về đúng hành vi bản rút gọn; Body truyền hàm lọc theo collection.
 */
import { useState } from 'react';
import { getQuestionsByPart } from '~/api/questionApi';

export const SELECTION_MODES = {
  MANUAL: 'manual',
  RANDOM: 'random',
  RANDOM_BY_COLLECTION: 'random_by_collection',
  SEQUENTIAL: 'sequential',
};

export const defaultPartConfig = () => ({
  mode: SELECTION_MODES.RANDOM,
  randomCount: '',
  fromIndex: '',
  toIndex: '',
  selectedIds: [],
  bankQuestions: [],
  loading: false,
  expanded: true,
});

/** Nhóm câu theo passage_id (cùng passage = 1 nhóm; không passage = mỗi câu 1 nhóm). */
export const groupQuestionsByPassage = (questions) => {
  if (!questions?.length) return [];
  const map = new Map();
  questions.forEach((q) => {
    const id = q.questionId ?? q.id;
    const passageId = q.passageId ?? q.passage?.passageId ?? null;
    const groupKey = passageId != null ? `passage-${passageId}` : `no-passage-${id}`;
    if (!map.has(groupKey)) {
      map.set(groupKey, { groupKey, passageId, questions: [] });
    }
    map.get(groupKey).questions.push(q);
  });
  return Array.from(map.values());
};

export function useBankTestBuilder({ getScopedQuestions } = {}) {
  const [partConfigs, setPartConfigs] = useState({});

  // Phạm vi câu áp dụng cho một cfg. Mặc định: nguyên kho của part (không lọc bộ đề).
  const scopeOf = (cfg) =>
    getScopedQuestions ? getScopedQuestions(cfg) : cfg?.bankQuestions || [];

  const updatePartConfig = (examPartId, field, value) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], [field]: value },
    }));
  };

  const togglePartExpanded = (examPartId) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], expanded: !prev[examPartId].expanded },
    }));
  };

  /** Tải câu hỏi của một part vào cfg. `params` để truyền bank/classId/chapterId khi cần. */
  const loadQuestionsForPart = (examPartId, params = {}) => {
    setPartConfigs((prev) => ({
      ...prev,
      [examPartId]: { ...prev[examPartId], loading: true },
    }));
    return getQuestionsByPart(examPartId, params)
      .then((data) => {
        const list = Array.isArray(data) ? data : data?.data ?? data?.questions ?? [];
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: list, loading: false },
        }));
      })
      .catch((err) => {
        console.error(err);
        setPartConfigs((prev) => ({
          ...prev,
          [examPartId]: { ...prev[examPartId], bankQuestions: [], loading: false },
        }));
      });
  };

  /** Bật/tắt cả nhóm (cùng passage): chọn hoặc bỏ chọn toàn bộ câu trong nhóm. */
  const toggleGroup = (examPartId, groupKey) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const group = groupQuestionsByPassage(scopeOf(cfg)).find((g) => g.groupKey === groupKey);
    if (!group) return;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean);
    const selectedSet = new Set(cfg.selectedIds || []);
    const allSelected = ids.every((id) => selectedSet.has(id));
    if (allSelected) ids.forEach((id) => selectedSet.delete(id));
    else ids.forEach((id) => selectedSet.add(id));
    updatePartConfig(examPartId, 'selectedIds', Array.from(selectedSet));
  };

  const isGroupSelected = (examPartId, groupKey) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return false;
    const group = groupQuestionsByPassage(scopeOf(cfg)).find((g) => g.groupKey === groupKey);
    if (!group) return false;
    const ids = group.questions.map((q) => q.questionId ?? q.id).filter(Boolean);
    const selectedSet = new Set(cfg.selectedIds || []);
    return ids.length > 0 && ids.every((id) => selectedSet.has(id));
  };

  const toggleSelectAll = (examPartId, checked) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return;
    const ids = scopeOf(cfg).map((q) => q.questionId ?? q.id).filter(Boolean);
    updatePartConfig(examPartId, 'selectedIds', checked ? ids : []);
  };

  /** Số câu thực sự sẽ đưa vào đề cho part, theo mode hiện tại. */
  const getPartEffectiveCount = (examPartId) => {
    const cfg = partConfigs[examPartId];
    if (!cfg) return 0;
    const scoped = scopeOf(cfg);
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return Math.min(n, scoped.length);
    }
    if (cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION) {
      return scoped.length;
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = Math.max(1, parseInt(cfg.fromIndex, 10) || 1);
      const to = Math.max(from, parseInt(cfg.toIndex, 10) || from);
      const maxInBank = scoped.length;
      if (from > maxInBank) return 0;
      const actualTo = Math.min(to, maxInBank);
      return actualTo - from + 1;
    }
    // MANUAL: chỉ tính câu đã chọn còn nằm trong phạm vi (đề phòng đổi bộ đề sau khi chọn).
    const scopedIds = new Set(scoped.map((q) => q.questionId ?? q.id));
    return (cfg.selectedIds || []).filter((id) => scopedIds.has(id)).length;
  };

  const hasPartWithQuestions = (part) => {
    const cfg = partConfigs[part.examPartId];
    if (!cfg) return false;
    const scoped = scopeOf(cfg);
    if (cfg.mode === SELECTION_MODES.RANDOM) {
      const n = Math.max(0, parseInt(cfg.randomCount, 10) || 0);
      return n > 0 && scoped.length > 0;
    }
    if (cfg.mode === SELECTION_MODES.RANDOM_BY_COLLECTION) {
      return scoped.length > 0;
    }
    if (cfg.mode === SELECTION_MODES.SEQUENTIAL) {
      const from = parseInt(cfg.fromIndex, 10);
      const to = parseInt(cfg.toIndex, 10);
      return !isNaN(from) && !isNaN(to) && from > 0 && to >= from && scoped.length >= from;
    }
    return getPartEffectiveCount(part.examPartId) > 0;
  };

  return {
    partConfigs,
    setPartConfigs,
    scopeOf,
    updatePartConfig,
    togglePartExpanded,
    loadQuestionsForPart,
    toggleGroup,
    isGroupSelected,
    toggleSelectAll,
    getPartEffectiveCount,
    hasPartWithQuestions,
  };
}
