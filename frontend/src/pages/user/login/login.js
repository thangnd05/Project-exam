import React, { useState, useEffect } from 'react';
import axios from '../../../api/axiosClient';
import { login as loginRequest, register as registerRequest } from '../../../api/authApi';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../../../hooks/useAuth';
import {
  getRedirectTarget,
  saveOAuthRedirect,
  claimGuestAfterLogin,
} from '~/utils/authRedirect';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";
import { name } from '~/assets/images';


const cx = classNames.bind(style);

function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Register States
  const [regFullName, setRegFullName] = useState('');
  const [regUserName, setRegUserName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const backendBaseUrl = (axios.defaults.baseURL || process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');
  const GOOGLE_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/google`;
  const FACEBOOK_AUTH_URL = `${backendBaseUrl}/oauth2/authorization/facebook`;

  useEffect(() => {
    // 1. Xử lý logic chuyển Tab (Login/Register) như đã nói ở câu trước
    if (location.state?.mode) {
      setIsSignUp(location.state.mode === 'signup');
    }

    // 2. Xử lý hiển thị thông báo từ ProtectedRoute
    if (location.state?.flashMessage) {
      setMessage(location.state.flashMessage);
      setMessageType('error'); // hoặc 'warning' tùy CSS của bạn

      // Tùy chọn: Xóa state để thông báo không hiện lại khi F5
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  // Redirect khi đã đăng nhập (kể cả vừa login xong ở handleLogin/OAuth):
  // quay lại đúng trang trước đó, giữ nguyên query string.
  useEffect(() => {
    if (user) {
      navigate(getRedirectTarget(location), { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      //  Backend trả thẳng UserResponse
      const userData = await loginRequest({
        identifier: loginIdentifier,
        password: loginPassword,
      });

      if (userData?.id) {
        // Gắn bài làm dạng khách (nếu có) vào tài khoản TRƯỚC khi set user,
        // vì set user sẽ kích hoạt useEffect điều hướng rời trang login.
        await claimGuestAfterLogin();

        login(userData); //  truyền thẳng vào AuthContext -> useEffect lo redirect về `from`

        setMessage("Đăng nhập thành công! Đang chuyển hướng...");
        setMessageType("success");
      } else {
        throw new Error("User data invalid");
      }
    } catch (err) {
      setMessage(
        err.response?.data?.message ||
        "Đăng nhập thất bại. Vui lòng thử lại!"
      );
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!agreeTerms) {
      setMessage('Bạn phải đồng ý với điều khoản & điều kiện.');
      setMessageType('error');
      return;
    }
    setLoading(true);
    setMessage('');

    try {
      const data = await registerRequest({
        userName: regUserName,
        fullName: regFullName,
        email: regEmail,
        password: regPassword,
      });

      setMessage(data.message || 'Đăng ký thành công! Vui lòng xác thực email.');
      setMessageType('success');
      alert('📧 Vui lòng vào email vừa đăng ký để xác thực tài khoản!');
      setIsSignUp(false); // Switch back to login after success
    } catch (err) {
      const errorMessage =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'Tên đăng nhập hoặc Email đã tồn tại.'
          : 'Đăng ký thất bại. Vui lòng thử lại sau.');
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('splitContainer')}>
      <div className={cx('mainCard', { 'signUpMode': isSignUp })}>

        {/* FORM REGISTRATION (Bên Phải ban đầu, trượt vào) */}
        <div className={cx('formContainer', 'signUpContainer')}>
          <form onSubmit={handleRegister}>
            <h1>Tạo tài khoản</h1>
            <div className={cx('social-login')}>
              <div className={cx('social-btns')}>
                <a href={GOOGLE_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(location))}><FcGoogle size={24} /></a>
                <a href={FACEBOOK_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(location))}><FaFacebook size={24} color="#1877F2" /></a>
              </div>
            </div>
            <p className={cx('subtitle')}>Sử dụng thông tin của bạn để đăng ký</p>

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
              <label>
                <input type="checkbox" checked={agreeTerms} onChange={(e) => setAgreeTerms(e.target.checked)} />
                <span>Tôi đồng ý với điều khoản & điều kiện</span>
              </label>
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

        {/* FORM LOGIN (Bên Trái ban đầu) */}
        <div className={cx('formContainer', 'signInContainer')}>
          <form onSubmit={handleLogin}>
            <h1>Đăng nhập</h1>
            <div className={cx('social-login')}>
              <div className={cx('social-btns')}>
                <a href={GOOGLE_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(location))}><FcGoogle size={24} /></a>
                <a href={FACEBOOK_AUTH_URL} className={cx('social-btn')} onClick={() => saveOAuthRedirect(getRedirectTarget(location))}><FaFacebook size={24} color="#1877F2" /></a>
              </div>
            </div>
            <p className={cx('subtitle')}>Sử dụng tài khoản của bạn</p>

            <div className={cx('input-box')}>
              <input type="text" placeholder="Email hoặc Tên đăng nhập" required value={loginIdentifier} onChange={(e) => setLoginIdentifier(e.target.value)} disabled={loading} />
            </div>
            <div className={cx('input-box')}>
              <input type="password" placeholder="Mật khẩu" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} disabled={loading} />
            </div>

            <Link to="/forgot-password" className={cx('forgot-link')}>Bạn quên mật khẩu?</Link>
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

        {/* OVERLAY SECTION (Trượt qua lại) */}
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

export default LoginPage;