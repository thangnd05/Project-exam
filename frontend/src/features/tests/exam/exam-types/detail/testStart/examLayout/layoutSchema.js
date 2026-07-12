export const ZONES = {
  TOP: 'TOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTTOM: 'BOTTOM',
  FLOAT: 'FLOAT',
};

export const BLOCK_TYPES = {
  QUESTION_AREA: 'questionArea',
  TIMER: 'timer',
  PROGRESS: 'progress',
  SUBMIT: 'submit',
  QUESTION_NAV: 'questionNav',
  BANNER: 'banner',
  TITLE: 'title',
};

export const ZONE_META = [
  { key: ZONES.TOP, label: 'Trên (thanh đầu trang)' },
  { key: ZONES.LEFT, label: 'Trái (cột bên)' },
  { key: ZONES.RIGHT, label: 'Phải (cột bên)' },
  { key: ZONES.BOTTOM, label: 'Dưới (thanh chân trang)' },
  { key: ZONES.FLOAT, label: 'Nổi (góc màn hình)' },
];

export const BLOCK_META = {
  [BLOCK_TYPES.TIMER]: { label: 'Đồng hồ' },
  [BLOCK_TYPES.PROGRESS]: { label: 'Tiến độ' },
  [BLOCK_TYPES.SUBMIT]: { label: 'Nút nộp bài' },
  [BLOCK_TYPES.QUESTION_NAV]: { label: 'Danh sách câu hỏi' },
  [BLOCK_TYPES.BANNER]: { label: 'Banner' },
  [BLOCK_TYPES.TITLE]: { label: 'Tiêu đề' },
};

export const ADDABLE_BLOCK_TYPES = [BLOCK_TYPES.BANNER];

export const defaultLayoutConfig = {
  version: 1,
  theme: {
    primary: null,
    font: null,
    radius: null,
    density: 'comfortable',
  },
  questionArea: {
    passagePosition: 'side',
    // Kiểu làm bài: 'scroll' = cuộn hết (mặc định, legacy) | 'paged' = từng câu/nhóm kiểu TOEIC.
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
