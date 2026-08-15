'use client';

import { useRouter } from 'next/navigation';
import classNames from 'classnames/bind';
import { Award, Target } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useAttemptCertificate } from '@/app/hooks/useCertificates';
import { AttemptCertificateState } from '@/app/enums';
import styles from './CertificateBanner.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value?: string | null) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '';

type CertificateBannerProps = {
  userTestId?: string;
  enabled: boolean;
};

/**
 * Băng chứng chỉ ở trang kết quả. Ba trạng thái tương ứng ba thông điệp khác nhau:
 * vừa nhận được, đã có sẵn từ lần thi trước, và chưa đủ điểm (nói rõ còn thiếu bao nhiêu).
 * Đề không thuộc nhóm cấp chứng chỉ thì không hiện gì.
 */
function CertificateBanner({ userTestId, enabled }: CertificateBannerProps) {
  const router = useRouter();
  // Khách làm bài không bao giờ được cấp chứng chỉ nên chỉ hỏi khi đã biết chắc là người đã đăng nhập.
  const { data } = useAttemptCertificate(userTestId, enabled);

  if (!data || data.state === AttemptCertificateState.NOT_APPLICABLE) {
    return null;
  }

  if (data.state === AttemptCertificateState.NOT_PASSED) {
    return (
      <div className={cx('banner', 'pending')}>
        <Target size={28} className={cx('icon')} />
        <div className={cx('content')}>
          <h3 className={cx('title')}>Chưa đạt chứng chỉ lần này</h3>
          <p className={cx('desc')}>
            Bạn còn thiếu <strong>{data.pointsToPass} điểm</strong> nữa để nhận chứng chỉ
            (cần {data.passScore} điểm, bạn đạt {data.score} điểm).
          </p>
        </div>
        <ButtonPrime variant="outline" onClick={() => router.push('/learning-plans/generate')}>
          Lập lộ trình ôn tập
        </ButtonPrime>
      </div>
    );
  }

  const certificate = data.certificate;
  const justIssued = data.state === AttemptCertificateState.JUST_ISSUED;

  return (
    <div className={cx('banner', 'achieved')}>
      <Award size={28} className={cx('icon')} />
      <div className={cx('content')}>
        <h3 className={cx('title')}>
          {justIssued
            ? 'Chúc mừng! Bạn vừa nhận được chứng chỉ'
            : 'Bạn đã có chứng chỉ cho loại đề này'}
        </h3>
        <p className={cx('desc')}>
          {certificate?.design?.title || 'Chứng chỉ'}
          {!justIssued && certificate?.issuedAt && ` · cấp ngày ${formatDate(certificate.issuedAt)}`}
          {!justIssued && ' · thi lại không cấp thêm chứng chỉ mới'}
        </p>
      </div>
      <ButtonPrime
        variant="primary"
        onClick={() => router.push(`/certificates/${certificate?.certificateId}`)}
      >
        Xem chứng chỉ
      </ButtonPrime>
    </div>
  );
}

export default CertificateBanner;
