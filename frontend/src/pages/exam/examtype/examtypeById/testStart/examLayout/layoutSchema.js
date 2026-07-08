// Schema cấu hình bố cục giao diện làm bài (zone-based).
// Đây là "hợp đồng" mà cả renderer (trang thi) lẫn editor admin (Phase 3) cùng bám vào.

export const ZONES = {
  TOP: 'TOP',
  LEFT: 'LEFT',
  RIGHT: 'RIGHT',
  BOTTOM: 'BOTTOM',
  FLOAT: 'FLOAT',
};

export const BLOCK_TYPES = {
  QUESTION_AREA: 'questionArea', // khối câu hỏi (trung tâm, không kéo đi)
  TIMER: 'timer',
  PROGRESS: 'progress',
  SUBMIT: 'submit',
  QUESTION_NAV: 'questionNav', // nút + panel "Danh sách câu hỏi"
  BANNER: 'banner',
  TITLE: 'title',
};

// Nhãn hiển thị cho từng zone trong editor.
export const ZONE_META = [
  { key: ZONES.TOP, label: 'Trên (thanh đầu trang)' },
  { key: ZONES.LEFT, label: 'Trái (cột bên)' },
  { key: ZONES.RIGHT, label: 'Phải (cột bên)' },
  { key: ZONES.BOTTOM, label: 'Dưới (thanh chân trang)' },
  { key: ZONES.FLOAT, label: 'Nổi (góc màn hình)' },
];

// Nhãn + icon (emoji) cho từng loại block.
export const BLOCK_META = {
  [BLOCK_TYPES.TIMER]: { label: 'Đồng hồ', icon: '⏱️' },
  [BLOCK_TYPES.PROGRESS]: { label: 'Tiến độ', icon: '✅' },
  [BLOCK_TYPES.SUBMIT]: { label: 'Nút nộp bài', icon: '📨' },
  [BLOCK_TYPES.QUESTION_NAV]: { label: 'Danh sách câu hỏi', icon: '🔢' },
  [BLOCK_TYPES.BANNER]: { label: 'Banner', icon: '🖼️' },
  [BLOCK_TYPES.TITLE]: { label: 'Tiêu đề', icon: '📝' },
};

// Các block có thể THÊM mới từ palette (những block còn lại là cố định trong config mặc định).
export const ADDABLE_BLOCK_TYPES = [BLOCK_TYPES.BANNER];

// Cấu hình MẶC ĐỊNH = tái tạo đúng giao diện làm bài hiện tại.
// examType chưa cấu hình -> dùng nguyên cái này (không đổi 1 pixel).
export const defaultLayoutConfig = {
  version: 1,
  theme: {
    primary: null, // null = không override, dùng token --primary hiện có
    font: null,
    radius: null,
    density: 'comfortable',
  },
  questionArea: {
    passagePosition: 'side', // 'side' = passage cột trái, câu hỏi cột phải (như hiện tại)
    columns: 1,
    maxWidth: null,
    cardShadow: true,
  },
  // Footer hiện tại: [nav] bên trái ... [timer][progress][submit] bên phải.
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
