import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../../hook/useAuth';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import images from '~/assets/images';
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

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

  const GOOGLE_AUTH_URL = "http://localhost:8080/oauth2/authorization/google";
  const FACEBOOK_AUTH_URL = "http://localhost:8080/oauth2/authorization/facebook";

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
        setMessage(' Đăng nhập thành công! Đang chuyển hướng...');
        setMessageType('success');
        setTimeout(() => navigate('/'), 1000);
      } else {
        throw new Error('Dữ liệu không hợp lệ.');
      }
    } catch (err) {
      const errorMessage = err.response?.data?.message || ' Đăng nhập thất bại. Vui lòng thử lại!';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('splitContainer')}>
      <div className={cx('mainCard')}>
        {/* PHẦN FORM ĐĂNG NHẬP */}
        <div className={cx('formSide')}>
          <form onSubmit={handleLogin} style={{ width: '100%' }}>
            <h1>Đăng nhập</h1>

            <div className={cx('social-login')}>
              <div className={cx('social-btns')}>
                <a href={GOOGLE_AUTH_URL} className={cx('social-btn')}>
                  <FcGoogle size={24} />
                </a>
                <a href={FACEBOOK_AUTH_URL} className={cx('social-btn')}>
                  <FaFacebook size={24} color="#1877F2" />
                </a>
              </div>
            </div>

            <p className={cx('subtitle')}>Sử dụng tài khoản hệ thống của bạn</p>

            <div className={cx('input-box')}>
              <input
                type="text"
                placeholder="Email hoặc Tên đăng nhập"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className={cx('input-box')}>
              <input
                type="password"
                placeholder="Mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>

            <Link to="/forgot-password" className={cx('forgot-link')}>Bạn quên mật khẩu?</Link>

            {message && (
              <div className={cx('login-message', messageType)}>
                <p>{message}</p>
              </div>
            )}

            <div>
              <button type="submit" className={cx('login-btn')} disabled={loading}>
                {loading ? <div className={cx('loading-spinner')}></div> : 'Đăng nhập ngay'}
              </button>
            </div>
          </form>
        </div>

        {/* PHẦN CHÀO MỪNG / ĐĂNG KÝ */}
        <div className={cx('infoSide')}>
          <h2>Chào bạn!</h2>
          <p>
            Bắt đầu hành trình chinh phục tiếng Anh cùng cộng đồng học thuật chuyên nghiệp của chúng tôi.
          </p>
          <Link to="/register" className={cx('ghost-btn')}>Đăng ký ngay</Link>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;