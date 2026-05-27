import { Download, ExternalLink } from 'lucide-react';
import { IoBookOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './Result.module.scss';

const cx = classNames.bind(styles);
const API_BASE = (process.env.REACT_APP_API_BASE_URL || '').replace(/\/$/, '');

function RecoveryPlan({ recommendations = [], recoveryMessage }) {
  if (!recommendations.length) return null;

  const grouped = {};
  recommendations.forEach((rec) => {
    const key = rec.skillName || 'Chung';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(rec);
  });

  const handleDownload = async (url, originalFileName) => {
    if (!url) return;
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = blobUrl;
      anchor.download = originalFileName || 'download';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, '_blank');
    }
  };

  const getViewUrl = (rec) => {
    if (rec.resourceId && API_BASE) {
      return `${API_BASE}/api/recovery-resources/${rec.resourceId}/view`;
    }
    return rec.resourceUrl || null;
  };

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
        Việc cần làm ngay
      </h3>
      {recoveryMessage && (
        <p className={cx('recoveryMessage')}>{recoveryMessage}</p>
      )}

      {Object.entries(grouped).map(([skillName, recs]) => (
        <div key={skillName} className={cx('skillGroup')}>
          <p className={cx('skillGroupTitle')}>Tài liệu {skillName}</p>

          {recs.map((rec, idx) => {
            const viewUrl = getViewUrl(rec);
            const canDownload = Boolean(rec.resourceUrl);

            return (
              <div
                key={rec.resourceId || idx}
                className={cx('resourceCard')}
              >
                <IoBookOutline size={20} className={cx('resourceIcon')} />
                <div className={cx('resourceContent')}>
                  <p className={cx('resourceTitle')}>{rec.resourceTitle}</p>
                  {rec.tagNames && rec.tagNames.length > 0 && (
                    <div className={cx('resourceTags')}>
                      {rec.tagNames.map((tag, i) => (
                        <span key={i} className={cx('resourceTag')}>
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {rec.resourceDescription && (
                    <p className={cx('resourceDescription')}>
                      {rec.resourceDescription}
                    </p>
                  )}
                </div>
                {(viewUrl || canDownload) && (
                  <div className={cx('resourceActions')}>
                    {viewUrl && (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cx('resourceActionLink')}
                      >
                        <ExternalLink size={14} />
                        Xem
                      </a>
                    )}
                    {canDownload && (
                      <button
                        type="button"
                        className={cx('resourceActionLink')}
                        onClick={() =>
                          handleDownload(
                            rec.resourceUrl,
                            rec.originalFileName || rec.resourceTitle,
                          )
                        }
                      >
                        <Download size={14} />
                        Tải về
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export default RecoveryPlan;
