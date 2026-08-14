// [TẮT XÁC THỰC EMAIL] Trang xác thực qua link trong mail  đã bỏ khỏi router, giữ lại phòng khi cần bật lại.
/*
import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Spinner } from 'react-bootstrap';
import { IoCheckmarkCircleOutline, IoCloseCircleOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import { useVerifyEmailMutation } from '~/features/user/login/hooks/useAuthActions';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import styles from './VerifyEmailPage.module.scss';

const cx = classNames.bind(styles);

const TITLES = {
  loading: 'Đang xác thực tài khoản...',
  success: 'Xác thực thành công!',
  error: 'Xác thực thất bại',
};

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const token = params.get('token');

  const [status, setStatus] = useState('loading');
  const [msg, setMsg] = useState('Vui lòng chờ trong giây lát...');
  const verifyEmailMutation = useVerifyEmailMutation();

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMsg('Thiếu token xác thực!');
      return;
    }

    verifyEmailMutation.mutate(token, {
      onSuccess: (data) => {
        setStatus('success');
        setMsg(data.message || 'Tài khoản của bạn đã được xác thực. Đang chuyển đến trang đăng nhập...');

        setTimeout(() => {
          navigate('/login');
        }, 2000);
      },
      onError: (err) => {
        setStatus('error');
        setMsg(err.response?.data?.message || 'Liên kết xác thực không hợp lệ hoặc đã hết hạn.');

        setTimeout(() => {
          navigate('/register');
        }, 2500);
      },
    });
  }, [token, navigate]);

  return (
    <div className={cx('wrapper')}>
      <div className={cx('card')}>
        <div className={cx('iconWrap', status)}>
          {status === 'loading' && <Spinner animation="border" />}
          {status === 'success' && <IoCheckmarkCircleOutline />}
          {status === 'error' && <IoCloseCircleOutline />}
        </div>

        <h1 className={cx('title')}>{TITLES[status]}</h1>
        <p className={cx('message')}>{msg}</p>

        {status !== 'loading' && (
          <div className={cx('actions')}>
            {status === 'success' ? (
              <ButtonPrime variant="primary" onClick={() => navigate('/login')}>
                Đến trang đăng nhập
              </ButtonPrime>
            ) : (
              <>
                <ButtonPrime variant="outline" onClick={() => navigate('/login')}>
                  Đăng nhập
                </ButtonPrime>
                <ButtonPrime variant="primary" onClick={() => navigate('/register')}>
                  Đăng ký lại
                </ButtonPrime>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
*/
