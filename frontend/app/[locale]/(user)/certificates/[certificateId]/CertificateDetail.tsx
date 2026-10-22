'use client';

import { useParams } from 'next/navigation';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { ArrowLeft, Copy, Printer } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useCertificateDetail } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateStatus } from '@/app/enums';
import styles from './CertificateDetail.module.scss';

const cx = classNames.bind(styles);

function CertificateDetail() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const t = useTranslations('Account');
  const router = useRouter();
  const localizeHref = useLocalizeHref();
  const { data: certificate, isLoading, isError } = useCertificateDetail(certificateId);

  const verifyUrl = certificate
    ? `${window.location.origin}${localizeHref(`/certificates/verify/${certificate.certificateCode}`)}`
    : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(verifyUrl);
      toast.success(t('certificateDetail.copied'));
    } catch {
      toast.error(t('certificateDetail.copyFailed'));
    }
  };

  if (isLoading) {
    return (
      <div className={cx('state')}>
        <Spinner animation="border" />
        <p>{t('certificates.loading')}</p>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <Container className={cx('state')}>
        <Alert variant="danger">{t('certificateDetail.notFound')}</Alert>
        <ButtonPrime variant="primary" onClick={() => router.push('/my-certificates')}>
          {t('certificateDetail.backToList')}
        </ButtonPrime>
      </Container>
    );
  }

  const revoked = certificate.status === CertificateStatus.REVOKED;
  const expired = certificate.expired;

  return (
    <div className={cx('wrapper')}>
      <Container>
        <div className={cx('topBar')}>
          <ButtonPrime variant="ghost" size="sm" onClick={() => router.push('/my-certificates')}>
            <ArrowLeft size={16} /> {t('certificates.myCertificates')}
          </ButtonPrime>

          <div className={cx('actions')}>
            <ButtonPrime variant="outline" size="sm" onClick={handleCopyLink}>
              <Copy size={16} /> {t('certificateDetail.copyLink')}
            </ButtonPrime>
            <ButtonPrime variant="primary" size="sm" onClick={() => window.print()}>
              <Printer size={16} /> {t('certificateDetail.print')}
            </ButtonPrime>
          </div>
        </div>

        {revoked && (
          <Alert variant="danger">
            {certificate.revokedReason
              ? t('certificateDetail.revokedWithReason', { reason: certificate.revokedReason })
              : t('certificateDetail.revoked')}
          </Alert>
        )}
        {!revoked && expired && (
          <Alert variant="warning">
            {t('certificateDetail.expired')}
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

export default CertificateDetail;
