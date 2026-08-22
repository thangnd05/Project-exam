'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { Container, Spinner, Form } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Search } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/components/CertificateCanvas/CertificateCanvas';
import { useCertificateVerification } from '@/app/hooks/useCertificates';
import { CertificateVerifyState } from '@/app/enums';
import CertificateWall from './_components/CertificateWall';
import { getCertificateStateView } from './_components/certificateStateView';
import styles from './CertificateVerify.module.scss';

const cx = classNames.bind(styles);

function CertificateVerify() {
  const { code } = useParams<{ code?: string }>();
  const router = useRouter();
  const [searchCode, setSearchCode] = useState(code || '');

  const { data: result, isLoading, isError } = useCertificateVerification(code);

  const handleSearch = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = searchCode.trim();
    if (trimmed) {
      router.push(`/certificates/verify/${encodeURIComponent(trimmed)}`);
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
              <h2 className={cx('statusHeading')}>{view.heading}</h2>
              <p className={cx('statusMessage')}>{view.message}</p>
            </div>
          </div>
        )}

        <CertificateWall />
      </Container>
    </div>
  );
}

export default CertificateVerify;
