'use client';

import classNames from 'classnames/bind';

import type { CertificateDesign } from '@/app/types';
import styles from './CertificateCanvas.module.scss';

const cx = classNames.bind(styles);

/* Chữ trên chứng chỉ để tiếng Anh cho giống chứng chỉ quốc tế, nên ngày cũng theo
   kiểu Anh ("15 August 2026") chứ không phải 15/08/2026. */
const formatDate = (value?: string) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

type CertificateCanvasProps = {
  design?: CertificateDesign;
  recipientName?: string;
  certificateCode?: string;
  issuedAt?: string;
  expiresAt?: string;
  /** Chữ chìm cảnh báo, ví dụ "ĐÃ THU HỒI" hoặc "XEM TRƯỚC". */
  watermark?: string;
};

function CertificateCanvas({ design, recipientName, certificateCode, issuedAt, expiresAt, watermark }: CertificateCanvasProps) {
  const accent = design?.accentColor;
  const issuedYear = issuedAt ? new Date(issuedAt).getFullYear() : null;
  const signatureName = design?.signatureName || design?.issuerName;

  return (
    <div
      className={cx('canvas', { hasBackground: Boolean(design?.backgroundUrl) })}
      style={{
        ...(accent ? ({ '--certificate-accent': accent } as React.CSSProperties) : {}),
        ...(design?.backgroundUrl ? { backgroundImage: `url(${design.backgroundUrl})` } : {}),
      }}
    >
      <div className={cx('frame')}>
        <span className={cx('corner', 'cornerTl')} aria-hidden="true" />
        <span className={cx('corner', 'cornerTr')} aria-hidden="true" />
        <span className={cx('corner', 'cornerBl')} aria-hidden="true" />
        <span className={cx('corner', 'cornerBr')} aria-hidden="true" />

        {watermark && <span className={cx('watermark')}>{watermark}</span>}

        <header className={cx('head')}>
          {design?.logoUrl ? (
            <img className={cx('logo')} src={design.logoUrl} alt="" />
          ) : (
            <span className={cx('emblem')} aria-hidden="true" />
          )}
          {design?.issuerName && <p className={cx('issuer')}>{design.issuerName}</p>}
          <span className={cx('ornament')} aria-hidden="true" />
        </header>

        <div className={cx('body')}>
          <h1 className={cx('title')}>{design?.title || 'Certificate of Achievement'}</h1>
          {design?.subtitle && <p className={cx('subtitle')}>{design.subtitle}</p>}

          <p className={cx('presentedTo')}>This certificate is proudly presented to</p>
          <p className={cx('recipient')}>{recipientName || '---'}</p>

          {design?.examTypeName && (
            <p className={cx('reason')}>
              for successfully completing and passing the{' '}
              <strong>{design.examTypeName}</strong> examination
            </p>
          )}
          {design?.footerNote && <p className={cx('note')}>{design.footerNote}</p>}
        </div>

        <footer className={cx('foot')}>
          <div className={cx('footCol')}>
            <span className={cx('footLabel')}>Date of issue</span>
            <span className={cx('footValue')}>{formatDate(issuedAt)}</span>
            {expiresAt && (
              <span className={cx('footHint')}>Valid until {formatDate(expiresAt)}</span>
            )}
          </div>

          <div className={cx('footCol', 'codeCol')}>
            <span className={cx('seal')} aria-hidden="true">
              <span className={cx('sealRing')}>
                <span className={cx('sealMark')}>★</span>
                {issuedYear && <span className={cx('sealYear')}>{issuedYear}</span>}
              </span>
            </span>
            <span className={cx('footLabel')}>Verification code</span>
            <span className={cx('code')}>{certificateCode || '---'}</span>
          </div>

          <div className={cx('footCol', 'signCol')}>
            {design?.signatureImageUrl && (
              <img className={cx('signature')} src={design.signatureImageUrl} alt="" />
            )}
            <span className={cx('signName')}>{signatureName || ''}</span>
            <span className={cx('footHint')}>
              {design?.signatureTitle || 'Authorized signature'}
            </span>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default CertificateCanvas;
