'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'react-toastify';
import {
  useLoginMutation,
  useRegisterMutation,
} from '@/app/hooks/useAuthActions';
import {
  getRedirectTarget,
  saveOAuthRedirect,
  claimGuestAfterLogin,
} from '@/app/utils/authRedirect';
import routes from '@/app/configs/Routes';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import { FcGoogle } from "react-icons/fc";
import { FaFacebook } from "react-icons/fa";
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { imageAssets, name } from '@/app/assets/images';
import ForgotPassword from '../forgot/ForgotPassword';
import RecaptchaCheckbox, { type RecaptchaCheckboxHandle } from '@/app/components/Recaptcha/RecaptchaCheckbox';

const cx = classNames.bind(style);

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

// Lỗi do trang /oauth2/redirect hoặc backend gắn vào ?error= khi đăng nhập Google thất bại.
const OAUTH_ERROR_TEXT: Record<string, string> = {
  oauth2_failed: 'Đăng nhập bằng Google thất bại. Vui lòng thử lại.',
  oauth2_timeout: 'Đăng nhập bằng Google mất quá nhiều thời gian. Vui lòng thử lại.',
};

const HIGHLIGHTS = [
  { title: 'Đề sát format thật', text: 'Cấu trúc và thời gian như phòng thi' },
  { title: 'Chấm điểm tự động', text: 'Có kết quả ngay sau khi nộp bài' },
  { title: 'Chẩn đoán điểm yếu', text: 'Biết rõ phần nào cần ôn lại' },
  { title: 'Lộ trình cá nhân hoá', text: 'Ôn đúng chỗ, không luyện mù quáng' },
];

function BrandLink({ className }: { className?: string }) {
  return (
    <Link href={routes.home} className={cx('brand', className)} aria-label={`Về trang chủ ${name}`}>
      <Image src={imageAssets.logoW} alt="" width={40} height={26} />
      <span>{name}</span>
    </Link>
  );
}

