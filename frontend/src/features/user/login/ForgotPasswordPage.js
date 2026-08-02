import {useState} from 'react';
import classNames from 'classnames/bind';
import style from './login.module.scss';
import routes from '~/shared/config/Routes';
import {Form, Button} from 'react-bootstrap';
import {Link, useNavigate} from 'react-router-dom';
import { useForgotPasswordMutation } from '~/features/user/login/hooks/useAuthActions';

const cx = classNames.bind(style);

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();
  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleReset = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await forgotPasswordMutation.mutateAsync(email);

      setMessage('Hãy vào email để lấy token để có thể đổi mật khẩu.');
      setError('Token chỉ có thời lượng là 5 phút');

      setTimeout(() => {
        navigate(routes.reset);
      }, 6000);
    } catch (error) {

      if (error.response) {
        setError(error.response.data.message || 'Đã xảy ra lỗi!');
      } else {
        setError('Không thể kết nối đến server!');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={cx('bodic')}>
      <Form className={cx('wrap')} id="login-form" onSubmit={handleReset}>
        <h1>Quên mật khẩu</h1>
        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="text"
            className={cx('wrap-username')}
            id="username"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInvalid={(e) => {
              e.target.setCustomValidity('Vui lòng nhập email!');
            }}
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <div className={cx('remember-forgot')}>
          <label>
            <input type="checkbox" />
            <span>Ghi nhớ</span>
          </label>
          <Link to={routes.login}>Đăng Nhập</Link>
        </div>

        {message && (
          <div className={cx('alert', 'alert-success')}>{message}</div>
        )}
        {error && <div className={cx('alert', 'alert-danger')}>{error}</div>}

        <div className={cx('login-link')}>
          <Button
            className={cx('login-btn')}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? 'Đang thực hiện...' : 'Gửi yêu cầu'}
          </Button>
        </div>

        <div className={cx('register-link')}>
          <span>Chưa có tài khoản? </span>
          <Link to={routes.register}>Đăng ký</Link>
        </div>
      </Form>
    </div>
  );
}

export default ForgotPassword;
