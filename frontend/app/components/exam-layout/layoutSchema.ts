export const ZONES = {
  TOP: 'TOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTTOM: 'BOTTOM',
  FLOAT: 'FLOAT',
} as const;

export type Zone = (typeof ZONES)[keyof typeof ZONES];

export const BLOCK_TYPES = {
  QUESTION_AREA: 'questionArea',
  TIMER: 'timer',
  PROGRESS: 'progress',
  SUBMIT: 'submit',
  QUESTION_NAV: 'questionNav',
  BANNER: 'banner',
  TITLE: 'title',
} as const;

export type BlockType = (typeof BLOCK_TYPES)[keyof typeof BLOCK_TYPES];

/** Thuộc tính riêng của từng yếu tố, layout builder (trang admin) chỉnh trực tiếp. */
export interface LayoutBlockProps {
  label?: string;
  toggleLabel?: string;
  hideLabel?: string;
  navColumns?: number;
  url?: string;
  spacing?: number | string;
  [key: string]: unknown;
}

export interface LayoutBlock {
  id: string;
  type: string;
  zone: string;
  align?: string;
  order?: number;
  visible?: boolean;
  props?: LayoutBlockProps;
}

export interface LayoutTheme {
  primary?: string | null;
  font?: string | null;
  radius?: number | null;
  density?: string;
}

export interface LayoutQuestionArea {
  passagePosition?: string;
  /** 'scroll' = cuộn hết đề, 'paged' = từng câu/nhóm một (xem memory paged-presentation-mode) */
  navigationMode?: string;
  columns?: number;
  maxWidth?: number | null;
  cardShadow?: boolean;
}

export interface LayoutConfig {
  version?: number;
  theme: LayoutTheme;
  questionArea: LayoutQuestionArea;
  blocks: LayoutBlock[];
}

export const ZONE_META: Array<{ key: string; label: string }> = [
  { key: ZONES.TOP, label: 'Trên (thanh đầu trang)' },
  { key: ZONES.LEFT, label: 'Trái (cột bên)' },
  { key: ZONES.RIGHT, label: 'Phải (cột bên)' },
  { key: ZONES.BOTTOM, label: 'Dưới (thanh chân trang)' },
  { key: ZONES.FLOAT, label: 'Nổi (góc màn hình)' },
];

export const BLOCK_META: Record<string, { label: string }> = {
  [BLOCK_TYPES.TIMER]: { label: 'Đồng hồ' },
  [BLOCK_TYPES.PROGRESS]: { label: 'Tiến độ' },
  [BLOCK_TYPES.SUBMIT]: { label: 'Nút nộp bài' },
  [BLOCK_TYPES.QUESTION_NAV]: { label: 'Danh sách câu hỏi' },
  [BLOCK_TYPES.BANNER]: { label: 'Banner' },
  [BLOCK_TYPES.TITLE]: { label: 'Tiêu đề' },
};

export const ADDABLE_BLOCK_TYPES: string[] = [BLOCK_TYPES.BANNER];

export const defaultLayoutConfig: LayoutConfig = {
  version: 1,
  theme: {
    primary: null,
    font: null,
    radius: null,
    density: 'comfortable',
  },
  questionArea: {
    passagePosition: 'side',

    navigationMode: 'scroll',
    columns: 1,
    maxWidth: null,
    cardShadow: true,
  },

  blocks: [
    {
      id: 'questionNav',
      type: BLOCK_TYPES.QUESTION_NAV,
      zone: ZONES.BOTTOM,
      align: 'left',
      order: 1,
      visible: true,
      props: { toggleLabel: 'Câu hỏi', hideLabel: 'Ẩn' },
    },
    {
      id: 'timer',
      type: BLOCK_TYPES.TIMER,
      zone: ZONES.BOTTOM,
      align: 'right',
      order: 2,
      visible: true,
      props: {},
    },
    {
      id: 'progress',
      type: BLOCK_TYPES.PROGRESS,
      zone: ZONES.BOTTOM,
      align: 'right',
      order: 3,
      visible: true,
      props: {},
    },
    {
      id: 'submit',
      type: BLOCK_TYPES.SUBMIT,
      zone: ZONES.BOTTOM,
      align: 'right',
      order: 4,
      visible: true,
      props: { label: 'Nộp bài thi' },
    },
  ],
};
