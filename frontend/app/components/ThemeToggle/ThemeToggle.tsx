'use client';

import { Moon, Sun } from 'lucide-react';
import classNames from 'classnames/bind';
import { useTheme } from '@/app/hooks/useTheme';
import styles from './ThemeToggle.module.scss';

const cx = classNames.bind(styles);

function ThemeToggle({ className }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';
  const label = isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối';

  return (
    <button type="button" className={cx('toggle', className)} onClick={toggleTheme} aria-label={label} title={label}>
      {isDark ? <Sun size={18} aria-hidden="true" /> : <Moon size={18} aria-hidden="true" />}
    </button>
  );
}

export default ThemeToggle;
