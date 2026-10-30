'use client';

import { useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import { toast } from 'react-toastify';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import Link from '@/app/i18n/navigation';
import styles from './Contact.module.scss';

const cx = classNames.bind(styles);

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'legal@frostscope.com';
const PARTNER_EMAIL = 'partner@frostscope.com';

const COPIED_RESET_MS = 2000;

const CHANNELS = [
  { key: 'support', email: CONTACT_EMAIL, href: `mailto:${CONTACT_EMAIL}` },
  { key: 'disputes', email: DISPUTE_EMAIL, href: `mailto:${DISPUTE_EMAIL}` },
  { key: 'partnership', email: PARTNER_EMAIL, href: `mailto:${PARTNER_EMAIL}?subject=Hop%20Tac%20Doanh%20Nghiep` },
] as const;

const FAQ_KEYS = ['start', 'plan', 'review', 'certificate'] as const;

function Contact() {
  const t = useTranslations('Contact');
  const [copiedEmail, setCopiedEmail] = useState<string | null>(null);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const handleCopy = async (email: string) => {
    try {
      await navigator.clipboard.writeText(email);
      setCopiedEmail(email);
      clearTimeout(resetTimer.current);
      resetTimer.current = setTimeout(() => setCopiedEmail(null), COPIED_RESET_MS);
    } catch {
      toast.error(t('copyFailed'));
    }
  };

  return (
    <div className={cx('page')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>{t('title')}</h1>
        <p className={cx('intro')}>{t('intro')}</p>
      </header>

      <div className={cx('channels')}>
        {CHANNELS.map(({ key, email, href }) => (
          <section key={key} className={cx('card', 'channel')}>
            <div>
              <h2 className={cx('channelTitle')}>{t(`${key}.title`)}</h2>
              <p className={cx('text')}>{t(`${key}.body`)}</p>
            </div>

            <div className={cx('channelActions')}>
              <div className={cx('emailRow')}>
                <span className={cx('email')}>{email}</span>
                <button
                  type="button"
                  className={cx('copyBtn')}
                  title={t('copyTitle')}
                  onClick={() => handleCopy(email)}
                >
                  <span aria-live="polite">{copiedEmail === email ? t('copied') : t('copy')}</span>
                </button>
              </div>

              <ButtonPrime as="a" href={href} variant="ink" className={cx('sendBtn')} fullWidth>
                {t('sendEmail')}
              </ButtonPrime>
            </div>
          </section>
        ))}
      </div>

      <section className={cx('card', 'hours')}>
        <div>
          <h2 className={cx('hoursTitle')}>{t('hours.title')}</h2>
          <p className={cx('text', 'hoursText')}>{t('hours.body')}</p>
        </div>
        <span className={cx('sla')}>{t('hours.sla')}</span>
      </section>

      <section className={cx('faq')}>
        <h2 className={cx('faqTitle')}>{t('faq.title')}</h2>
        <p className={cx('faqSubtitle')}>{t('faq.subtitle')}</p>

        <div className={cx('faqGrid')}>
          {FAQ_KEYS.map((key) => (
            <div key={key} className={cx('faqItem')}>
              <h3 className={cx('faqQuestion')}>{t(`faq.${key}.question`)}</h3>
              <p className={cx('text')}>
                {t.rich(`faq.${key}.answer`, {
                  email: CONTACT_EMAIL,
                  link: (chunks) => <Link href={routes.examTypes} className={cx('inlineLink')}>{chunks}</Link>,
                  mail: (chunks) => <a href={`mailto:${CONTACT_EMAIL}`} className={cx('mono')}>{chunks}</a>,
                })}
              </p>
            </div>
          ))}
        </div>

        <div className={cx('cta')}>
          <ButtonPrime as="link" href={routes.examTypes} variant="ink" className={cx('ctaBtn')}>
            {t('faq.cta')}
          </ButtonPrime>
        </div>
      </section>
    </div>
  );
}

export default Contact;
