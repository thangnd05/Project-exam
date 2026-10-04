'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import classNames from 'classnames/bind';
import { FiEye, FiEyeOff, FiLock } from 'react-icons/fi';
import { MdCheckCircle, MdErrorOutline } from 'react-icons/md';
import routes from '@/app/configs/Routes';
import { useResetPasswordMutation, useResetTokenQuery } from '@/app/hooks/useAuthActions';
import type { ResetTokenInvalidReason } from '@/app/types';
import style from '../_components/auth/AuthRecovery.module.scss';
import { PASSWORD_HINT, isPasswordValid } from '../_components/auth/passwordRules';

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

const INVALID_REASON_TEXT: Record<ResetTokenInvalidReason, string> = {
  MISSING: 'Liên kết không chứa mã đặt lại mật khẩu. Hãy mở đúng liên kết trong email của bạn.',
  INVALID: 'Liên kết đặt lại mật khẩu không hợp lệ hoặc đã bị thay thế bởi một yêu cầu mới hơn.',
  USED: 'Liên kết này đã được sử dụng. Mỗi liên kết chỉ dùng được một lần.',
  EXPIRED: 'Liên kết đã hết hạn. Vui lòng yêu cầu một liên kết mới.',
};

function formatRemaining(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs} giây`;
  return `${mins} phút ${secs.toString().padStart(2, '0')} giây`;
}

function ResetPassword() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlToken = (searchParams.get('token') || '').trim();

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
      setFormError(`Mật khẩu mới chưa hợp lệ. ${PASSWORD_HINT}`);
      return;
    }
    if (!confirmOk) {
      setFormError('Mật khẩu xác nhận không khớp.');
      return;
    }
    if (!token) {
      setFormError('Không tìm thấy mã đặt lại mật khẩu. Vui lòng mở lại liên kết trong email.');
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
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        setFormError('Bạn thao tác quá nhanh. Vui lòng chờ một lát rồi thử lại.');
        return;
      }
      setFormError(
        err?.response?.data?.message ||
          (err?.response
            ? 'Không đặt lại được mật khẩu. Vui lòng thử lại.'
            : 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng của bạn.'),
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
            <span>Đang kiểm tra liên kết...</span>
          </div>
        </div>
      </div>
    );
  }

  const tokenInvalid = !token || tokenQuery.isError || tokenQuery.data?.valid === false;

  if (tokenInvalid && !done) {
    const reason: ResetTokenInvalidReason = !token
      ? 'MISSING'
      : (tokenQuery.data?.reason as ResetTokenInvalidReason) || 'INVALID';

    return (
      <div className={cx('page')}>
        <div className={cx('card')}>
          <div className={cx('badge', 'danger')}>
            <MdErrorOutline />
          </div>
          <h1 className={cx('title')}>Liên kết không dùng được</h1>
          <p className={cx('subtitle')}>
            {tokenQuery.isError
              ? 'Không kiểm tra được liên kết. Vui lòng thử lại hoặc yêu cầu liên kết mới.'
              : INVALID_REASON_TEXT[reason]}
          </p>

          <div className={cx('actions')}>
            <Link href={routes.forgot} className={cx('submitBtn')} style={{ textDecoration: 'none' }}>
              Yêu cầu liên kết mới
            </Link>
          </div>

          <p className={cx('footer')}>
            <Link href={routes.login} className={cx('back-link')}>
              Quay lại đăng nhập
            </Link>
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
            <MdCheckCircle />
          </div>
          <h1 className={cx('title')}>Đã đổi mật khẩu</h1>
          <p className={cx('subtitle')}>
            Mật khẩu của bạn đã được cập nhật. Mọi phiên đăng nhập cũ đã bị đăng xuất để đảm bảo an
            toàn. Đang chuyển tới trang đăng nhập sau {countdown}s...
          </p>
          <div className={cx('actions')}>
            <Link href={routes.login} className={cx('submitBtn')} style={{ textDecoration: 'none' }}>
              Đăng nhập ngay
            </Link>
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
          <FiLock />
        </div>
        <h1 className={cx('title')}>Đặt lại mật khẩu</h1>
        <p className={cx('subtitle')}>
          {tokenQuery.data?.maskedEmail ? (
            <>
              Tạo mật khẩu mới cho tài khoản <strong>{tokenQuery.data.maskedEmail}</strong>.
            </>
          ) : (
            'Tạo mật khẩu mới cho tài khoản của bạn.'
          )}
          {remaining !== null && !expired && (
            <>
              <br />
              Liên kết còn hiệu lực trong {formatRemaining(remaining)}.
            </>
          )}
        </p>

        {expired && (
          <div className={cx('alert', 'alertError')} style={{ marginBottom: 16 }}>
            Liên kết đã hết hạn. Vui lòng <Link href={routes.forgot}>yêu cầu liên kết mới</Link>.
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
                aria-label="Mật khẩu mới"
                className={cx('input', 'hasToggle', {
                  invalid: touched.password && newPassword.length > 0 && !passwordOk,
                })}
                placeholder="Mật khẩu mới"
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
                aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>

            <span className={cx('hint')}>{PASSWORD_HINT}</span>
          </div>

          <div className={cx('field')}>
            <div className={cx('control')}>
              <input
                id="confirm-password"
                type={showConfirm ? 'text' : 'password'}
                autoComplete="new-password"
                aria-label="Xác nhận mật khẩu mới"
                className={cx('input', 'hasToggle', {
                  invalid: touched.confirm && confirmPassword.length > 0 && !confirmOk,
                })}
                placeholder="Xác nhận mật khẩu mới"
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
                aria-label={showConfirm ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
              >
                {showConfirm ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
            {touched.confirm && confirmPassword.length > 0 && !confirmOk && (
              <span className={cx('fieldError')}>Mật khẩu xác nhận không khớp.</span>
            )}
          </div>

          {formError && <div className={cx('alert', 'alertError')}>{formError}</div>}

          <Link href={routes.login} className={cx('back-link')}>
            Quay lại đăng nhập
          </Link>

          <button type="submit" className={cx('submitBtn')} disabled={!canSubmit || expired}>
            {isSubmitting && <span className={cx('spinner')} />}
            {isSubmitting ? 'Đang cập nhật...' : 'Đặt lại mật khẩu'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ResetPassword;
