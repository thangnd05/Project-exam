import { defaultLayoutConfig, BLOCK_TYPES } from '@/app/components/exam-layout/layoutSchema';
import type { LayoutBlock, LayoutConfig } from '@/app/components/exam-layout/layoutSchema';

export function resolveLayoutConfig(raw: unknown): LayoutConfig {
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
    blocks: ensureQuestionNav(parsed.blocks.map((b: LayoutBlock) => ({ visible: true, props: {}, ...b }))),
  };
}

function ensureQuestionNav(blocks: LayoutBlock[]): LayoutBlock[] {
  const hasNav = blocks.some((b) => b.type === BLOCK_TYPES.QUESTION_NAV);
  if (hasNav) return blocks;
  const defaultNav = defaultLayoutConfig.blocks.find(
    (b) => b.type === BLOCK_TYPES.QUESTION_NAV,
  );
  return defaultNav ? [defaultNav, ...blocks] : blocks;
}

function parseRaw(raw: unknown): any {
  if (!raw) return null;

  const source =
    typeof raw === 'object' && raw !== null && 'config' in raw ? (raw as any).config : raw;
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
