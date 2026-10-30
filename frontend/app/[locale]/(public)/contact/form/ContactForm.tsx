'use client';

import { useState } from 'react';
import type { FormEvent } from 'react';
import classNames from 'classnames/bind';
import { useTranslations } from 'next-intl';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import styles from './ContactForm.module.scss';

const cx = classNames.bind(styles);

const CONTACT_EMAIL = 'contact@frostscope.com';
const DISPUTE_EMAIL = 'legal@frostscope.com';

const CHANNELS = [
  { key: 'support', email: CONTACT_EMAIL },
  { key: 'disputes', email: DISPUTE_EMAIL },
] as const;

const TOPICS = ['exam', 'account', 'feedback', 'partnership', 'other'] as const;

function ContactForm() {
  const t = useTranslations('ContactForm');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  // Chưa có API liên hệ: mới dựng giao diện theo mẫu, tin nhắn chưa được gửi đi đâu.
  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSent(true);
    setMessage('');
  };

  return (
    <div className={cx('page')}>
      <header className={cx('header')}>
        <h1 className={cx('title')}>{t('title')}</h1>
        <p className={cx('intro')}>{t('intro')}</p>
      </header>

      <div className={cx('layout')}>
        <div className={cx('sidebar')}>
          {CHANNELS.map(({ key, email }) => (
            <section key={key} className={cx('card', 'infoCard')}>
              <h2 className={cx('infoTitle')}>{t(`${key}.title`)}</h2>
              <p className={cx('text')}>{t(`${key}.body`)}</p>
              <a href={`mailto:${email}`} className={cx('email')}>
                {email}
              </a>
            </section>
          ))}

          <section className={cx('card', 'infoCard')}>
            <h2 className={cx('infoTitle')}>{t('hours.title')}</h2>
            <p className={cx('text')}>{t('hours.body')}</p>
            <p className={cx('note')}>{t('hours.response')}</p>
          </section>
        </div>

        <section className={cx('card', 'formCard')}>
          <h2 className={cx('formTitle')}>{t('form.title')}</h2>
          <p className={cx('formSubtitle')}>{t('form.subtitle')}</p>

          <form className={cx('form')} onSubmit={handleSubmit}>
            <div>
              <label htmlFor="contact-name" className={cx('label')}>
                {t('form.name')}
              </label>
              <input
                id="contact-name"
                name="name"
                type="text"
                required
                autoComplete="name"
                placeholder={t('form.namePlaceholder')}
                className={cx('control')}
              />
            </div>

            <div>
              <label htmlFor="contact-email" className={cx('label')}>
                {t('form.email')}
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder={t('form.emailPlaceholder')}
                className={cx('control')}
              />
            </div>

            <div>
              <label htmlFor="contact-topic" className={cx('label')}>
                {t('form.topic')}
              </label>
              <select id="contact-topic" name="topic" className={cx('control')}>
                {TOPICS.map((topic) => (
                  <option key={topic} value={topic}>
                    {t(`form.topics.${topic}`)}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="contact-message" className={cx('label')}>
                {t('form.message')}
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                required
                value={message}
                onChange={(event) => setMessage(event.target.value)}
                placeholder={t('form.messagePlaceholder')}
                className={cx('control', 'textarea')}
              />
            </div>

            <div className={cx('actions')}>
              <ButtonPrime type="submit" variant="ink" className={cx('submitBtn')} disabled={sent}>
                {sent ? t('form.sent') : t('form.submit')}
              </ButtonPrime>
            </div>

            {sent && (
              <p role="status" className={cx('success')}>
                {t('form.success')}
              </p>
            )}
          </form>
        </section>
      </div>
    </div>
  );
}

export default ContactForm;