function BrandPanel() {
  return (
    <>
      <BrandLink className={cx('panelBrand')} />
      <div className={cx('pitch')}>
        <h2>Học theo lộ trình riêng - Chạm tay đến mục tiêu</h2>
        <ul className={cx('highlights')}>
          {HIGHLIGHTS.map(({ title, text }) => (
            <li key={title}>
              <strong>{title}</strong>
              <span>{text}</span>
            </li>
          ))}
        </ul>
      </div>
      <p className={cx('panelCopyright')}>© {name} Exam. All rights reserved.</p>
    </>
  );
}

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUserName, setRegUserName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegPassword, setShowRegPassword] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState('');
  const recaptchaRef = useRef<RecaptchaCheckboxHandle | null>(null);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const backendBaseUrl = getApiBaseUrl();
  const GOOGLE_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/google`;
  const FACEBOOK_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/facebook`;

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode) {
      setIsSignUp(mode === 'signup');
    }

    const error = searchParams.get('error');
    const flash = searchParams.get('flash');
    if (error) {
      setMessage(OAUTH_ERROR_TEXT[error] || OAUTH_ERROR_TEXT.oauth2_failed);
      setMessageType('error');
    } else if (flash) {
      // Flash là lời nhắc thân thiện ("Đăng nhập để..."), không phải lỗi.
      setMessage(flash);
      setMessageType('info');
    }
  }, [searchParams]);

  useEffect(() => {
    if (user) {
      router.replace(getRedirectTarget(searchParams));
    }
  }, [user, router, searchParams]);

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      const userData = await loginMutation.mutateAsync({
        identifier: loginIdentifier,
        password: loginPassword,
      });

      if (userData?.id) {
        await claimGuestAfterLogin();

        login(userData);

        setMessage("Đăng nhập thành công! Đang chuyển hướng...");
        setMessageType("success");
      } else {
        throw new Error("User data invalid");
      }
    } catch (err: any) {
      setMessage(
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại!"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setMessage('Vui lòng xác nhận bạn không phải là người máy.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const data = await registerMutation.mutateAsync({
        userName: regUserName,
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
        recaptchaToken,
      });

      try {
        const userData = await loginMutation.mutateAsync({
          identifier: regEmail,
          password: regPassword,
        });
        if (!userData?.id) throw new Error('User data invalid');
        await claimGuestAfterLogin();
        login(userData);
        toast.success('Chào mừng bạn đến với WinDe!');
      } catch {
        setMessage(data.message || 'Đăng ký thành công! Bạn có thể đăng nhập ngay.');
        setMessageType('success');
        toast.success('Đăng ký thành công! Đăng nhập để bắt đầu nhé.');
        setLoginIdentifier(regEmail);
        setIsSignUp(false);
      }
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'Tên đăng nhập hoặc Email đã tồn tại.'
          : 'Đăng ký thất bại. Vui lòng thử lại sau.');
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      recaptchaRef.current?.reset();
      setRecaptchaToken('');
      setLoading(false);
    }
  };

  const switchMode = (signUp: boolean) => {
    setIsSignUp(signUp);
    setShowForgot(false);
    setMessage('');
  };

  const handleSocialClick = () => saveOAuthRedirect(getRedirectTarget(searchParams));

  const socialButtons = (
    <div className={cx('social-btns')}>
      <a href={GOOGLE_AUTH_URL} className={cx('social-btn')} onClick={handleSocialClick} aria-label="Đăng nhập bằng Google">
        <FcGoogle size={24} />
      </a>
      <a href={FACEBOOK_AUTH_URL} className={cx('social-btn')} onClick={handleSocialClick} aria-label="Đăng nhập bằng Facebook">
        <FaFacebook size={24} color="#1877F2" />
      </a>
    </div>
  );

  const legalLinks = (
    <nav className={cx('legal')} aria-label="Thông tin pháp lý">
      <Link href={routes.service}>Điều khoản</Link>
      <span className={cx('legal-divider')} aria-hidden="true">|</span>
      <Link href={routes.policy}>Quyền riêng tư</Link>
    </nav>
  );

  return (
    <div className={cx('authPage')}>
      <div className={cx('mainCard', { signUpMode: isSignUp })}>
        <div className={cx('formContainer', 'signUpContainer')}>
          <div className={cx('formInner')}>
            <BrandLink className={cx('mobileBrand')} />
            <div className={cx('head')}>
              <h1>Tạo tài khoản</h1>
              <p>Bắt đầu hành trình chinh phục cùng cộng đồng {name}</p>
            </div>
            {socialButtons}

            <form onSubmit={handleRegister}>
              <div className={cx('field')}>
                <label htmlFor="reg-fullname">Họ và tên <span className={cx('required')}>*</span></label>
                <input
                  id="reg-fullname"
                  type="text"
                  autoComplete="name"
                  placeholder="Nhập họ và tên"
                  required
                  value={regFullName}
                  onChange={(e) => setRegFullName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={cx('field')}>
                <label htmlFor="reg-email">Email <span className={cx('required')}>*</span></label>
                <input
                  id="reg-email"
                  type="email"
                  autoComplete="email"
                  placeholder="Nhập email"
                  required
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={cx('field')}>
                <label htmlFor="reg-username">Tên đăng nhập <span className={cx('required')}>*</span></label>
                <input
                  id="reg-username"
                  type="text"
                  autoComplete="username"
                  placeholder="Nhập tên đăng nhập"
                  required
                  value={regUserName}
                  onChange={(e) => setRegUserName(e.target.value)}
                  disabled={loading}
                />
              </div>

              <div className={cx('field')}>
                <label htmlFor="reg-password">Mật khẩu <span className={cx('required')}>*</span></label>
                <div className={cx('control')}>
                  <input
                    id="reg-password"
                    type={showRegPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    placeholder="Nhập mật khẩu"
                    required
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    disabled={loading}
                  />
                  <button
                    type="button"
                    className={cx('password-toggle')}
                    onClick={() => setShowRegPassword((prev) => !prev)}
                    aria-label={showRegPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                  >
                    {showRegPassword ? <FiEyeOff /> : <FiEye />}
                  </button>
                </div>
              </div>

              <div className={cx('agreement')}>
                <RecaptchaCheckbox
                  ref={recaptchaRef}
                  siteKey={RECAPTCHA_SITE_KEY}
                  onChange={setRecaptchaToken}
                  className={cx('recaptchaBox')}
                />
              </div>

              {isSignUp && message && <div className={cx('login-message', messageType)}><p>{message}</p></div>}
              <button type="submit" className={cx('login-btn')} disabled={loading}>
                {loading && <span className={cx('loading-spinner')} />}
                <span>{loading ? 'Đang xử lý...' : 'Đăng ký'}</span>
              </button>
            </form>

            <p className={cx('mode-switch')}>
              Đã có tài khoản?{' '}
              <button type="button" onClick={() => switchMode(false)}>Đăng nhập ngay</button>
            </p>
          </div>
          {legalLinks}
        </div>

        <div className={cx('formContainer', 'signInContainer')}>
          {showForgot ? (
            <div className={cx('formInner')}>
              <BrandLink className={cx('mobileBrand')} />
              <ForgotPassword embedded onBack={() => setShowForgot(false)} />
            </div>
          ) : (
            <div className={cx('formInner')}>
              <BrandLink className={cx('mobileBrand')} />
              <div className={cx('head')}>
                <h1>Đăng nhập tài khoản</h1>
                <p>Chào mừng bạn quay lại với {name}</p>
              </div>
              {socialButtons}

              <form onSubmit={handleLogin}>
                <div className={cx('field')}>
                  <label htmlFor="login-identifier">Email hoặc tên đăng nhập <span className={cx('required')}>*</span></label>
                  <input
                    id="login-identifier"
                    type="text"
                    autoComplete="username"
                    placeholder="Nhập email hoặc tên đăng nhập"
                    required
                    value={loginIdentifier}
                    onChange={(e) => setLoginIdentifier(e.target.value)}
                    disabled={loading}
                  />
                </div>

                <div className={cx('field')}>
                  <label htmlFor="login-password">Mật khẩu <span className={cx('required')}>*</span></label>
                  <div className={cx('control')}>
                    <input
                      id="login-password"
                      type={showLoginPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      placeholder="Nhập mật khẩu"
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      disabled={loading}
                    />
                    <button
                      type="button"
                      className={cx('password-toggle')}
                      onClick={() => setShowLoginPassword((prev) => !prev)}
                      aria-label={showLoginPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
                    >
                      {showLoginPassword ? <FiEyeOff /> : <FiEye />}
                    </button>
                  </div>
                </div>

                <button type="button" className={cx('forgot-link')} onClick={() => { setShowForgot(true); setMessage(''); }}>
                  Quên mật khẩu?
                </button>
                {!isSignUp && message && <div className={cx('login-message', messageType)}><p>{message}</p></div>}

                <button type="submit" className={cx('login-btn')} disabled={loading}>
                  {loading && <span className={cx('loading-spinner')} />}
                  <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập'}</span>
                </button>
              </form>

              <p className={cx('mode-switch')}>
                Chưa có tài khoản?{' '}
                <button type="button" onClick={() => switchMode(true)}>Đăng ký ngay</button>
              </p>
            </div>
          )}
          {legalLinks}
        </div>

        <div className={cx('overlayContainer', 'theme-locked')}>
          <div className={cx('overlay')}>
            <div className={cx('overlayPanel', 'overlayLeft')}>
              <BrandPanel />
            </div>
            <div className={cx('overlayPanel', 'overlayRight')}>
              <BrandPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
