import { Moon, Sun, type LucideIcon } from 'lucide-react';
import type { Palette } from '@/app/constants/theme';
import type { Theme } from '@/app/components/layouts/Header/ThemeToggle/hooks/useTheme';

// Dùng chung cho AppearanceMenu (khách) và SettingsModal (người dùng đã đăng nhập).
export const THEME_OPTIONS: { value: Theme; labelKey: 'light' | 'dark'; Icon: LucideIcon }[] = [
  { value: 'light', labelKey: 'light', Icon: Sun },
  { value: 'dark', labelKey: 'dark', Icon: Moon },
];

export const PALETTE_LABEL_KEYS: Record<Palette, 'paletteFrost' | 'paletteGold'> = {
  frost: 'paletteFrost',
  gold: 'paletteGold',
};
