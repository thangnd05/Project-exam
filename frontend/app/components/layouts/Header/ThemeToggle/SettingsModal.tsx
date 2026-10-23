'use client';

import { Check, Languages } from 'lucide-react';
// Router gốc của Next: href đổi ngôn ngữ đã là URL đích, router của app/i18n sẽ gắn lại tiền tố đang xem.
import { useRouter } from 'next/navigation';
import { useLanguageSwitch } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import classNames from 'classnames/bind';
import BaseModal from '@/app/components/modal/BaseModal';
import { PALETTES } from '@/app/constants/theme';
import { LOCALE_LABELS } from '@/app/i18n/routing';
import { useTheme } from '@/app/components/layouts/Header/ThemeToggle/hooks/useTheme';
import { usePalette } from '@/app/components/layouts/Header/ThemeToggle/hooks/usePalette';
import { PALETTE_LABEL_KEYS, THEME_OPTIONS } from '@/app/components/layouts/Header/ThemeToggle/appearanceOptions';
import styles from '@/app/components/layouts/Header/ThemeToggle/SettingsModal.module.scss';

const cx = classNames.bind(styles);

type SettingsModalProps = {
  show: boolean;
  onClose: () => void;
};

// Cài đặt giao diện (chế độ, bảng màu, ngôn ngữ) mở từ menu tài khoản.
function SettingsModal({ show, onClose }: SettingsModalProps) {
  const { theme, setTheme } = useTheme();
  const { palette, setPalette } = usePalette();
  const t = useTranslations('Layout.appearance');
  const tNav = useTranslations('Layout.nav');
  const router = useRouter();
  const language = useLanguageSwitch();

  return (
    <BaseModal show={show} onClose={onClose} title={tNav('settings')} maxWidth={440} variant="plain">
      <div className={cx('body')}>
        <section className={cx('group')} role="radiogroup" aria-label={t('mode')}>
          <p className={cx('label')}>{t('mode')}</p>
          <div className={cx('options')}>
            {THEME_OPTIONS.map(({ value, labelKey, Icon }) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={theme === value}
                className={cx('option', { active: theme === value })}
                onClick={() => setTheme(value)}
              >
                <Icon size={16} aria-hidden="true" />
                {t(labelKey)}
                {theme === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>

        <section className={cx('group')} role="radiogroup" aria-label={t('palette')}>
          <p className={cx('label')}>{t('palette')}</p>
          <div className={cx('options')}>
            {PALETTES.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={palette === value}
                className={cx('option', { active: palette === value })}
                onClick={() => setPalette(value)}
              >
                <span className={cx('swatch', `swatch-${value}`)} aria-hidden="true" />
                {t(PALETTE_LABEL_KEYS[value])}
                {palette === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>

        <section className={cx('group')} role="radiogroup" aria-label={t('language')}>
          <p className={cx('label')}>{t('language')}</p>
          <div className={cx('options')}>
            {language.locales.map((value) => (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={language.locale === value}
                lang={value}
                className={cx('option', { active: language.locale === value })}
                onClick={() => language.locale !== value && router.push(language.hrefFor(value))}
              >
                <Languages size={16} aria-hidden="true" />
                {LOCALE_LABELS[value]}
                {language.locale === value && <Check size={16} className={cx('check')} aria-hidden="true" />}
              </button>
            ))}
          </div>
        </section>
      </div>
    </BaseModal>
  );
}

export default SettingsModal;
