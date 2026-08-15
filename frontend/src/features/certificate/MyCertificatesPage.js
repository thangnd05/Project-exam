'use client';

import { useRouter } from 'next/navigation';
import { Container, Spinner, Alert } from 'react-bootstrap';
import classNames from 'classnames/bind';
import { Award, ExternalLink } from 'lucide-react';

import PageHeader from '~/shared/ui/PageHeader/PageHeader';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import CertificateCanvas from './components/CertificateCanvas';
import { useMyCertificates } from './hooks/useCertificates';
import styles from './MyCertificatesPage.module.scss';

const cx = classNames.bind(styles);

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('vi-VN') : '--';

function MyCertificatesPage() {
  const router = useRouter();
  const { data: certificates = [], isLoading, isError } = useMyCertificates();

  const activeCount = certificates.filter(
    (c) => c.status === 'ACTIVE' && !c.expired,
  ).length;

  return (
    <div className={cx('wrapper')}>
      <Container>
        <PageHeader
          title="Chứng chỉ của tôi"
          label="Thành tích"
          description="Chứng chỉ được cấp khi bạn đạt điểm yêu cầu ở bài thi thử toàn phần. Mỗi loại đề chỉ cấp một chứng chỉ."
          meta={
            <span className={cx('countBadge')}>
              <Award size={18} /> {activeCount} chứng chỉ còn hiệu lực
            </span>
          }
        />

        {isLoading && (
          <div className={cx('state')}>
            <Spinner animation="border" />
            <p>Đang tải chứng chỉ...</p>
          </div>
        )}

        {isError && (
          <Alert variant="danger">Không tải được danh sách chứng chỉ. Vui lòng thử lại.</Alert>
        )}

        {!isLoading && !isError && certificates.length === 0 && (
          <div className={cx('empty')}>
            <Award size={48} />
            <h3>Bạn chưa có chứng chỉ nào</h3>
            <p>
              Hoàn thành một bài thi thử toàn phần và đạt điểm yêu cầu để nhận chứng chỉ đầu tiên.
            </p>
            <ButtonPrime variant="primary" onClick={() => router.push('/')}>
              Tìm bài thi thử
            </ButtonPrime>
          </div>
        )}

        {!isLoading && certificates.length > 0 && (
          <div className={cx('grid')}>
            {certificates.map((certificate) => {
              const revoked = certificate.status === 'REVOKED';
              const expired = certificate.expired;
              return (
                <article key={certificate.certificateId} className={cx('card')}>
                  <button
                    type="button"
                    className={cx('preview', { dimmed: revoked || expired })}
                    onClick={() => router.push(`/certificates/${certificate.certificateId}`)}
                    aria-label={`Xem chứng chỉ ${certificate.design?.title || ''}`}
                  >
                    <CertificateCanvas
                      design={certificate.design}
                      recipientName={certificate.recipientName}
                      certificateCode={certificate.certificateCode}
                      issuedAt={certificate.issuedAt}
                      expiresAt={certificate.expiresAt}
                      watermark={revoked ? 'REVOKED' : expired ? 'EXPIRED' : undefined}
                    />
                  </button>

                  <div className={cx('cardBody')}>
                    <h3 className={cx('cardTitle')}>
                      {certificate.design?.title || 'Chứng chỉ'}
                    </h3>
                    <p className={cx('cardMeta')}>
                      Cấp ngày {formatDate(certificate.issuedAt)}
                      {certificate.expiresAt && ` · Hết hạn ${formatDate(certificate.expiresAt)}`}
                    </p>
                    <div className={cx('cardActions')}>
                      <ButtonPrime
                        variant="primary"
                        size="sm"
                        onClick={() => router.push(`/certificates/${certificate.certificateId}`)}
                      >
                        Xem & tải về
                      </ButtonPrime>
                      <ButtonPrime
                        as="a"
                        variant="ghost"
                        size="sm"
                        href={`/certificates/verify/${certificate.certificateCode}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <ExternalLink size={14} /> Trang tra cứu
                      </ButtonPrime>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </Container>
    </div>
  );
}

export default MyCertificatesPage;
