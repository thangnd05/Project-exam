import classNames from 'classnames/bind';
import style from './login.module.scss';
import {Link, useNavigate} from 'react-router-dom';
import axios from 'axios';
import {Form, Button} from 'react-bootstrap';
import {useState} from 'react';
import routes from '~/config/Routes';

const cx = classNames.bind(style);

function Register() {
  const [fullname, setFullName] = useState('');
  const [username, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!rememberMe) {
      setMessage('Bạn phải đồng ý với điều khoản & điều kiện.');
      setMessageType('error');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      // 🔧 Gửi đúng endpoint và đúng key trùng với RegisterRequest
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
    } catch (err) {
      setLoading(false);

      const errorMessage =
        err.response?.data?.message ||
        (err.response?.status === 500
          ? 'Username hoặc Email đã tồn tại.'
          : 'Có lỗi xảy ra. Vui lòng thử lại sau.');

      setMessage(errorMessage);
      setMessageType('error');
    }
  };

  return (
    <div className={cx('bodic')}>
      <Form className={cx('wrap')} id="login-form" onSubmit={handleRegister}>
        <h1>Đăng ký</h1>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="text"
            className={cx('wrap-fullname')}
            id="fullname"
            placeholder="Họ và tên"
            required
            value={fullname}
            onChange={(e) => setFullName(e.target.value)}
            onInvalid={(e) =>
              e.target.setCustomValidity('Vui lòng nhập Họ và tên!')
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="email"
            className={cx('wrap-email')}
            id="email"
            placeholder="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onInvalid={(e) =>
              e.target.setCustomValidity('Vui lòng nhập đúng định dạng email!')
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="text"
            className={cx('wrap-username')}
            id="username"
            placeholder="Tên đăng nhập"
            required
            value={username}
            maxLength={10}
            onChange={(e) => setUserName(e.target.value)}
            onInvalid={(e) =>
              e.target.setCustomValidity('Vui lòng nhập tên đăng nhập!')
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <Form.Group className={cx('input-box')}>
          <Form.Control
            type="password"
            className={cx('wrap-password')}
            id="password"
            placeholder="Mật khẩu"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onInvalid={(e) =>
              e.target.setCustomValidity('Vui lòng nhập mật khẩu!')
            }
            onInput={(e) => e.target.setCustomValidity('')}
          />
        </Form.Group>

        <div className={cx('remember-forgot')}>
          <label>
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
            />
            <span> Đồng ý với điều khoản & điều kiện</span>
          </label>
        </div>

        <div className={cx('register-message', messageType)}>
          {message && (
            <p style={{color: messageType === 'error' ? 'red' : 'green'}}>
              {message}
            </p>
          )}
        </div>

        <div className={cx('login-link')}>
          <Button className={cx('login-btn')} type="submit" disabled={loading}>
            {loading ? 'Đang xử lý...' : 'Đăng ký'}
          </Button>
        </div>

        <div className={cx('register-link')}>
          <span>Đã có tài khoản? </span>
          <Link to={routes.login}>Đăng nhập</Link>
        </div>
      </Form>
    </div>
  );
}

export default Register;
