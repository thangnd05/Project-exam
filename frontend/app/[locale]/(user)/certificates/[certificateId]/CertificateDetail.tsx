'use client';

import { useParams } from 'next/navigation';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useLocale, useTranslations } from 'next-intl';
import { Container, Spinner, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { ArrowLeft } from 'lucide-react';

import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useCertificateDetail } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateStatus } from '@/app/enums';
import styles from './CertificateDetail.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value: string | undefined, locale: string) =>
  value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN') : '--';

function CertificateDetail() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const t = useTranslations('Account');
  const locale = useLocale();
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
        <Spinner animation="grow" variant="primary" />
        <p>{t('certificates.loading')}</p>
      </div>
    );
  }

  if (isError || !certificate) {
    return (
      <div className={cx('wrapper')}>
        <Container>
          <Alert variant="danger" className={cx('alert')}>{t('certificateDetail.notFound')}</Alert>
          <ButtonPrime variant="primary" onClick={() => router.push('/my-certificates')}>
            {t('certificateDetail.backToList')}
          </ButtonPrime>
        </Container>
      </div>
    );
  }

  const revoked = certificate.status === CertificateStatus.REVOKED;
  const expired = certificate.expired;

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          compact
          title={certificate.design?.title || t('myCertificates.fallbackTitle')}
          label={t('myCertificates.label')}
          description={
            <>
              {t('myCertificates.issuedOn', { date: formatDate(certificate.issuedAt, locale) })}
              {certificate.expiresAt && ` · ${t('myCertificates.expiresOn', { date: formatDate(certificate.expiresAt, locale) })}`}
            </>
          }
          onAction={() => window.print()}
          actionText={t('certificateDetail.print')}
          onSecondaryAction={handleCopyLink}
          secondaryActionText={t('certificateDetail.copyLink')}
        />

        <div className={cx('toolbar')}>
          <ButtonPrime variant="ghost" size="sm" onClick={() => router.push('/my-certificates')}>
            <ArrowLeft size={16} /> {t('certificates.myCertificates')}
          </ButtonPrime>
        </div>

        {revoked && (
          <Alert variant="danger" className={cx('alert')}>
            {certificate.revokedReason
              ? t('certificateDetail.revokedWithReason', { reason: certificate.revokedReason })
              : t('certificateDetail.revoked')}
          </Alert>
        )}
        {!revoked && expired && (
          <Alert variant="warning" className={cx('alert')}>
            {t('certificateDetail.expired')}
          </Alert>
        )}

        <div className={cx('sheet')}>
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
        </div>
      </Container>
    </div>
  );
}

export default CertificateDetail;
