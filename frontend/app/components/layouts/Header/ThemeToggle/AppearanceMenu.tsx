'use client';

import { Check, Moon, Palette as PaletteIcon, Sun, type LucideIcon } from 'lucide-react';
import { Dropdown } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { PALETTES, type Palette } from '@/app/constants/theme';
import { useTheme, type Theme } from '@/app/components/layouts/Header/ThemeToggle/hooks/useTheme';
import { usePalette } from '@/app/components/layouts/Header/ThemeToggle/hooks/usePalette';
import styles from '@/app/components/layouts/Header/ThemeToggle/ThemeToggle.module.scss';

const cx = classNames.bind(styles);

const THEME_OPTIONS: { value: Theme; label: string; Icon: LucideIcon }[] = [
  { value: 'light', label: 'Sáng', Icon: Sun },
  { value: 'dark', label: 'Tối', Icon: Moon },
];

const PALETTE_LABELS: Record<Palette, string> = {
  frost: 'Băng lạnh',
  gold: 'Vàng đồng',
};

// Màu nền/chữ của menu đổi theo nền phía sau header nên do Header truyền class vào.
interface AppearanceMenuProps {
  classes?: Partial<Record<'toggle' | 'menu' | 'label' | 'divider', string>>;
}

function AppearanceMenu({ classes = {} }: AppearanceMenuProps) {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();

  return (
    // Chọn xong menu vẫn mở để thử tiếp; bấm ra ngoài hoặc Esc mới đóng.
    <Dropdown align="end" autoClose="outside">
      <Dropdown.Toggle
        as="button"
        type="button"
        className={cx('toggle', classes.toggle)}
        aria-label="Giao diện"
        title="Giao diện"
      >
        <PaletteIcon size={18} aria-hidden="true" />
      </Dropdown.Toggle>
      <Dropdown.Menu className={cx('menu', classes.menu)}>
        <p className={cx('label', classes.label)}>Chế độ</p>
        {THEME_OPTIONS.map(({ value, label, Icon }) => (
          <Dropdown.Item
            key={value}
            as="button"
            type="button"
            role="menuitemradio"
            aria-checked={theme === value}
            className={cx('option')}
            onClick={() => setTheme(value)}
          >
            <Icon size={16} aria-hidden="true" />
            {label}
            {theme === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
          </Dropdown.Item>
        ))}

        <Dropdown.Divider className={classes.divider} />

        <p className={cx('label', classes.label)}>Bảng màu</p>
        {PALETTES.map((value) => (
          <Dropdown.Item
            key={value}
            as="button"
            type="button"
            role="menuitemradio"
            aria-checked={palette === value}
            className={cx('option')}
            onClick={() => setPalette(value)}
          >
            <span className={cx('swatch', `swatch-${value}`)} aria-hidden="true" />
            {PALETTE_LABELS[value]}
            {palette === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default AppearanceMenu;
