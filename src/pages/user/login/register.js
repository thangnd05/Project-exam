import React, { useState } from 'react';
import axios from 'axios';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import routes from '~/config/Routes';
import { FaFacebook } from "react-icons/fa";
import { FcGoogle } from "react-icons/fc";

const cx = classNames.bind(style);

function Register() {
  const [fullname, setFullName] = useState('');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const GOOGLE_AUTH_URL = "http://localhost:8080/oauth2/authorization/google";
  const FACEBOOK_AUTH_URL = "http://localhost:8080/oauth2/authorization/facebook";

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
      const response = await axios.post('/api/auth/register', {
        userName: username,
        fullName: fullname,
        email,
        password,
      });

      setLoading(false);
      setMessage(
        response.data.message || 'Đăng ký thành công. Vui lòng đăng nhập.',
      );
      setMessageType('success');

      alert('📧 Vui lòng vào email vừa đăng ký để xác thực tài khoản!');
      // Tùy chọn: Tự động chuyển hướng sau khi thành công
      // setTimeout(() => navigate(routes.login), 2000);
    } catch (err) {
      setLoading(false);
      const errorMessage =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'Tên đăng nhập hoặc Email đã tồn tại.'
          : 'Có lỗi xảy ra. Vui lòng thử lại sau.');

      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  return (
    <div className={cx('splitContainer')}>
      <div className={cx('mainCard')}>

        {/* PHẦN CHÀO MỪNG (BÊN TRÁI) */}
        <div className={cx('infoSide')}>
          <h2>Chào bạn!</h2>
          <p>
            Bạn đã có tài khoản? Hãy nhấn Đăng nhập để tiếp tục hành trình của mình.
          </p>
          <Link to={routes.login} className={cx('ghost-btn')}>Đăng nhập ngay</Link>
        </div>

        {/* PHẦN FORM ĐĂNG KÝ (BÊN PHẢI) */}
        <div className={cx('formSide')}>
          <form onSubmit={handleRegister} style={{ width: '100%' }}>
            <h1>Tạo tài khoản</h1>

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

            <p className={cx('subtitle')}>Sử dụng thông tin cá nhân của bạn</p>

            <div className={cx('input-box')}>
              <input
                type="text"
                placeholder="Họ và tên"
                required
                value={fullname}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>

            <div className={cx('input-box')}>
              <input
                type="email"
                placeholder="Email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className={cx('input-box')}>
              <input
                type="text"
                placeholder="Tên đăng nhập"
                required
                maxLength={15}
                value={username}
                onChange={(e) => setUserName(e.target.value)}
              />
            </div>

            <div className={cx('input-box')}>
              <input
                type="password"
                placeholder="Mật khẩu"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <div style={{ textAlign: 'left', marginBottom: '20px', fontSize: '1.3rem' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="checkbox"
                  checked={agreeTerms}
                  onChange={(e) => setAgreeTerms(e.target.checked)}
                />
                <span style={{ color: 'var(--text-secondary)' }}>Tôi đồng ý với điều khoản & điều kiện</span>
              </label>
            </div>

            {message && (
              <div className={cx('login-message', messageType)}>
                <p>{message}</p>
              </div>
            )}

            <div>
              <button type="submit" className={cx('login-btn')} style={{ width: '200px' }} disabled={loading}>
                {loading ? <div className={cx('loading-spinner')}></div> : 'Đăng ký ngay'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}

export default Register;
