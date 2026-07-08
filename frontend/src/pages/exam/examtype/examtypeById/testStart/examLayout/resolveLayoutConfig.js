import { defaultLayoutConfig } from './layoutSchema';

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
    blocks: parsed.blocks.map((b) => ({ visible: true, props: {}, ...b })),
  };
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
