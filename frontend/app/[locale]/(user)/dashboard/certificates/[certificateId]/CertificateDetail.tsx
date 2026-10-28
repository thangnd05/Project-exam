'use client';

import { useParams } from 'next/navigation';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useTranslations } from 'next-intl';
import { Container, Alert } from 'react-bootstrap';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import { ArrowLeft, CircleAlert } from 'lucide-react';

import PageHeader from '@/app/components/PageHeader/PageHeader';
import ButtonPrime from '@/app/components/Button/ButtonPrime';
import EmptyState from '@/app/components/EmptyState/EmptyState';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useCertificateDetail } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateStatus } from '@/app/enums';
import styles from './CertificateDetail.module.scss';
import Loading from '@/app/components/Loading/Loading';
import { formatDate } from '@/app/utils/format-date-time';

const cx = classNames.bind(styles);


function CertificateDetail() {
  const { certificateId } = useParams<{ certificateId: string }>();
  const t = useTranslations('Account');
  const tCommon = useTranslations('Common');
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
      <Loading label={t('certificates.loading')} />
    );
  }

  if (isError || !certificate) {
    return (
      <div className={cx('wrapper')}>
        <Container>
          <EmptyState
            tone="danger"
            icon={CircleAlert}
            title={tCommon('loadErrorTitle')}
            description={t('certificateDetail.notFound')}
            action={
              <ButtonPrime variant="primary" onClick={() => router.push('/dashboard/certificates')}>
                {t('certificateDetail.backToList')}
              </ButtonPrime>
            }
          />
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
              {t('myCertificates.issuedOn', { date: formatDate(certificate.issuedAt, '--') })}
              {certificate.expiresAt && ` · ${t('myCertificates.expiresOn', { date: formatDate(certificate.expiresAt, '--') })}`}
            </>
          }
          onAction={() => window.print()}
          actionText={t('certificateDetail.print')}
          onSecondaryAction={handleCopyLink}
          secondaryActionText={t('certificateDetail.copyLink')}
        />

        <div className={cx('toolbar')}>
          <ButtonPrime variant="ghost" size="sm" onClick={() => router.push('/dashboard/certificates')}>
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
