// Mốc màn hình dùng chung cho JS, phải khớp $breakpoints trong mixins.scss.
export const BREAKPOINTS = {
  xs: 480,
  sm: 576,
  md: 768,
  lg: 992,
  xl: 1200,
  xxl: 1400,
  wide: 1536,
} as const;

export type Breakpoint = keyof typeof BREAKPOINTS;

// Media query "dưới mốc", cùng nghĩa với @include down($bp) bên SCSS.
export const mediaDown = (bp: Breakpoint) => `(max-width: ${BREAKPOINTS[bp] - 0.02}px)`;
