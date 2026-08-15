import classNames from 'classnames/bind';
import PropTypes from 'prop-types';

import styles from './CertificateCanvas.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value) => {
  if (!value) return '--';
  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
};

/**
 * Bản vẽ chứng chỉ dùng chung cho trang xem, trang tra cứu công khai và khung xem trước
 * ở trang quản trị  sửa một chỗ là ba nơi đổi theo, không có bản sao nào lệch.
 *
 * Tỉ lệ A4 ngang cố định qua aspect-ratio, chữ dùng đơn vị cqw nên phóng to thu nhỏ
 * vẫn cân; nhờ vậy in ra giấy giống hệt trên màn hình.
 *
 * `design` là bản chụp lúc cấp (certificate.design), không phải cấu hình hiện tại của mẫu.
 */
function CertificateCanvas({ design, recipientName, certificateCode, issuedAt, expiresAt, watermark }) {
  const accent = design?.accentColor;

  return (
    <div
      className={cx('canvas', { hasBackground: Boolean(design?.backgroundUrl) })}
      style={{
        ...(accent ? { '--certificate-accent': accent } : {}),
        ...(design?.backgroundUrl ? { backgroundImage: `url(${design.backgroundUrl})` } : {}),
      }}
    >
      <div className={cx('frame')}>
        {watermark && <span className={cx('watermark')}>{watermark}</span>}

        <header className={cx('head')}>
          {design?.logoUrl ? (
            <img className={cx('logo')} src={design.logoUrl} alt="" />
          ) : (
            <span className={cx('logoFallback')}>{design?.issuerName || 'CHỨNG NHẬN'}</span>
          )}
          {design?.issuerName && <p className={cx('issuer')}>{design.issuerName}</p>}
        </header>

        <div className={cx('body')}>
          <h1 className={cx('title')}>{design?.title || 'Chứng nhận hoàn thành'}</h1>
          {design?.subtitle && <p className={cx('subtitle')}>{design.subtitle}</p>}

          <p className={cx('presentedTo')}>Chứng nhận này được trao cho</p>
          <p className={cx('recipient')}>{recipientName || '---'}</p>

          {design?.examTypeName && (
            <p className={cx('reason')}>
              đã hoàn thành và đạt yêu cầu bài thi <strong>{design.examTypeName}</strong>
            </p>
          )}
          {design?.footerNote && <p className={cx('note')}>{design.footerNote}</p>}
        </div>

        <footer className={cx('foot')}>
          <div className={cx('footCol')}>
            <span className={cx('footLabel')}>Ngày cấp</span>
            <span className={cx('footValue')}>{formatDate(issuedAt)}</span>
            {expiresAt && (
              <span className={cx('footHint')}>Có hiệu lực đến {formatDate(expiresAt)}</span>
            )}
          </div>

          <div className={cx('footCol', 'codeCol')}>
            <span className={cx('footLabel')}>Mã tra cứu</span>
            <span className={cx('code')}>{certificateCode || '---'}</span>
          </div>

          <div className={cx('footCol', 'signCol')}>
            {design?.signatureImageUrl && (
              <img className={cx('signature')} src={design.signatureImageUrl} alt="" />
            )}
            <span className={cx('signName')}>{design?.signatureName || ''}</span>
            {design?.signatureTitle && (
              <span className={cx('footHint')}>{design.signatureTitle}</span>
            )}
          </div>
        </footer>
      </div>
    </div>
  );
}

CertificateCanvas.propTypes = {
  design: PropTypes.object,
  recipientName: PropTypes.string,
  certificateCode: PropTypes.string,
  issuedAt: PropTypes.string,
  expiresAt: PropTypes.string,
  /** Chữ chìm cảnh báo, ví dụ "ĐÃ THU HỒI" hoặc "XEM TRƯỚC". */
  watermark: PropTypes.string,
};

export default CertificateCanvas;
