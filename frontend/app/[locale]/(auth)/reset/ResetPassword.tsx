'use client';

import Link, { useRouter } from '@/app/i18n/navigation';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import classNames from 'classnames/bind';
import { Eye, EyeOff, Lock, CircleCheck, CircleAlert } from 'lucide-react';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import routes from '@/app/configs/Routes';
import { useResetPasswordMutation, useResetTokenQuery } from '@/app/features/auth/hooks/useAuthActions';
import type { ResetTokenInvalidReason } from '@/app/types';
import style from '@/app/[locale]/(auth)/_components/auth/AuthRecovery.module.scss';
import { PASSWORD_MAX_LENGTH, isPasswordValid } from '@/app/[locale]/(auth)/_components/auth/passwordRules';

const cx = classNames.bind(style);

const REDIRECT_DELAY_SECONDS = 4;

/** Nơi giữ token sau khi đã gỡ khỏi thanh địa chỉ. Chỉ sống trong tab hiện tại. */
const TOKEN_STORAGE_KEY = 'reset-password-token';

function readStoredToken(): string {
  try {
    return sessionStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

function storeToken(token: string) {
  try {
    sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
  } catch {
    /* Trình duyệt chặn storage thì bỏ qua, token vẫn nằm trong state. */
  }
}

function clearStoredToken() {
  try {
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* Không xoá được cũng không sao, token đã bị vô hiệu hoá phía server. */
  }
}

type AuthT = ReturnType<typeof useTranslations<'Auth'>>;

function formatRemaining(seconds: number, t: AuthT) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return t('reset.remainingSeconds', { secs });
  return t('reset.remainingMinutes', { mins, secs: secs.toString().padStart(2, '0') });
}

function ResetPassword() {
  const t = useTranslations('Auth');
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = (searchParams.get('token') || '').trim();
  const passwordHint = t('reset.passwordHint', { max: PASSWORD_MAX_LENGTH });

  // null = chưa đọc xong token, khác với '' nghĩa là không có token.
  const [token, setToken] = useState<string | null>(null);

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [formError, setFormError] = useState('');
  const [done, setDone] = useState(false);
  const [countdown, setCountdown] = useState(REDIRECT_DELAY_SECONDS);
  const [ticked, setTicked] = useState<number | null>(null);

  const tokenQuery = useResetTokenQuery(token ?? '');
  const resetMutation = useResetPasswordMutation();
  const isSubmitting = resetMutation.isPending;

  const passwordOk = isPasswordValid(newPassword);
  const confirmOk = confirmPassword.length > 0 && confirmPassword === newPassword;
  const canSubmit = passwordOk && confirmOk && !isSubmitting;

  /**
   * Gỡ token khỏi URL ngay khi mở trang để nó không nằm lại trong lịch sử trình duyệt,
   * ảnh chụp màn hình hay lúc share màn hình. Token được giữ trong sessionStorage nên
   * F5 vẫn dùng được, còn đóng tab là mất.
   */
  useEffect(() => {
    if (urlToken) {
      storeToken(urlToken);
      // eslint-disable-next-line react-hooks/set-state-in-effect -- đồng bộ với sessionStorage + gỡ token khỏi URL (hệ thống ngoài), chỉ chạy được ở client
      setToken(urlToken);
      router.replace(routes.reset, { scroll: false });
      return;
    }
    setToken(readStoredToken());
  }, [urlToken, router]);

  // Số giây còn lại do backend trả về, dùng làm giá trị khởi tạo cho đồng hồ đếm ngược.
  const initialRemaining = tokenQuery.data?.valid ? (tokenQuery.data.expiresInSeconds ?? null) : null;

  useEffect(() => {
    if (initialRemaining == null) return;
    const deadline = Date.now() + initialRemaining * 1000;
    const id = setInterval(() => {
      setTicked(Math.max(0, Math.ceil((deadline - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [initialRemaining]);

  const remaining = initialRemaining == null ? null : (ticked ?? initialRemaining);

  // Sau khi đổi thành công thì chuyển về trang đăng nhập.
  useEffect(() => {
    if (!done) return;
    if (countdown <= 0) {
      router.replace(routes.login);
      return;
    }
    const id = setTimeout(() => setCountdown((prev) => prev - 1), 1000);
    return () => clearTimeout(id);
  }, [done, countdown, router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setTouched({ password: true, confirm: true });
    setFormError('');

    if (!passwordOk) {
      setFormError(t('reset.invalidPassword', { hint: passwordHint }));
      return;
    }
    if (!confirmOk) {
      setFormError(t('reset.confirmMismatch'));
      return;
    }
    if (!token) {
      setFormError(t('reset.tokenMissing'));
      return;
    }

    try {
      await resetMutation.mutateAsync({
        token,
        newPassword,
        confirmNewPassword: confirmPassword,
      });
      clearStoredToken();
      setDone(true);
    } catch (err) {
      const response = isAxiosError<{ message?: string }>(err) ? err.response : undefined;
      const status = response?.status;
      if (status === 429) {
        setFormError(t('reset.tooFast'));
        return;
      }
      setFormError(
        response?.data?.message ||
          (response
            ? t('reset.resetFailed')
            : t('common.networkError')),
      );
      // Token có thể vừa bị vô hiệu hoá -> kiểm tra lại trạng thái.
      if (status === 400) tokenQuery.refetch();
    }
  };

  if (token === null || tokenQuery.isLoading) {
    return (
      <div className={cx('page')}>
        <div className={cx('card')}>
          <div className={cx('loadingState')}>
            <span className={cx('loadingSpinner')} />
            <span>{t('reset.checkingLink')}</span>
          </div>
        </div>
      </div>
    );
  }

  const tokenInvalid = !token || tokenQuery.isError || tokenQuery.data?.valid === false;

  if (tokenInvalid && !done) {
    const rawReason: ResetTokenInvalidReason = !token
      ? 'MISSING'
      : (tokenQuery.data?.reason as ResetTokenInvalidReason) || 'INVALID';
    const reason: ResetTokenInvalidReason = ['MISSING', 'INVALID', 'USED', 'EXPIRED'].includes(rawReason)
      ? rawReason
      : 'INVALID';

    return (
      <div className={cx('page')}>
        <div className={cx('card')}>
          <div className={cx('badge', 'danger')}>
            <CircleAlert size="1em" />
          </div>
          <h1 className={cx('title')}>{t('reset.linkUnusable')}</h1>
          <p className={cx('subtitle')}>
            {tokenQuery.isError
              ? t('reset.checkFailed')
              : t(`reset.invalidReason.${reason}`)}
          </p>

          <div className={cx('actions')}>
            <ButtonPrime as="link" href={routes.forgot} variant="ink" size="lg" fullWidth>
              {t('reset.requestNewLink')}
            </ButtonPrime>
          </div>

          <p className={cx('footer')}>
            <ButtonPrime as="link" variant="link" href={routes.login} className={cx('back-link')}>
              {t('common.backToLogin')}
            </ButtonPrime>
          </p>
        </div>
      </div>
    );
  }

  if (done) {
    return (
      <div className={cx('page')}>
        <div className={cx('card')}>
          <div className={cx('badge', 'success')}>
            <CircleCheck size="1em" />
          </div>
          <h1 className={cx('title')}>{t('reset.doneTitle')}</h1>
          <p className={cx('subtitle')}>
            {t('reset.doneDescription', { countdown })}
          </p>
          <div className={cx('actions')}>
            <ButtonPrime as="link" href={routes.login} variant="ink" size="lg" fullWidth>
              {t('common.signInNow')}
            </ButtonPrime>
          </div>
        </div>
      </div>
    );
  }

  const expired = remaining !== null && remaining <= 0;

  return (
    <div className={cx('page')}>
      <div className={cx('card')}>
        <div className={cx('badge')}>
          <Lock size="1em" />
        </div>
        <h1 className={cx('title')}>{t('reset.title')}</h1>
        <p className={cx('subtitle')}>
          {tokenQuery.data?.maskedEmail ? (
            t.rich('reset.subtitleFor', {
              email: tokenQuery.data.maskedEmail,
              strong: (chunks) => <strong>{chunks}</strong>,
            })
          ) : (
            t('reset.subtitle')
          )}
          {remaining !== null && !expired && (
            <>
              <br />
              {t('reset.validFor', { time: formatRemaining(remaining, t) })}
            </>
          )}
        </p>

        {expired && (
          <div className={cx('alert', 'alertError')} style={{ marginBottom: 16 }}>
            {t.rich('reset.expired', {
              link: (chunks) => <Link href={routes.forgot}>{chunks}</Link>,
            })}
          </div>
        )}

        <form className={cx('form')} onSubmit={handleSubmit} noValidate>
          <div className={cx('field')}>
            <div className={cx('control')}>
              <input
                id="new-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="new-password"
                autoFocus
                aria-label={t('reset.newPassword')}
                className={cx('input', 'hasToggle', {
                  invalid: touched.password && newPassword.length > 0 && !passwordOk,
                })}
                placeholder={t('reset.newPassword')}
                value={newPassword}
                disabled={isSubmitting || expired}
                onChange={(e) => {
                  setNewPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, password: true }))}
              />
              <button
                type="button"
                className={cx('toggle')}
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showPassword ? <EyeOff size="1em" /> : <Eye size="1em" />}
              </button>
            </div>

            <span className={cx('hint')}>{passwordHint}</span>
          </div>

          <div className={cx('field')}>
            <div className={cx('control')}>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                aria-label={t('reset.confirmPassword')}
                className={cx('input', 'hasToggle', {
                  invalid: touched.confirm && confirmPassword.length > 0 && !confirmOk,
                })}
                placeholder={t('reset.confirmPassword')}
                value={confirmPassword}
                disabled={isSubmitting || expired}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (formError) setFormError('');
                }}
                onBlur={() => setTouched((prev) => ({ ...prev, confirm: true }))}
              />
              <button
                type="button"
                className={cx('toggle')}
                onClick={() => setShowConfirm((prev) => !prev)}
                aria-label={showConfirm ? t('common.hidePassword') : t('common.showPassword')}
              >
                {showConfirm ? <EyeOff size="1em" /> : <Eye size="1em" />}
              </button>
            </div>
            {touched.confirm && confirmPassword.length > 0 && !confirmOk && (
              <span className={cx('fieldError')}>{t('reset.confirmMismatch')}</span>
            )}
          </div>

          {formError && <div className={cx('alert', 'alertError')}>{formError}</div>}

          <ButtonPrime as="link" variant="link" href={routes.login} className={cx('back-link')}>
            {t('common.backToLogin')}
          </ButtonPrime>

          <ButtonPrime type="submit" variant="ink" size="lg" fullWidth disabled={!canSubmit || expired}>
            {isSubmitting && <span className={cx('spinner')} />}
            {isSubmitting ? t('reset.updating') : t('reset.submit')}
          </ButtonPrime>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
