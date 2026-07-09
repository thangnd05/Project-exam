import {useState} from 'react';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import routes from '~/shared/config/Routes';
import {Form, Button} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';
import { resetPassword } from '~/shared/api/authApi';

const cx = classNames.bind(style);

function ResetPassWord() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await resetPassword(token, newPassword);

      setMessage('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        navigate(routes.login);
      }, 2000);
    } catch (err) {

      if (err.response && err.response.status === 400) {
        setError('Token không hợp lệ hoặc đã hết hạn!');
      }
    }
  };

  return (
    <div className={cx('bodic')}>
      <Form
        className={cx('wrap')}
        id="login-form"
        onSubmit={handleResetPassword}
      >
        <h1>Đặt lại mật khẩu</h1>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="text"
            className={cx('wrap-username')}
            placeholder="Token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onInvalid={(e) => {
              e.target.setCustomValidity('Vui lòng nhập token!');
            }}
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="password"
            className={cx('wrap-password')}
            placeholder="Mật khẩu mới"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onInvalid={(e) => {
              e.target.setCustomValidity('Vui lòng nhập mật khẩu mới!');
            }}
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="password"
            className={cx('wrap-password')}
            placeholder="Xác nhận mật khẩu mới"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onInvalid={(e) => {
              e.target.setCustomValidity('Xác nhận mật khẩu mới!');
            }}
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        {message && (
          <div className={cx('alert', 'alert-success')}>{message}</div>
        )}
        {error && <div className={cx('alert', 'alert-danger')}>{error}</div>}

        <div className={cx('login-link')}>
          <Button className={cx('login-btn')} type="submit">
            Đặt lại mật khẩu
          </Button>
        </div>

        <div className={cx('register-link')}>
          <span>Nhớ lại mật khẩu? </span>
          <Link to={routes.forgot}>Quên</Link>
        </div>
      </Form>
    </div>
  );
}

export default ResetPassWord;
