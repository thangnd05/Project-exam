'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {useState} from 'react';
import classNames from 'classnames/bind';
import style from '../login/login.module.scss';
import routes from '@/app/configs/Routes';
import {Form, Button} from 'react-bootstrap';
import { useForgotPasswordMutation } from '@/app/hooks/useAuthActions';

const cx = classNames.bind(style);

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const router = useRouter();
  const forgotPasswordMutation = useForgotPasswordMutation();

  const handleReset = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage('');
    setError('');

    try {
      await forgotPasswordMutation.mutateAsync(email);

      setMessage('Hãy vào email để lấy token để có thể đổi mật khẩu.');
      setError('Token chỉ có thời lượng là 5 phút');

      setTimeout(() => {
        router.push(routes.reset);
      }, 6000);
    } catch (error: any) {
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
            onInvalid={(e: React.FormEvent<HTMLInputElement>) => {
              (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập email!');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
          />
        </Form.Group>

        <div className={cx('remember-forgot')}>
          <label>
            <input type="checkbox" />
            <span>Ghi nhớ</span>
          </label>
          <Link href={routes.login}>Đăng Nhập</Link>
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
          <Link href={`${routes.login}?mode=signup`}>Đăng ký</Link>
        </div>
      </Form>
    </div>
  );
}

export default ForgotPassword;
