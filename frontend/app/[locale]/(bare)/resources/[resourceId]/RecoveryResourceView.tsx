'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect } from 'react';
import classNames from 'classnames/bind';
import { Spinner } from 'react-bootstrap';
import { Printer } from 'lucide-react';
import routes from '@/app/configs/Routes';
import { useRecoveryResourceView } from './_hooks/useRecoveryResourceView';
import styles from './RecoveryResourceView.module.scss';

const cx = classNames.bind(styles);

function RecoveryResourceView() {
  const { resourceId } = useParams<{ resourceId: string }>();
  const {
    resource,
    markdownHtml,
    isLoading: loading,
    errorMessage,
  } = useRecoveryResourceView(resourceId);

  useEffect(() => {
    document.body.classList.add('recovery-resource-print-page');

    return () => {
      document.body.classList.remove('recovery-resource-print-page');
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div id="recovery-resource-print-root" className={cx('wrapper')}>
        <div className={cx('container', 'stateBox')}>
          <Spinner animation="border" size="sm" />
          <span>Đang tải tài liệu...</span>
        </div>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div id="recovery-resource-print-root" className={cx('wrapper')}>
        <div className={cx('container')}>
          <div className={cx('stateBox')}>{errorMessage}</div>
        </div>
      </div>
    );
  }

  return (
    <div id="recovery-resource-print-root" className={cx('wrapper')}>
      <div className={cx('container')}>
        <div className={cx('actions', 'noPrint')}>
          <button type="button" className={cx('actionBtn', 'primary')} onClick={handlePrint}>
            <Printer size={16} />
            In / Lưu PDF
          </button>
          <Link href={routes.home} className={cx('actionBtn')}>
            Về trang chủ
          </Link>
        </div>

        <header className={cx('header')}>
          <h1 className={cx('title')}>{resource?.title}</h1>
          {resource?.description && (
            <p className={cx('description')}>{resource.description}</p>
          )}
          <p className={cx('readHint', 'noPrint')}>
            Đọc trực tiếp trên trang này. Muốn lưu offline, chọn{' '}
            <strong>In / Lưu PDF</strong> rồi chọn máy in &quot;Lưu thành PDF&quot;.
          </p>
        </header>

        <article
          className={cx('markdownBody')}
          dangerouslySetInnerHTML={{ __html: markdownHtml }}
        />
      </div>
    </div>
  );
}

export default RecoveryResourceView;
