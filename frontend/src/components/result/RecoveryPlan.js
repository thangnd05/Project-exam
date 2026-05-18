import { IoBookOutline, IoOpenOutline } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './Result.module.scss';

const cx = classNames.bind(styles);

function RecoveryPlan({ recommendations = [], recoveryMessage }) {
  if (!recommendations.length) return null;

  // Group by skillName
  const grouped = {};
  recommendations.forEach((rec) => {
    const key = rec.skillName || 'Chung';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(rec);
  });

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')} style={{ marginBottom: 4 }}>
        Việc cần làm ngay
      </h3>
      {recoveryMessage && (
        <p className={cx('recoveryMessage')}>
          {recoveryMessage}
        </p>
      )}

      {Object.entries(grouped).map(([skillName, recs]) => (
        <div key={skillName} className={cx('skillGroup')}>
          <p className={cx('skillGroupTitle')}>
            Tài liệu {skillName}
          </p>

          {recs.map((rec, idx) => (
            <div
              key={rec.resourceId || idx}
              className={cx('resourceCard')}
            >
              <IoBookOutline size={20} className={cx('resourceIcon')} />
              <div className={cx('resourceContent')}>
                <p className={cx('resourceTitle')}>
                  {rec.resourceTitle}
                </p>
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
              {rec.resourceUrl && (
                <a
                  href={rec.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cx('resourceLink')}
                >
                  <IoOpenOutline size={14} /> Xem
                </a>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default RecoveryPlan;
