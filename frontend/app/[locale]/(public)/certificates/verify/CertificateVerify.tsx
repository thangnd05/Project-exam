'use client';

import { useParams } from 'next/navigation';
import { useLocalizeHref, useRouter } from '@/app/i18n/navigation';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Container, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Search } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/features/certificates/CertificateCanvas/CertificateCanvas';
import { useCertificateVerification } from '@/app/features/certificates/hooks/useCertificates';
import { CertificateVerifyState } from '@/app/enums';
import CertificateWall from './_components/CertificateWall';
import { getCertificateStateView } from './_components/certificateStateView';
import styles from './CertificateVerify.module.scss';
import Loading from '@/app/components/Loading/Loading';

const cx = classNames.bind(styles);

function CertificateVerify() {
  const { code } = useParams<{ code?: string }>();
  const router = useRouter();
  const t = useTranslations('Certificates');
  const localizeHref = useLocalizeHref();
  const [searchCode, setSearchCode] = useState(code || '');

  const { data: result, isLoading, isError } = useCertificateVerification(code);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchCode.trim();
    if (trimmed) {
      router.push(localizeHref(`/certificates/verify/${encodeURIComponent(trimmed)}`));
    }
  };

  const state = isError ? CertificateVerifyState.NOT_FOUND : result?.state;
  const view = getCertificateStateView(state);
  const StateIcon = view.icon;
  const showCertificate = Boolean(result) && state !== CertificateVerifyState.NOT_FOUND;

  return (
    <div className={cx('wrapper')}>
      <Container className={cx('container')}>
        <header className={cx('head')}>
          <h1>{t('verify.title')}</h1>
          <p>{t('verify.subtitle')}</p>
        </header>

        <Form className={cx('searchForm')} onSubmit={handleSearch}>
          <Form.Control
            value={searchCode}
            onChange={(event) => setSearchCode(event.target.value)}
            placeholder={t('verify.codePlaceholder')}
            aria-label={t('verify.codeLabel')}
          />
          <ButtonPrime type="submit" variant="primary" className={cx('searchButton')}>
            <Search size={16} /> {t('verify.submit')}
          </ButtonPrime>
        </Form>

        {!code && (
          <p className={cx('hint')}>
            {t.rich('verify.hint', {
              code: (chunks) => <code>{chunks}</code>,
            })}
          </p>
        )}

        {isLoading && code && (
          <Loading label={t('verify.checking', { code })} />
        )}

        {!isLoading && code && showCertificate && (
          <div className={cx('canvasWrap')}>
            <CertificateCanvas
              design={result?.design}
              recipientName={result?.recipientName}
              certificateCode={result?.certificateCode}
              issuedAt={result?.issuedAt}
              expiresAt={result?.expiresAt}
              watermark={view.watermark}
            />
          </div>
        )}

        {!isLoading && code && !showCertificate && (
          <div className={cx('status', view.tone)}>
            <StateIcon size={26} className={cx('statusIcon')} />
            <div className={cx('statusText')}>
              <h2 className={cx('statusHeading')}>{t(view.heading)}</h2>
              <p className={cx('statusMessage')}>{t(view.message)}</p>
            </div>
          </div>
        )}

        <CertificateWall />
      </Container>
    </div>
  );
}

export default CertificateVerify;
