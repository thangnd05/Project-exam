'use client';

import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';

import BaseModal from '@/app/components/modal/BaseModal';
import CertificateCanvas from '@/app/components/CertificateCanvas/CertificateCanvas';
import { useCertificateVerification } from '@/app/hooks/useCertificates';
import { CertificateVerifyState } from '@/app/enums';
import { getCertificateStateView } from './certificateStateView';
import styles from './CertificatePreviewModal.module.scss';

const cx = classNames.bind(styles);

type CertificatePreviewModalProps = {
  /** Mã chứng chỉ đang xem; rỗng nghĩa là đóng modal. */
  code?: string | null;
  onClose: () => void;
};

function CertificatePreviewModal({ code, onClose }: CertificatePreviewModalProps) {
  const { data: result, isLoading, isError } = useCertificateVerification(code || undefined);

  const state = isError ? CertificateVerifyState.NOT_FOUND : result?.state;
  const view = getCertificateStateView(state);
  const StateIcon = view.icon;
  const showCertificate = Boolean(result) && state !== CertificateVerifyState.NOT_FOUND;

  return (
    <BaseModal
      show={Boolean(code)}
      onClose={onClose}
      title={result?.recipientName || 'Chứng chỉ'}
      maxWidth="100rem"
    >
      {isLoading && (
        <div className={cx('state')}>
          <Spinner animation="border" />
          <p>Đang tải chứng chỉ {code}...</p>
        </div>
      )}

      {!isLoading && showCertificate && (
        <CertificateCanvas
          design={result?.design}
          recipientName={result?.recipientName}
          certificateCode={result?.certificateCode}
          issuedAt={result?.issuedAt}
          expiresAt={result?.expiresAt}
          watermark={view.watermark}
        />
      )}

      {!isLoading && !showCertificate && (
        <div className={cx('state')}>
          <StateIcon size={36} />
          <p>{view.message}</p>
        </div>
      )}
    </BaseModal>
  );
}

export default CertificatePreviewModal;
