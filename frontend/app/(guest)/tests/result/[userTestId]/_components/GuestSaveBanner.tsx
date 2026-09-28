'use client';

import { useRouter } from 'next/navigation';
import classNames from 'classnames/bind';
import { BookmarkCheck } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { buildGuestSignupUrl } from '@/app/utils/authRedirect';
import styles from './CertificateBanner.module.scss';

const cx = classNames.bind(styles);

type GuestSaveBannerProps = {
  userTestId?: string;
};

function GuestSaveBanner({ userTestId }: GuestSaveBannerProps) {
  const router = useRouter();
  if (!userTestId) return null;

  return (
    <div className={cx('banner', 'pending')}>
      <BookmarkCheck size={28} className={cx('icon')} />
      <div className={cx('content')}>
        <h3 className={cx('title')}>Lưu kết quả này và nhận lộ trình học riêng</h3>
        <p className={cx('desc')}>
          Tạo tài khoản miễn phí, bài vừa làm sẽ được lưu lại để WinDe chẩn đoán điểm yếu
          và lập lộ trình ôn tập cho bạn.
        </p>
      </div>
      <ButtonPrime variant="primary" onClick={() => router.push(buildGuestSignupUrl(`/tests/result/${userTestId}`))}>
        Đăng ký miễn phí
      </ButtonPrime>
    </div>
  );
}

export default GuestSaveBanner;
