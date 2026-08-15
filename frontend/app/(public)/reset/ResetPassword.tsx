'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {useState} from 'react';
import classNames from 'classnames/bind';
import style from '../login/login.module.scss';
import routes from '@/app/configs/Routes';
import {Form, Button} from 'react-bootstrap';
import { useResetPasswordMutation } from '@/app/hooks/useAuthActions';

const cx = classNames.bind(style);

function ResetPassWord() {
  // useSearchParams của Next trả thẳng ReadonlyURLSearchParams (bản react-router cũ trả tuple
  // nên destructure [searchParams] — leftover đó khiến .get() không chạy, đã sửa khi chuyển TS).
  const searchParams = useSearchParams();
  // Link trong email đặt lại mật khẩu trỏ tới /reset?token=... nên điền sẵn giúp người dùng;
  // ô nhập vẫn giữ để ai copy token thủ công vẫn dùng được.
  const [token, setToken] = useState(() => searchParams.get('token') || '');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();
  const resetPasswordMutation = useResetPasswordMutation();

  const handleResetPassword = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu mới và mật khẩu xác nhận không khớp!');
      return;
    }

    try {
      await resetPasswordMutation.mutateAsync({ token, newPassword });

      setMessage('Đặt lại mật khẩu thành công!');
      setTimeout(() => {
        router.push(routes.login);
      }, 2000);
    } catch (err: any) {
      // any có chủ đích: lỗi axios (err.response) chưa có type dùng chung trong dự án
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
            onInvalid={(e: React.FormEvent<HTMLInputElement>) => {
              (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập token!');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
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
            onInvalid={(e: React.FormEvent<HTMLInputElement>) => {
              (e.target as HTMLInputElement).setCustomValidity('Vui lòng nhập mật khẩu mới!');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
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
            onInvalid={(e: React.FormEvent<HTMLInputElement>) => {
              (e.target as HTMLInputElement).setCustomValidity('Xác nhận mật khẩu mới!');
            }}
            onInput={(e) => (e.target as HTMLInputElement).setCustomValidity('')}
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
          <Link href={routes.forgot}>Quên</Link>
        </div>
      </Form>
    </div>
  );
}

export default ResetPassWord;
