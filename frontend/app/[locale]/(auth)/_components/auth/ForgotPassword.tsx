'use client';

import {isAxiosError} from 'axios';
import {useCallback, useEffect, useRef, useState} from 'react';
import {useTranslations} from 'next-intl';
import classNames from 'classnames/bind';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import {useForgotPasswordMutation} from '@/app/features/auth/hooks/useAuthActions';
import style from '@/app/[locale]/(auth)/_components/auth/AuthRecovery.module.scss';

const cx = classNames.bind(style);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_COOLDOWN_SECONDS = 60;

function isEmailValid(value: string) {
  return EMAIL_PATTERN.test(value.trim());
}

type ForgotPasswordProps = {
  embedded?: boolean;
  onBack?: () => void;
};

function ForgotPassword({ embedded = false, onBack }: ForgotPasswordProps) {
  const t = useTranslations('Auth');
  const [email, setEmail] = useState('');
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const canSubmit = isEmailValid(email);

  const forgotPasswordMutation = useForgotPasswordMutation();
  const isSubmitting = forgotPasswordMutation.isPending;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startCooldown = useCallback((seconds: number) => {
    setCooldown(seconds);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          timerRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  const sendRequest = async (value: string) => {
    setFormError('');
    try {
      await forgotPasswordMutation.mutateAsync(value);
      setSentTo(value);
      startCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err) {
      const response = isAxiosError<{ message?: string }>(err) ? err.response : undefined;
      const status = response?.status;
      if (status === 429) {
        const retryAfter = Number(response?.headers?.['retry-after']);
        const waitFor =
          Number.isFinite(retryAfter) && retryAfter > 0
            ? retryAfter
            : RESEND_COOLDOWN_SECONDS;
        startCooldown(waitFor);
        setFormError(
          t('forgot.tooManyRequests', { seconds: waitFor }),
        );
        return;
      }
      setFormError(
        response?.data?.message ||
          (response
            ? t('forgot.requestFailed')
            : t('common.networkError')),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!isEmailValid(email)) return;
    await sendRequest(email.trim());
  };

  const backToLogin = onBack ? (
    <ButtonPrime variant="link" className={cx('back-link')} onClick={onBack}>
      {t('common.backToLogin')}
    </ButtonPrime>
  ) : (
    <ButtonPrime as="link" variant="link" href={routes.login} className={cx('back-link')}>
      {t('common.backToLogin')}
    </ButtonPrime>
  );

  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    await sendRequest(sentTo);
  };

  if (sentTo) {
    return (
      <div className={cx('page', { embedded })}>
        <div className={cx('card', { embedded })}>
          <h1 className={cx('title')}>{t('forgot.checkInbox')}</h1>
          <p className={cx('subtitle')}>
            {t.rich('forgot.sentDescription', {
              email: sentTo,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>

          {formError && (
            <div className={cx('alert', 'alertError')}>{formError}</div>
          )}

          <div className={cx('actions')}>
            <ButtonPrime
              variant="outline"
              fullWidth
              onClick={handleResend}
              disabled={cooldown > 0 || isSubmitting}
            >
              {isSubmitting
                ? t('forgot.resending')
                : cooldown > 0
                  ? t('forgot.resendIn', { seconds: cooldown })
                  : t('forgot.resend')}
            </ButtonPrime>
            <ButtonPrime
              variant="ghost"
              fullWidth
              onClick={() => {
                setSentTo('');
                setFormError('');
              }}
            >
              {t('forgot.useAnotherEmail')}
            </ButtonPrime>
          </div>

          <p className={cx('footer')}>
            {t('forgot.spamHint')}
            {backToLogin}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('page', { embedded })}>
      <div className={cx('card', { embedded })}>
        <h1 className={cx('title')}>{t('forgot.title')}</h1>
        <p className={cx('subtitle')}>
          {t('forgot.subtitle')}
        </p>

        <form className={cx('form')} onSubmit={handleSubmit} noValidate>
          <div className={cx('field')}>
            <div className={cx('control')}>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                autoFocus
                aria-label={t('forgot.email')}
                className={cx('input')}
                placeholder={t('forgot.email')}
                value={email}
                disabled={isSubmitting}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (formError) setFormError('');
                }}
              />
            </div>
          </div>

          {formError && (
            <div className={cx('alert', 'alertError')}>{formError}</div>
          )}

          {backToLogin}

          <ButtonPrime
            type="submit"
            variant="ink"
            size="lg"
            fullWidth
            disabled={!canSubmit || isSubmitting || cooldown > 0}
          >
            {isSubmitting && <span className={cx('spinner')} />}
            {isSubmitting
              ? t('forgot.sending')
              : cooldown > 0
                ? t('forgot.retryIn', { seconds: cooldown })
                : t('forgot.submit')}
          </ButtonPrime>
        </form>
      </div>
    </div>
  );
}

export default ForgotPassword;
