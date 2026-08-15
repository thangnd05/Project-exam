'use client';

import { useParams, useRouter } from 'next/navigation';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { ArrowLeft, Copy, Printer } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from './components/CertificateCanvas';
import { useCertificateDetail } from './hooks/useCertificates';
import styles from './CertificateDetailPage.module.scss';

const cx = classNames.bind(styles);

function CertificateDetailPage() {
  const { certificateId } = useParams();
  const router = useRouter();
  const { data: certificate, isLoading, isError } = useCertificateDetail(certificateId);

  const verifyUrl = certificate
    ? `${window.location.origin}/certificates/verify/${certificate.certificateCode}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success('Đã sao chép link tra cứu chứng chỉ!');
    } catch {
      toast.error('Trình duyệt không cho sao chép. Bạn hãy copy thủ công link phía dưới.');
    }
  };

  if (isLoading) {
    return (
      <div className={cx('state')}>
        <Spinner animation="border" />
        <p>Đang tải chứng chỉ...</p>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <Container className={cx('state')}>
        <Alert variant="danger">Không tìm thấy chứng chỉ này hoặc bạn không có quyền xem.</Alert>
        <ButtonPrime variant="primary" onClick={() => router.push('/my-certificates')}>
          Về danh sách chứng chỉ
        </ButtonPrime>
      </Container>
    );
  }

  const revoked = certificate.status === 'REVOKED';
  const expired = certificate.expired;

  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('topBar')}>
          <ButtonPrime variant="ghost" size="sm" onClick={() => router.push('/my-certificates')}>
            <ArrowLeft size={16} /> Chứng chỉ của tôi
          </ButtonPrime>

          <div className={cx('actions')}>
            <ButtonPrime variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy size={16} /> Copy link tra cứu
            </ButtonPrime>
            <ButtonPrime variant="primary" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> In / Lưu PDF
            </ButtonPrime>
          </div>
        </div>

        {revoked && (
          <Alert variant="danger">
            Chứng chỉ này đã bị thu hồi
            {certificate.revokedReason ? `: ${certificate.revokedReason}` : '.'}
          </Alert>
        )}
        {!revoked && expired && (
          <Alert variant="warning">
            Chứng chỉ đã hết hiệu lực. Bạn có thể thi lại bài thi thử để được cấp chứng chỉ mới.
          </Alert>
        )}

        <div className={cx('printArea')}>
          <CertificateCanvas
            design={certificate.design}
            recipientName={certificate.recipientName}
            certificateCode={certificate.certificateCode}
            issuedAt={certificate.issuedAt}
            expiresAt={certificate.expiresAt}
            watermark={revoked ? 'REVOKED' : expired ? 'EXPIRED' : undefined}
          />
        </div>
      </Container>
    </div>
  );
}

export default CertificateDetailPage;
