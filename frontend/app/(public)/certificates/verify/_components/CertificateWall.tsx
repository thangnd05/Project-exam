'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Spinner } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Award, BadgeCheck } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import { usePublicCertificates } from '@/app/hooks/useCertificates';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import CertificatePreviewModal from './CertificatePreviewModal';
import styles from './CertificateWall.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value?: string) => (value ? new Date(value).toLocaleDateString('vi-VN') : '--');

function CertificateWall() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicCertificates();
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  /** Click trái thường mở popup; ctrl/giữa/chuột phải vẫn mở trang tra cứu như link bình thường. */
  const handleRowClick = (event: React.MouseEvent<HTMLAnchorElement>, code?: string) => {
    if (!code || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    setPreviewCode(code);
  };

  const certificates = data?.pages.flatMap((page) => page.content) ?? EMPTY_LIST;
  const total = data?.pages[0]?.totalElements ?? 0;

  return (
    <section className={cx('section')}>
      <header className={cx('sectionHead')}>
        <h2>Chứng chỉ đã cấp</h2>
        <p>
          {total > 0
            ? `${total} chứng chỉ còn hiệu lực do WinDe Exam cấp, mới nhất trước.`
            : 'Các chứng chỉ còn hiệu lực do WinDe Exam cấp.'}
        </p>
      </header>

      {isLoading && (
        <div className={cx('state')}>
          <Spinner animation="border" size="sm" /> Đang tải danh sách...
        </div>
      )}

      {isError && <div className={cx('state')}>Không tải được danh sách chứng chỉ.</div>}

      {!isLoading && !isError && certificates.length === 0 && (
        <div className={cx('empty')}>
          <Award size={36} />
          <p>Chưa có chứng chỉ nào được cấp.</p>
        </div>
      )}

      {certificates.length > 0 && (
        <ul className={cx('list')}>
          {certificates.map((certificate) => (
            <li key={certificate.certificateCode}>
              <Link
                className={cx('row')}
                href={`/certificates/verify/${certificate.certificateCode}`}
                onClick={(event) => handleRowClick(event, certificate.certificateCode)}
                style={
                  certificate.accentColor
                    ? ({ '--row-accent': certificate.accentColor } as React.CSSProperties)
                    : undefined
                }
              >
                {certificate.logoUrl ? (
                  <img className={cx('logo')} src={certificate.logoUrl} alt="" />
                ) : (
                  <span className={cx('emblem')} aria-hidden="true">
                    <BadgeCheck size={20} />
                  </span>
                )}

                <div className={cx('rowMain')}>
                  <span className={cx('name')}>{certificate.recipientName}</span>
                  <span className={cx('title')}>
                    {certificate.title || certificate.examTypeName}
                  </span>
                </div>

                <div className={cx('rowMeta')}>
                  <span className={cx('code')}>{certificate.certificateCode}</span>
                  <span className={cx('date')}>Cấp ngày {formatDate(certificate.issuedAt)}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      {hasNextPage && (
        <div className={cx('more')}>
          <ButtonPrime
            variant="outline"
            onClick={() => fetchNextPage()}
            loading={isFetchingNextPage}
          >
            Xem thêm
          </ButtonPrime>
        </div>
      )}

      <CertificatePreviewModal code={previewCode} onClose={() => setPreviewCode(null)} />
    </section>
  );
}

export default CertificateWall;
