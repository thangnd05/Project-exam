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
import { FiArrowLeft, FiArrowRight, FiAtSign, FiEye, FiEyeOff, FiLock, FiMail, FiUser } from 'react-icons/fi';
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

// Logo màu cho nền sáng, logo trắng cho dark mode; CSS quyết định cái nào hiển thị.
function BrandLink() {
  return (
    <Link href={routes.home} className={cx('brand')} aria-label="Về trang chủ">
      <Image
        src={imageAssets.frostscopeLogoRgb}
        alt="FrostScope"
        width={190}
        height={40}
        priority
        className={cx('brandLogo', 'brandLogoLight')}
      />
      <Image
        src={imageAssets.frostscopeLogoWhite}
        alt=""
        width={190}
        height={40}
        className={cx('brandLogo', 'brandLogoDark')}
      />
    </Link>
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
    <div className={cx('socialBtns')}>
      <a href={GOOGLE_AUTH_URL} className={cx('socialBtn')} onClick={handleSocialClick}>
        <FcGoogle size={18} aria-hidden="true" />
        <span>Tiếp tục với Google</span>
      </a>
      <a href={FACEBOOK_AUTH_URL} className={cx('socialBtn')} onClick={handleSocialClick}>
        <FaFacebook size={18} color="#1877F2" aria-hidden="true" />
        <span>Tiếp tục với Facebook</span>
      </a>
    </div>
  );

  const passwordToggle = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      className={cx('passwordToggle')}
      onClick={toggle}
      aria-label={shown ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
    >
      {shown ? <FiEyeOff /> : <FiEye />}
    </button>
  );

  const messageBox = message && (
    <div className={cx('loginMessage', messageType)} role={messageType === 'error' ? 'alert' : 'status'}>
      <p>{message}</p>
    </div>
  );

  const loginForm = (
    <form onSubmit={handleLogin} className={cx('form')}>
      <div className={cx('field')}>
        <label htmlFor="login-identifier">Email hoặc tên đăng nhập</label>
        <div className={cx('control')}>
          <FiMail className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="login-identifier"
            type="text"
            autoComplete="username"
            placeholder="name@example.com"
            required
            value={loginIdentifier}
            onChange={(e) => setLoginIdentifier(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('field')}>
        <div className={cx('labelRow')}>
          <label htmlFor="login-password">Mật khẩu</label>
          <button
            type="button"
            className={cx('textLink')}
            onClick={() => { setShowForgot(true); setMessage(''); }}
          >
            Quên mật khẩu?
          </button>
        </div>
        <div className={cx('control')}>
          <FiLock className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="login-password"
            type={showLoginPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder="Nhập mật khẩu của bạn"
            required
            value={loginPassword}
            onChange={(e) => setLoginPassword(e.target.value)}
            disabled={loading}
            className={cx('hasToggle')}
          />
          {passwordToggle(showLoginPassword, () => setShowLoginPassword((prev) => !prev))}
        </div>
      </div>

      {messageBox}

      <button type="submit" className={cx('submitBtn')} disabled={loading}>
        {loading && <span className={cx('loadingSpinner')} />}
        <span>{loading ? 'Đang đăng nhập...' : 'Đăng nhập ngay'}</span>
        {!loading && <FiArrowRight aria-hidden="true" />}
      </button>
    </form>
  );

  const registerForm = (
    <form onSubmit={handleRegister} className={cx('form')}>
      <div className={cx('field')}>
        <label htmlFor="reg-fullname">Họ và tên</label>
        <div className={cx('control')}>
          <FiUser className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-fullname"
            type="text"
            autoComplete="name"
            placeholder="Ví dụ: Nguyễn Văn An"
            required
            value={regFullName}
            onChange={(e) => setRegFullName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('field')}>
        <label htmlFor="reg-email">Địa chỉ email</label>
        <div className={cx('control')}>
          <FiMail className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-email"
            type="email"
            autoComplete="email"
            placeholder="name@example.com"
            required
            value={regEmail}
            onChange={(e) => setRegEmail(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('field')}>
        <label htmlFor="reg-username">Tên đăng nhập</label>
        <div className={cx('control')}>
          <FiAtSign className={cx('fieldIcon')} aria-hidden="true" />
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
      </div>

      <div className={cx('field')}>
        <label htmlFor="reg-password">Mật khẩu</label>
        <div className={cx('control')}>
          <FiLock className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-password"
            type={showRegPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder="Tạo mật khẩu an toàn"
            required
            value={regPassword}
            onChange={(e) => setRegPassword(e.target.value)}
            disabled={loading}
            className={cx('hasToggle')}
          />
          {passwordToggle(showRegPassword, () => setShowRegPassword((prev) => !prev))}
        </div>
      </div>

      <div className={cx('recaptchaRow')}>
        <RecaptchaCheckbox
          ref={recaptchaRef}
          siteKey={RECAPTCHA_SITE_KEY}
          onChange={setRecaptchaToken}
          className={cx('recaptchaBox')}
        />
      </div>

      <p className={cx('terms')}>
        Bằng việc đăng ký, bạn đồng ý với <Link href={routes.service}>Điều khoản</Link> và{' '}
        <Link href={routes.policy}>Chính sách bảo mật</Link> của chúng tôi.
      </p>

      {messageBox}

      <button type="submit" className={cx('submitBtn')} disabled={loading}>
        {loading && <span className={cx('loadingSpinner')} />}
        <span>{loading ? 'Đang xử lý...' : 'Tạo tài khoản'}</span>
        {!loading && <FiArrowRight aria-hidden="true" />}
      </button>
    </form>
  );

  return (
    <div className={cx('authPage')}>
      <div className={cx('topBar')}>
        <Link href={routes.home} className={cx('backHome')}>
          <FiArrowLeft aria-hidden="true" />
          <span>Về trang chủ</span>
        </Link>
        <div className={cx('topSwitch')}>
          <span className={cx('topSwitchText')}>
            {isSignUp ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
          </span>
          <button type="button" className={cx('textLink')} onClick={() => switchMode(!isSignUp)}>
            {isSignUp ? 'Đăng nhập' : 'Đăng ký ngay'}
          </button>
        </div>
      </div>

      <main className={cx('main')}>
        <div className={cx('column')}>
          <div className={cx('brandHead')}>
            <BrandLink />
            <p>Nền tảng ôn thi chứng chỉ Cloud cá nhân hóa</p>
          </div>

          <div className={cx('card')}>
            {showForgot ? (
              <ForgotPassword embedded onBack={() => setShowForgot(false)} />
            ) : (
              <>
                <div className={cx('tabs')} role="tablist" aria-label="Chọn đăng nhập hoặc đăng ký">
                  <button
                    type="button"
                    role="tab"
                    aria-selected={!isSignUp}
                    className={cx('tab', { activeTab: !isSignUp })}
                    onClick={() => switchMode(false)}
                  >
                    Đăng nhập
                  </button>
                  <button
                    type="button"
                    role="tab"
                    aria-selected={isSignUp}
                    className={cx('tab', { activeTab: isSignUp })}
                    onClick={() => switchMode(true)}
                  >
                    Đăng ký
                  </button>
                </div>

                {socialButtons}

                <div className={cx('orDivider')}>
                  <span>Hoặc với email</span>
                </div>

                <div key={isSignUp ? 'signup' : 'signin'} className={cx('panel')}>
                  {isSignUp ? registerForm : loginForm}
                </div>
              </>
            )}
          </div>
        </div>
      </main>

      <footer className={cx('bottom')}>
        <nav className={cx('legal')} aria-label="Thông tin pháp lý">
          <Link href={routes.service}>Điều khoản</Link>
          <span className={cx('legalDivider')} aria-hidden="true" />
          <Link href={routes.policy}>Quyền riêng tư</Link>
        </nav>
        <p className={cx('copyright')}>© {name} Exam. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Login;
