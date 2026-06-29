import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import classNames from 'classnames/bind';
import DOMPurify from 'dompurify';
import { marked } from 'marked';
import { Spinner } from 'react-bootstrap';
import { Printer } from 'lucide-react';
import { getResourceById, viewResourceContent } from '~/api/recoveryResourceApi';
import routes from '~/config/Routes';
import { isMarkdownResource } from '~/utils/recoveryResource';
import styles from './RecoveryResourceViewPage.module.scss';

const cx = classNames.bind(styles);
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

marked.setOptions({
  gfm: true,
  breaks: true,
});

function RecoveryResourceViewPage() {
  const { resourceId } = useParams();
  const [resource, setResource] = useState(null);
  const [markdownHtml, setMarkdownHtml] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    document.body.classList.add('recovery-resource-print-page');

    return () => {
      document.body.classList.remove('recovery-resource-print-page');
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    const loadResource = async () => {
      setLoading(true);
      setErrorMessage('');
      setMarkdownHtml('');

      try {
        const data = await getResourceById(resourceId);
        if (cancelled) {
          return;
        }

        if (!isMarkdownResource(data)) {
          const viewUrl = API_BASE
            ? `${API_BASE}/api/recovery-resources/${resourceId}/view`
            : `/api/recovery-resources/${resourceId}/view`;
          window.location.replace(viewUrl);
          return;
        }

        setResource(data);
        const markdownText = await viewResourceContent(resourceId);
        if (cancelled) {
          return;
        }

        const renderedHtml = marked.parse(markdownText);
        setMarkdownHtml(DOMPurify.sanitize(renderedHtml));
      } catch (error) {
        if (!cancelled) {
          setErrorMessage('Không thể mở tài liệu markdown. Vui lòng thử lại sau.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadResource();

    return () => {
      cancelled = true;
    };
  }, [resourceId]);

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
          <Link to={routes.home} className={cx('actionBtn')}>
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

export default RecoveryResourceViewPage;
