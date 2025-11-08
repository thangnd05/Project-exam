import React, {useState, useEffect} from 'react';
import axios from 'axios';
import {Link, useNavigate, useLocation} from 'react-router-dom';
import {useAuth} from '../../../hook/useAuth';
import classNames from 'classnames/bind';
import style from './login.module.scss';

const cx = classNames.bind(style);

function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const {user, login} = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const from = location.state?.from?.pathname || '/';
      navigate(from, {replace: true});
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
        setMessage('Đăng nhập thành công, đang chuyển hướng...');
        setMessageType('success');
      } else {
        throw new Error('Dữ liệu người dùng không hợp lệ.');
      }
    } catch (err) {
      const errorMessage =
        err.response?.data?.message || err.message || 'Đã có lỗi xảy ra ❌';
      setMessage(errorMessage);
      setMessageType('error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={cx('bodic')}>
      <form className={cx('wrap')} onSubmit={handleLogin}>
        <h1>Đăng nhập</h1>

        {/* Username / Email */}
        <div className={cx('input-box')}>
          <input
            type="text"
            className={cx('wrap-username')}
            id="identifier"
            placeholder="Tên đăng nhập hoặc Email"
            required
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            disabled={loading}
            onInvalid={(e) =>
              e.target.setCustomValidity(
                'Vui lòng nhập tên đăng nhập hoặc email!',
              )
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </div>

        {/* Password */}
        <div className={cx('input-box')}>
          <input
            type="password"
            className={cx('wrap-password')}
            id="password"
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
            onInvalid={(e) =>
              e.target.setCustomValidity('Vui lòng nhập mật khẩu!')
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </div>

        {/* Thông báo */}
        <div className={cx('login-message', messageType)}>
          {message && (
            <p style={{color: messageType === 'error' ? 'red' : 'green'}}>
              {message}
            </p>
          )}
        </div>

        {/* Nút đăng nhập */}
        <button type="submit" className={cx('login-btn')} disabled={loading}>
          {loading ? 'Đang xử lý...' : 'Đăng nhập'}
        </button>

        {/* Link đăng ký */}
        <div className={cx('register-link')}>
          <span>Chưa có tài khoản? </span>
          <Link to="/register">Đăng ký ngay</Link>
        </div>
      </form>
    </div>
  );
}

export default LoginPage;
