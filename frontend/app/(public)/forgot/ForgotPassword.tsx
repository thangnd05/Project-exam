'use client';

import Link from 'next/link';
import { useCallback, useEffect, useRef, useState } from 'react';
import classNames from 'classnames/bind';
import { FiArrowLeft, FiMail } from 'react-icons/fi';
import { MdMarkEmailRead } from 'react-icons/md';
import routes from '@/app/configs/Routes';
import { useForgotPasswordMutation } from '@/app/hooks/useAuthActions';
import style from '../_components/auth/AuthRecovery.module.scss';

const cx = classNames.bind(style);

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const RESEND_COOLDOWN_SECONDS = 60;

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [formError, setFormError] = useState('');
  const [sentTo, setSentTo] = useState('');
  const [cooldown, setCooldown] = useState(0);

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

  const validate = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return 'Vui lòng nhập email.';
    if (!EMAIL_PATTERN.test(trimmed)) return 'Email không đúng định dạng.';
    return '';
  };

  const sendRequest = async (value: string) => {
    setFormError('');
    try {
      await forgotPasswordMutation.mutateAsync(value);
      setSentTo(value);
      startCooldown(RESEND_COOLDOWN_SECONDS);
    } catch (err: any) {
      const status = err?.response?.status;
      if (status === 429) {
        const retryAfter = Number(err?.response?.headers?.['retry-after']);
        const waitFor = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter : RESEND_COOLDOWN_SECONDS;
        startCooldown(waitFor);
        setFormError(`Bạn đã gửi quá nhiều yêu cầu. Vui lòng thử lại sau ${waitFor} giây.`);
        return;
      }
      setFormError(
        err?.response?.data?.message ||
          (err?.response
            ? 'Không gửi được yêu cầu. Vui lòng thử lại.'
            : 'Không thể kết nối đến máy chủ. Kiểm tra kết nối mạng của bạn.'),
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const message = validate(email);
    setEmailError(message);
    if (message) return;
    await sendRequest(email.trim());
  };

  const handleResend = async () => {
    if (cooldown > 0 || isSubmitting) return;
    await sendRequest(sentTo);
  };

  if (sentTo) {
    return (
      <div className={cx('page')}>
        <div className={cx('card')}>
          <div className={cx('badge', 'success')}>
            <MdMarkEmailRead />
          </div>
          <h1 className={cx('title')}>Kiểm tra hộp thư của bạn</h1>
          <p className={cx('subtitle')}>
            Nếu <strong>{sentTo}</strong> đang được dùng cho một tài khoản, chúng tôi đã gửi một liên
            kết đặt lại mật khẩu đến email đó. Liên kết có hiệu lực trong 30 phút và chỉ dùng được
            một lần.
          </p>

          {formError && <div className={cx('alert', 'alertError')}>{formError}</div>}

          <div className={cx('actions')}>
            <button
              type="button"
              className={cx('ghostBtn')}
              onClick={handleResend}
              disabled={cooldown > 0 || isSubmitting}
            >
              {isSubmitting
                ? 'Đang gửi lại...'
                : cooldown > 0
                  ? `Gửi lại sau ${cooldown}s`
                  : 'Gửi lại email'}
            </button>
            <button
              type="button"
              className={cx('ghostBtn')}
              onClick={() => {
                setSentTo('');
                setFormError('');
              }}
            >
              Dùng email khác
            </button>
          </div>

          <p className={cx('footer')}>
            Không thấy email? Hãy kiểm tra cả mục Spam / Quảng cáo.
            <br />
            <Link href={routes.login}>Quay lại đăng nhập</Link>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={cx('page')}>
      <div className={cx('card')}>
        <div className={cx('badge')}>
          <FiMail />
        </div>
        <h1 className={cx('title')}>Quên mật khẩu?</h1>
        <p className={cx('subtitle')}>
          Nhập email bạn đã đăng ký. Chúng tôi sẽ gửi cho bạn một liên kết để đặt lại mật khẩu.
        </p>

        <form className={cx('form')} onSubmit={handleSubmit} noValidate>
          <div className={cx('field')}>
            <label className={cx('label')} htmlFor="forgot-email">
              Email
            </label>
            <div className={cx('control')}>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                autoFocus
                className={cx('input', { invalid: Boolean(emailError) })}
                placeholder="ban@example.com"
                value={email}
                disabled={isSubmitting}
                aria-invalid={Boolean(emailError)}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError) setEmailError('');
                  if (formError) setFormError('');
                }}
                onBlur={(e) => setEmailError(validate(e.target.value))}
              />
            </div>
            {emailError && <span className={cx('fieldError')}>{emailError}</span>}
          </div>

          {formError && <div className={cx('alert', 'alertError')}>{formError}</div>}

          <button type="submit" className={cx('submitBtn')} disabled={isSubmitting || cooldown > 0}>
            {isSubmitting && <span className={cx('spinner')} />}
            {isSubmitting
              ? 'Đang gửi...'
              : cooldown > 0
                ? `Thử lại sau ${cooldown}s`
                : 'Gửi liên kết đặt lại'}
          </button>
        </form>

        <p className={cx('footer')}>
          <Link href={routes.login}>
            <FiArrowLeft style={{ verticalAlign: 'middle', marginRight: 4 }} />
            Quay lại đăng nhập
          </Link>
        </p>
      </div>
    </div>
  );
}

export default ForgotPassword;
