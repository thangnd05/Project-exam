'use client';

import Link from 'next/link';
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
import { name } from '@/app/assets/images';
import RecaptchaCheckbox, { type RecaptchaCheckboxHandle } from '@/app/components/Recaptcha/RecaptchaCheckbox';

const cx = classNames.bind(style);

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

function Login() {
  const [isSignUp, setIsSignUp] = useState(false);

  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUserName, setRegUserName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
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

  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode) {
      setIsSignUp(mode === 'signup');
    }

    const flash = searchParams.get('flash');
    if (flash) {
      setMessage(flash);
      setMessageType('error');
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

      // [TẮT XÁC THỰC EMAIL] Tài khoản active ngay, không cần vào mail bấm link nữa.
      setMessage(data.message || 'Đăng ký thành công! Bạn có thể đăng nhập ngay.');
      setMessageType('success');
      toast.success('Đăng ký thành công! Đăng nhập để bắt đầu nhé.');
      // toast.info('Vui lòng vào email vừa đăng ký để xác thực tài khoản!');
      setIsSignUp(false);
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

  return (
    <div className={cx('splitContainer')}>
      <div className={cx('mainCard', { 'signUpMode': isSignUp })}>

        <div className={cx('formContainer', 'signUpContainer')}>
          <form onSubmit={handleRegister}>
            <h1>Tạo tài khoản</h1>
            <div className={cx('social-login')}>
              <div className={cx('social-btns')}>
                <a href={GOOGLE_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(searchParams))}><FcGoogle size={24} /></a>
              </div>
            </div>

            <div className={cx('input-box')}>
              <input type="text" placeholder="Họ và tên" required value={regFullName} onChange={(e) => setRegFullName(e.target.value)} />
            </div>
            <div className={cx('input-box')}>
              <input type="email" placeholder="Email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} />
            </div>
            <div className={cx('input-box')}>
              <input type="text" placeholder="Tên đăng nhập" required value={regUserName} onChange={(e) => setRegUserName(e.target.value)} />
            </div>
            <div className={cx('input-box')}>
              <input type="password" placeholder="Mật khẩu" required value={regPassword} onChange={(e) => setRegPassword(e.target.value)} />
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
            <button type="submit" className={cx('login-btn')} disabled={loading}>Đăng ký ngay</button>
            <div className={cx('mobile-switch')}>
              <span>Đã có tài khoản? </span>
              <button type="button" style={{ textDecoration: 'none' }} onClick={() => { setIsSignUp(false); setMessage(''); }}>
                Đăng nhập ngay
              </button>
            </div>
          </form>
        </div>

        <div className={cx('formContainer', 'signInContainer')}>
          <form onSubmit={handleLogin}>
            <h1>Đăng nhập</h1>
            <div className={cx('social-login')}>
              <div className={cx('social-btns')}>
                <a href={GOOGLE_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(searchParams))}><FcGoogle size={24} /></a>
              </div>
            </div>
            <div className={cx('input-box')}>
              <input type="text" placeholder="Email hoặc Tên đăng nhập" required value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} disabled={loading} />
            </div>
            <div className={cx('input-box')}>
              <input type="password" placeholder="Mật khẩu" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={loading} />
            </div>

            <Link href={routes.forgot} className={cx('forgot-link')}>Bạn quên mật khẩu?</Link>
            {!isSignUp && message && <div className={cx('login-message', messageType)}><p>{message}</p></div>}

            <button type="submit" className={cx('login-btn')} disabled={loading}>
              {loading ? <div className={cx('loading-spinner')}></div> : 'Đăng nhập ngay'}
            </button>

            <div className={cx('mobile-switch')}>
              <span>Chưa có tài khoản? </span>
              <button type="button" style={{ textDecoration: 'none' }} onClick={() => { setIsSignUp(true); setMessage(''); }}>
                Đăng ký ngay
              </button>
            </div>
          </form>
        </div>

        <div className={cx('overlayContainer')}>
          <div className={cx('overlay')}>
            <div className={cx('overlayPanel', 'overlayLeft')}>
              <h2>Chào mừng trở lại!</h2>
              <p>Để giữ kết nối với chúng tôi vui lòng đăng nhập bằng thông tin cá nhân của bạn</p>
              <button className={cx('ghost-btn')} id="signIn" onClick={() => { setIsSignUp(false); setMessage(''); }}>
                Đăng nhập ngay
              </button>
            </div>
            <div className={cx('overlayPanel', 'overlayRight')}>
              <h2>Chào bạn!</h2>
              <p>Bắt đầu hành trình chinh phục cùng cộng đồng {name} ngay nào.</p>
              <button className={cx('ghost-btn')} id="signUp" onClick={() => { setIsSignUp(true); setMessage(''); }}>
                Đăng ký ngay
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
