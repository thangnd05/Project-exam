import { defaultLayoutConfig, BLOCK_TYPES } from './layoutSchema';

// Nhận response layout từ API ({ config: <JSON string> } | null | JSON string | object)
// -> trả về object config đã hợp nhất với mặc định (điền các key thiếu).
// Không hợp lệ / rỗng -> defaultLayoutConfig (giao diện mặc định).
export function resolveLayoutConfig(raw) {
  const parsed = parseRaw(raw);
  if (!parsed || !Array.isArray(parsed.blocks) || parsed.blocks.length === 0) {
    return defaultLayoutConfig;
  }
  return {
    ...defaultLayoutConfig,
    ...parsed,
    theme: { ...defaultLayoutConfig.theme, ...(parsed.theme || {}) },
    questionArea: {
      ...defaultLayoutConfig.questionArea,
      ...(parsed.questionArea || {}),
    },
    blocks: ensureQuestionNav(parsed.blocks.map((b) => ({ visible: true, props: {}, ...b }))),
  };
}

// Danh sách câu hỏi (nút toggle điều hướng) là điều hướng thiết yếu của trang làm bài.
// Nếu layout đã lưu quên/bỏ block này thì bổ sung lại bản mặc định để người dùng vẫn
// mở được danh sách câu — tránh trường hợp "mất nút Danh sách câu hỏi".
function ensureQuestionNav(blocks) {
  const hasNav = blocks.some((b) => b.type === BLOCK_TYPES.QUESTION_NAV);
  if (hasNav) return blocks;
  const defaultNav = defaultLayoutConfig.blocks.find(
    (b) => b.type === BLOCK_TYPES.QUESTION_NAV,
  );
  return defaultNav ? [defaultNav, ...blocks] : blocks;
}

function parseRaw(raw) {
  if (!raw) return null;
  // API layout response: { examTypeId, config, updatedAt }
  const source =
    typeof raw === 'object' && raw !== null && 'config' in raw ? raw.config : raw;
  if (!source) return null;
  if (typeof source === 'object') return source;
  if (typeof source === 'string') {
    try {
      return JSON.parse(source);
    } catch {
      return null;
    }
  }
  return null;
}
