'use client';

import classNames from 'classnames/bind';
import { PALETTES, type Palette } from '@/app/constants/theme';
import { usePalette } from '@/app/components/layouts/Header/ThemeToggle/hooks/usePalette';
import styles from '@/app/components/layouts/Header/ThemeToggle/ThemeToggle.module.scss';

const cx = classNames.bind(styles);

const PALETTE_LABELS: Record<Palette, string> = {
  frost: 'băng lạnh',
  gold: 'vàng đồng',
};

function PaletteToggle({ className }: { className?: string }) {
  const { palette, cyclePalette } = usePalette();
  const next = PALETTES[(PALETTES.indexOf(palette) + 1) % PALETTES.length];
  const label = `Chuyển sang bảng màu ${PALETTE_LABELS[next]}`;

  // Chấm màu hiển thị bảng màu sẽ chuyển sang, giống nút sáng/tối hiện icon của chế độ kế tiếp.
  return (
    <button type="button" className={cx('toggle', className)} onClick={cyclePalette} aria-label={label} title={label}>
      <span className={cx('swatch', `swatch-${next}`)} aria-hidden="true" />
    </button>
  );
}

export default PaletteToggle;
