import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hook/useAuth';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import images from '~/assets/images';

const cx = classNames.bind(style);

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const { user, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // URL đăng nhập Google từ Backend
  const GOOGLE_AUTH_URL = "http://localhost:8080/oauth2/authorization/google";

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [user, navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const response = await axios.post('/api/auth/login', {
        identifier,
        password,
      });

      const userData = response.data.user;
      if (userData) {
        login(userData);
        setMessage('✅ Đăng nhập thành công! Đang chuyển hướng...');
        setMessageType('success');
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Dữ liệu người dùng không hợp lệ.');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || '❌ Đã có lỗi xảy ra!';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('splitContainer')}>
      {/* CỘT TRÁI - THÔNG TIN */}
      <div className={cx('infoPanel')}>
        <img src={images.logo} alt="WinDe Logo" className={cx('infoLogo')} />
        <h2>Chào mừng trở lại!</h2>
        <p>Nền tảng chia sẻ kiến thức của mọi người.</p>
      </div>

      {/* CỘT PHẢI - FORM */}
      <div className={cx('formPanel')}>
        <form className={cx('wrap')} onSubmit={handleLogin}>
          <h1>Đăng nhập</h1>

          {/* Username / Email */}
          <div className={cx('input-box')}>
            <input
              type="text"
              className={cx('wrap-username')}
              placeholder="Tên đăng nhập hoặc Email"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              disabled={loading}
            />
            <i className="fa-solid fa-user"></i>
          </div>

          {/* Password */}
          <div className={cx('input-box')}>
            <input
              type="password"
              className={cx('wrap-password')}
              placeholder="Mật khẩu"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
            />
            <i className="fa-solid fa-lock"></i>
          </div>

          {/* Ghi nhớ / Quên mật khẩu */}
          <div className={cx('remember-forgot')}>
            <label>
              <input type="checkbox" /> Ghi nhớ
            </label>
            <Link to="/forgot-password">Quên mật khẩu?</Link>
          </div>

          {/* Thông báo lỗi/thành công */}
          {message && (
            <div className={cx('login-message', messageType)}>
              <p>{message}</p>
            </div>
          )}

          {/* Nút đăng nhập hệ thống */}
          <button type="submit" className={cx('login-btn')} disabled={loading}>
            {loading ? <div className={cx('loading-spinner')}></div> : 'Đăng nhập'}
          </button>

          {/* NÚT ĐĂNG NHẬP GOOGLE */}
          <div className={cx('social-login')}>
            <div className={cx('separator')}>
              <span>Hoặc đăng nhập với</span>
            </div>
            <a href={GOOGLE_AUTH_URL} className={cx('google-btn')}>
              <img
                src="https://www.vectorlogo.zone/logos/google/google-icon.svg"
                alt="Google"
              />
              Tiếp tục với Google
            </a>
          </div>

          {/* Link đăng ký */}
          <div className={cx('register-link')}>
            <span>Chưa có tài khoản? </span>
            <Link to="/register">Đăng ký ngay</Link>
          </div>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;