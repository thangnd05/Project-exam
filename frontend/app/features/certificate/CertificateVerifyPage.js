'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container, Spinner, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { BadgeCheck, Search, ShieldAlert, ShieldX, Clock } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from './components/CertificateCanvas';
import { useCertificateVerification } from './hooks/useCertificates';
import styles from './CertificateVerifyPage.module.scss';

const cx = classNames.bind(styles);

const STATE_VIEW = {
  VALID: {
    icon: BadgeCheck,
    tone: 'valid',
    heading: 'Chứng chỉ hợp lệ',
    message: 'Chứng chỉ này do hệ thống cấp và đang còn hiệu lực.',
  },
  REVOKED: {
    icon: ShieldX,
    tone: 'invalid',
    heading: 'Chứng chỉ đã bị thu hồi',
    message: 'Chứng chỉ từng được cấp nhưng đã bị thu hồi, không còn giá trị sử dụng.',
    watermark: 'REVOKED',
  },
  EXPIRED: {
    icon: Clock,
    tone: 'warning',
    heading: 'Chứng chỉ đã hết hạn',
    message: 'Chứng chỉ này đã quá thời hạn hiệu lực.',
    watermark: 'EXPIRED',
  },
  NOT_FOUND: {
    icon: ShieldAlert,
    tone: 'invalid',
    heading: 'Không tìm thấy chứng chỉ',
    message: 'Không có chứng chỉ nào mang mã này. Hãy kiểm tra lại mã tra cứu.',
  },
};

function CertificateVerifyPage() {
  const { code } = useParams();
  const router = useRouter();
  const [searchCode, setSearchCode] = useState(code || '');

  const { data: result, isLoading, isError } = useCertificateVerification(code);

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = searchCode.trim();
    if (trimmed) {
      router.push(`/certificates/verify/${encodeURIComponent(trimmed)}`);
    }
  };

  const state = isError ? 'NOT_FOUND' : result?.state;
  const view = STATE_VIEW[state] || STATE_VIEW.NOT_FOUND;
  const StateIcon = view.icon;
  // Tra được thì vẽ lại đúng tấm chứng chỉ như trang xem của chủ sở hữu, kể cả bản
  // đã thu hồi/hết hạn  người tra cứu cần đối chiếu với bản đang cầm trên tay.
  const showCertificate = Boolean(result) && state !== 'NOT_FOUND';

  return (
    <div className={cx('wrapper')}>
      <Container className={cx('container')}>
        <header className={cx('head')}>
          <h1>Tra cứu chứng chỉ</h1>
          <p>Nhập mã in trên chứng chỉ để kiểm tra tính xác thực.</p>
        </header>

        <Form className={cx('searchForm')} onSubmit={handleSearch}>
          <Form.Control
            value={searchCode}
            onChange={(event) => setSearchCode(event.target.value)}
            placeholder="VD: EXAM-2026-8F3K9Q"
            aria-label="Mã chứng chỉ"
          />
          <ButtonPrime type="submit" variant="primary" className={cx('searchButton')}>
            <Search size={16} /> Tra cứu
          </ButtonPrime>
        </Form>

        {!code && (
          <p className={cx('hint')}>
            Mã tra cứu nằm ở cạnh dưới tấm chứng chỉ, dạng <code>EXAM-2026-XXXXXX</code>.
          </p>
        )}

        {isLoading && code && (
          <div className={cx('state')}>
            <Spinner animation="border" />
            <p>Đang kiểm tra mã {code}...</p>
          </div>
        )}

        {!isLoading && code && (
          <>
            <div className={cx('status', view.tone)}>
              <StateIcon size={26} className={cx('statusIcon')} />
              <div className={cx('statusText')}>
                <h2 className={cx('statusHeading')}>{view.heading}</h2>
                <p className={cx('statusMessage')}>{view.message}</p>
              </div>
            </div>

            {showCertificate && (
              <div className={cx('canvasWrap')}>
                <CertificateCanvas
                  design={result.design}
                  recipientName={result.recipientName}
                  certificateCode={result.certificateCode}
                  issuedAt={result.issuedAt}
                  expiresAt={result.expiresAt}
                  watermark={view.watermark}
                />
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}

export default CertificateVerifyPage;
