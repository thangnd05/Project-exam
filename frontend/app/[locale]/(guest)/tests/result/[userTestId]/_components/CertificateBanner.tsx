'use client';

import { useRouter } from '@/app/i18n/navigation';
import classNames from 'classnames/bind';
import { useLocale, useTranslations } from 'next-intl';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { useAttemptCertificate } from '@/app/features/certificates/hooks/useCertificates';
import { AttemptCertificateState } from '@/app/enums';
import styles from './CertificateBanner.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value: string | null | undefined, locale: string) =>
  value ? new Date(value).toLocaleDateString(locale === 'en' ? 'en-US' : 'vi-VN') : '';

type CertificateBannerProps = {
  userTestId?: string;
  enabled: boolean;
};

function CertificateBanner({ userTestId, enabled }: CertificateBannerProps) {
  const router = useRouter();
  const t = useTranslations('TestTaking.certificateBanner');
  const locale = useLocale();
  const { data } = useAttemptCertificate(userTestId, enabled);

  if (!data || data.state === AttemptCertificateState.NOT_APPLICABLE) {
    return null;
  }

  if (data.state === AttemptCertificateState.NOT_PASSED) {
    return (
      <div className={cx('banner', 'pending')}>
        <div className={cx('content')}>
          <h3 className={cx('title')}>{t('notPassedTitle')}</h3>
          <p className={cx('desc')}>
            {t.rich('notPassedDesc', {
              pointsToPass: data.pointsToPass ?? 0,
              passScore: data.passScore ?? 0,
              score: data.score ?? 0,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
        </div>
        <ButtonPrime variant="outline" onClick={() => router.push('/learning-plans/generate')}>
          {t('buildPlan')}
        </ButtonPrime>
      </div>
    );
  }

  const certificate = data.certificate;
  const justIssued = data.state === AttemptCertificateState.JUST_ISSUED;

  return (
    <div className={cx('banner', 'achieved')}>
      <div className={cx('content')}>
        <h3 className={cx('title')}>
          {justIssued ? t('justIssuedTitle') : t('alreadyHaveTitle')}
        </h3>
        <p className={cx('desc')}>
          {certificate?.design?.title || t('fallbackTitle')}
          {!justIssued && certificate?.issuedAt && ` · ${t('issuedOn', { date: formatDate(certificate.issuedAt, locale) })}`}
          {!justIssued && ` · ${t('noReissue')}`}
        </p>
      </div>
      <ButtonPrime
        variant="primary"
        onClick={() => router.push(`/certificates/${certificate?.certificateId}`)}
      >
        {t('view')}
      </ButtonPrime>
    </div>
  );
}

export default CertificateBanner;
