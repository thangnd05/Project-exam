'use client';

import { Check, Languages, Palette as PaletteIcon } from 'lucide-react';
// Router gốc của Next: href đổi ngôn ngữ đã là URL đích, router của app/i18n sẽ gắn lại tiền tố đang xem.
import { useRouter } from 'next/navigation';
import { useLanguageSwitch } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Dropdown } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { PALETTES } from '@/app/constants/theme';
import { LOCALE_LABELS } from '@/app/i18n/routing';
import { useTheme } from '@/app/components/layouts/Header/ThemeToggle/hooks/useTheme';
import { usePalette } from '@/app/components/layouts/Header/ThemeToggle/hooks/usePalette';
import { PALETTE_LABEL_KEYS, THEME_OPTIONS } from '@/app/components/layouts/Header/ThemeToggle/appearanceOptions';
import styles from '@/app/components/layouts/Header/ThemeToggle/ThemeToggle.module.scss';

const cx = classNames.bind(styles);

// Màu nền/chữ của menu đổi theo nền phía sau header nên do Header truyền class vào.
interface AppearanceMenuProps {
  classes?: Partial<Record<'toggle' | 'menu' | 'label' | 'divider', string>>;
}

function AppearanceMenu({ classes = {} }: AppearanceMenuProps) {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  const t = useTranslations('Layout.appearance');
  const router = useRouter();
  const language = useLanguageSwitch();

  return (
    // Chọn xong menu vẫn mở để thử tiếp; bấm ra ngoài hoặc Esc mới đóng.
    <Dropdown align="end" autoClose="outside">
      <Dropdown.Toggle
        as="button"
        type="button"
        className={cx('toggle', classes.toggle)}
        aria-label={t('title')}
        title={t('title')}
      >
        <PaletteIcon size={18} aria-hidden="true" />
      </Dropdown.Toggle>
      <Dropdown.Menu className={cx('menu', classes.menu)}>
        <p className={cx('label', classes.label)}>{t('mode')}</p>
        {THEME_OPTIONS.map(({ value, labelKey, Icon }) => (
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
            {t(labelKey)}
            {theme === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
          </Dropdown.Item>
        ))}

        <Dropdown.Divider className={classes.divider} />

        <p className={cx('label', classes.label)}>{t('palette')}</p>
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
            {t(PALETTE_LABEL_KEYS[value])}
            {palette === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
          </Dropdown.Item>
        ))}

        <Dropdown.Divider className={classes.divider} />

        <p className={cx('label', classes.label)}>{t('language')}</p>
        {language.locales.map((value) => (
          <Dropdown.Item
            key={value}
            as="button"
            type="button"
            role="menuitemradio"
            aria-checked={language.locale === value}
            lang={value}
            className={cx('option')}
            onClick={() => language.locale !== value && router.push(language.hrefFor(value))}
          >
            <Languages size={16} aria-hidden="true" />
            {LOCALE_LABELS[value]}
            {language.locale === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
          </Dropdown.Item>
        ))}
      </Dropdown.Menu>
    </Dropdown>
  );
}

export default AppearanceMenu;
