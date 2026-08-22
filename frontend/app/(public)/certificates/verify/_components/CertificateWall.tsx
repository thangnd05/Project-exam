'use client';

import Link from 'next/link';
import { useState } from 'react';
import classNames from 'classnames/bind';
import { Award, Maximize2 } from 'lucide-react';

import ButtonPrime from '@/app/components/Button/ButtonPrime';
import CertificateCanvas from '@/app/components/CertificateCanvas/CertificateCanvas';
import { usePublicCertificates } from '@/app/hooks/useCertificates';
import { EMPTY_LIST } from '@/app/utils/stableEmpty';
import CertificatePreviewModal from './CertificatePreviewModal';
import styles from './CertificateWall.module.scss';

const cx = classNames.bind(styles);

const NEW_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;
const SKELETON_COUNT = 4;

/** Chứng chỉ vừa cấp trong tuần được gắn nhãn cho khu trưng bày trông "đang sống". */
const isRecent = (value?: string) =>
  Boolean(value) && Date.now() - new Date(value as string).getTime() < NEW_DAYS * DAY_MS;

function CertificateWall() {
  const { data, isLoading, isError, fetchNextPage, hasNextPage, isFetchingNextPage } =
    usePublicCertificates();
  const [previewCode, setPreviewCode] = useState<string | null>(null);

  /** Click trái thường mở popup; ctrl/giữa/chuột phải vẫn mở trang tra cứu như link bình thường. */
  const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>, code?: string) => {
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
        <ul className={cx('grid')} aria-hidden="true">
          {Array.from({ length: SKELETON_COUNT }).map((_, index) => (
            <li key={index} className={cx('skeleton')} />
          ))}
        </ul>
      )}

      {isError && <div className={cx('state')}>Không tải được danh sách chứng chỉ.</div>}

      {!isLoading && !isError && certificates.length === 0 && (
        <div className={cx('empty')}>
          <Award size={36} />
          <p>Chưa có chứng chỉ nào được cấp.</p>
        </div>
      )}

      {certificates.length > 0 && (
        <ul className={cx('grid')}>
          {certificates.map((certificate) => (
            <li key={certificate.certificateCode}>
              <Link
                className={cx('card')}
                href={`/certificates/verify/${certificate.certificateCode}`}
                onClick={(event) => handleCardClick(event, certificate.certificateCode)}
                aria-label={`Xem chứng chỉ ${certificate.certificateCode} của ${certificate.recipientName}`}
              >
                <CertificateCanvas
                  design={certificate.design}
                  recipientName={certificate.recipientName}
                  certificateCode={certificate.certificateCode}
                  issuedAt={certificate.issuedAt}
                  expiresAt={certificate.expiresAt}
                />

                {isRecent(certificate.issuedAt) && (
                  <span
                    className={cx('badge')}
                    style={
                      certificate.accentColor
                        ? ({ '--badge-accent': certificate.accentColor } as React.CSSProperties)
                        : undefined
                    }
                  >
                    Mới
                  </span>
                )}

                <span className={cx('overlay')} aria-hidden="true">
                  <Maximize2 size={16} /> Xem chứng chỉ
                </span>
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
