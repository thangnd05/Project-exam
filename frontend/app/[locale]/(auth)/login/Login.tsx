'use client';

import Link, { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { isAxiosError } from 'axios';
import { getApiBaseUrl } from '@/app/utils/mediaUrl';
import { useAuth } from '@/app/hooks/useAuth';
import { toast } from 'react-toastify';
import {
  useLoginMutation,
  useRegisterMutation,
} from '@/app/features/auth/hooks/useAuthActions';
import {
  getRedirectTarget,
  saveOAuthRedirect,
  claimGuestAfterLogin,
} from '@/app/features/auth/authRedirect';
import routes from '@/app/configs/Routes';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import { ArrowLeft, ArrowRight, AtSign, Eye, EyeOff, Lock, Mail, User } from 'lucide-react';
import { FacebookLogo, GoogleLogo } from '@/app/[locale]/(auth)/login/_components/SocialLogos';
import { imageAssets } from '@/app/assets/images';
import { SITE_NAME } from '@/app/constants/site';
import ForgotPassword from '@/app/[locale]/(auth)/_components/auth/ForgotPassword';
import RecaptchaCheckbox, { type RecaptchaCheckboxHandle } from '@/app/[locale]/(auth)/login/_components/Recaptcha/RecaptchaCheckbox';

const cx = classNames.bind(style);

const RECAPTCHA_SITE_KEY = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || '';

// Lỗi do trang /oauth2/redirect hoặc backend gắn vào ?error= khi đăng nhập Google thất bại.
const OAUTH_ERROR_KEYS = {
  oauth2_failed: 'login.oauthFailed',
  oauth2_timeout: 'login.oauthTimeout',
} as const;

const isOAuthError = (error: string): error is keyof typeof OAUTH_ERROR_KEYS => error in OAUTH_ERROR_KEYS;

// Logo màu cho nền sáng, logo trắng cho dark mode; CSS quyết định cái nào hiển thị.
function BrandLink() {
  const t = useTranslations('Auth');
  return (
    <Link href={routes.home} className={cx('brand')} aria-label={t('login.backHome')}>
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

  const t = useTranslations('Auth');
  const tCommon = useTranslations('Common');
  const localizeHref = useLocalizeHref();
  const { user, login } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const loginMutation = useLoginMutation();
  const registerMutation = useRegisterMutation();

  const backendBaseUrl = getApiBaseUrl();
  const GOOGLE_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/google`;
  const FACEBOOK_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/facebook`;

  // Đồng bộ mode/thông báo từ URL mỗi khi query string đổi (điều chỉnh state ngay khi render).
  const [syncedParams, setSyncedParams] = useState<typeof searchParams | null>(null);
  if (syncedParams !== searchParams) {
    setSyncedParams(searchParams);

    const mode = searchParams.get('mode');
    if (mode) {
      setIsSignUp(mode === 'signup');
    }

    const error = searchParams.get('error');
    const flash = searchParams.get('flash');
    if (error) {
      setMessage(t(isOAuthError(error) ? OAUTH_ERROR_KEYS[error] : OAUTH_ERROR_KEYS.oauth2_failed));
      setMessageType('error');
    } else if (flash) {
      // Flash là lời nhắc thân thiện ("Đăng nhập để..."), không phải lỗi.
      setMessage(flash);
      setMessageType('info');
    }
  }

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

        setMessage(t('login.loginSuccess'));
        setMessageType("success");
      } else {
        throw new Error("User data invalid");
      }
    } catch (err) {
      setMessage(
        (isAxiosError<{ message?: string }>(err) && err.response?.data?.message) ||
        t('login.loginFailed')
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (RECAPTCHA_SITE_KEY && !recaptchaToken) {
      setMessage(t('login.recaptchaRequired'));
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
        toast.success(t('login.welcome'));
      } catch {
        setMessage(data.message || t('login.registerSuccess'));
        setMessageType('success');
        toast.success(t('login.registerSuccessToast'));
        setLoginIdentifier(regEmail);
        setIsSignUp(false);
      }
    } catch (err) {
      const response = isAxiosError<{ message?: string }>(err) ? err.response : undefined;
      const errorMessage =
        response?.data?.message ||
        (response?.status === 500
          ? t('login.accountExists')
          : t('login.registerFailed'));
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

  // Backend luôn trả về /oauth2/redirect (không tiền tố ngôn ngữ), nên lưu sẵn đích đã gắn ngôn ngữ đang xem.
  const handleSocialClick = () => saveOAuthRedirect(localizeHref(getRedirectTarget(searchParams)));

  const socialButtons = (
    <div className={cx('socialBtns')}>
      <ButtonPrime as="a" variant="outline" href={GOOGLE_AUTH_URL} onClick={handleSocialClick}>
        <GoogleLogo size={18} aria-hidden="true" />
        <span>{t('login.continueWithGoogle')}</span>
      </ButtonPrime>
      <ButtonPrime as="a" variant="outline" href={FACEBOOK_AUTH_URL} onClick={handleSocialClick}>
        <FacebookLogo size={18} color="#1877F2" aria-hidden="true" />
        <span>{t('login.continueWithFacebook')}</span>
      </ButtonPrime>
    </div>
  );

  const passwordToggle = (shown: boolean, toggle: () => void) => (
    <button
      type="button"
      className={cx('passwordToggle')}
      onClick={toggle}
      aria-label={shown ? t('common.hidePassword') : t('common.showPassword')}
    >
      {shown ? <EyeOff size="1em" /> : <Eye size="1em" />}
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
        <label htmlFor="login-identifier">{t('login.identifierLabel')}</label>
        <div className={cx('control')}>
          <Mail size="1em" className={cx('fieldIcon')} aria-hidden="true" />
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
          <label htmlFor="login-password">{t('login.passwordLabel')}</label>
          <ButtonPrime
            variant="link"
            size="sm"
            onClick={() => { setShowForgot(true); setMessage(''); }}
          >
            {t('login.forgotPassword')}
          </ButtonPrime>
        </div>
        <div className={cx('control')}>
          <Lock size="1em" className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="login-password"
            type={showLoginPassword ? 'text' : 'password'}
            autoComplete="current-password"
            placeholder={t('login.passwordPlaceholder')}
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

      <ButtonPrime type="submit" variant="ink" size="lg" fullWidth className={cx('submitBtn')} disabled={loading}>
        {loading && <span className={cx('loadingSpinner')} />}
        <span>{loading ? t('login.signingIn') : t('common.signInNow')}</span>
        {!loading && <ArrowRight size="1em" aria-hidden="true" />}
      </ButtonPrime>
    </form>
  );

  const registerForm = (
    <form onSubmit={handleRegister} className={cx('form')}>
      <div className={cx('field')}>
        <label htmlFor="reg-fullname">{t('login.fullNameLabel')}</label>
        <div className={cx('control')}>
          <User size="1em" className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-fullname"
            type="text"
            autoComplete="name"
            placeholder={t('login.fullNamePlaceholder')}
            required
            value={regFullName}
            onChange={(e) => setRegFullName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('field')}>
        <label htmlFor="reg-email">{t('login.emailLabel')}</label>
        <div className={cx('control')}>
          <Mail size="1em" className={cx('fieldIcon')} aria-hidden="true" />
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
        <label htmlFor="reg-username">{t('login.usernameLabel')}</label>
        <div className={cx('control')}>
          <AtSign size="1em" className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-username"
            type="text"
            autoComplete="username"
            placeholder={t('login.usernamePlaceholder')}
            required
            value={regUserName}
            onChange={(e) => setRegUserName(e.target.value)}
            disabled={loading}
          />
        </div>
      </div>

      <div className={cx('field')}>
        <label htmlFor="reg-password">{t('login.passwordLabel')}</label>
        <div className={cx('control')}>
          <Lock size="1em" className={cx('fieldIcon')} aria-hidden="true" />
          <input
            id="reg-password"
            type={showRegPassword ? 'text' : 'password'}
            autoComplete="new-password"
            placeholder={t('login.newPasswordPlaceholder')}
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
        {t.rich('login.agreement', {
          terms: (chunks) => <Link href={routes.service}>{chunks}</Link>,
          privacy: (chunks) => <Link href={routes.policy}>{chunks}</Link>,
        })}
      </p>

      {messageBox}

      <ButtonPrime type="submit" variant="ink" size="lg" fullWidth className={cx('submitBtn')} disabled={loading}>
        {loading && <span className={cx('loadingSpinner')} />}
        <span>{loading ? tCommon('processing') : t('login.createAccount')}</span>
        {!loading && <ArrowRight size="1em" aria-hidden="true" />}
      </ButtonPrime>
    </form>
  );

  return (
    <div className={cx('authPage')}>
      <div className={cx('topBar')}>
        <Link href={routes.home} className={cx('backHome')}>
          <ArrowLeft size="1em" aria-hidden="true" />
          <span>{t('login.backHome')}</span>
        </Link>
        <div className={cx('topSwitch')}>
          <span className={cx('topSwitchText')}>
            {isSignUp ? t('login.hasAccount') : t('login.noAccount')}
          </span>
          <ButtonPrime variant="link" size="sm" onClick={() => switchMode(!isSignUp)}>
            {isSignUp ? t('login.signIn') : t('login.signUpNow')}
          </ButtonPrime>
        </div>
      </div>

      <main className={cx('main')}>
        <div className={cx('column')}>
          <div className={cx('brandHead')}>
            <BrandLink />
            <p>{t('login.tagline')}</p>
          </div>

          <div className={cx('card')}>
            {showForgot ? (
              <ForgotPassword embedded onBack={() => setShowForgot(false)} />
            ) : (
              <>
                <div className={cx('tabs')} role="tablist" aria-label={t('login.tabsLabel')}>
                  <ButtonPrime
                    variant={isSignUp ? 'ghost' : 'outline'}
                    size="sm"
                    role="tab"
                    aria-selected={!isSignUp}
                    onClick={() => switchMode(false)}
                  >
                    {t('login.signIn')}
                  </ButtonPrime>
                  <ButtonPrime
                    variant={isSignUp ? 'outline' : 'ghost'}
                    size="sm"
                    role="tab"
                    aria-selected={isSignUp}
                    onClick={() => switchMode(true)}
                  >
                    {t('login.signUp')}
                  </ButtonPrime>
                </div>

                {socialButtons}

                <div className={cx('orDivider')}>
                  <span>{t('login.orWithEmail')}</span>
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
        <nav className={cx('legal')} aria-label={t('common.legalNav')}>
          <Link href={routes.service}>{t('common.terms')}</Link>
          <span className={cx('legalDivider')} aria-hidden="true" />
          <Link href={routes.policy}>{t('common.privacy')}</Link>
        </nav>
        <p className={cx('copyright')}>© {SITE_NAME}. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Login;
