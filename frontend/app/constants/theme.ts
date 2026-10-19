// Khoá localStorage lưu theme. Dùng chung cho useTheme (client) và script chống nháy trong
// app/layout.tsx (server) nên phải nằm ở module không có 'use client'.
export const THEME_STORAGE_KEY = 'theme';

// Bảng màu: 'frost' (FrostScope) hoặc 'gold' (bảng màu vàng gốc). Chưa chọn thì dùng DEFAULT_PALETTE.
export const PALETTE_STORAGE_KEY = 'palette';
export const PALETTES = ['frost', 'gold'] as const;
export type Palette = (typeof PALETTES)[number];
export const DEFAULT_PALETTE: Palette = 'frost';

export const isPalette = (value: unknown): value is Palette =>
  typeof value === 'string' && (PALETTES as readonly string[]).includes(value);
