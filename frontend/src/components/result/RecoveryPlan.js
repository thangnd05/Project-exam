import { IoBookOutline, IoOpenOutline } from 'react-icons/io5';

function RecoveryPlan({ recommendations = [], readinessScore, hasTarget }) {
  if (!recommendations.length) return null;

  // Group by skillName
  const grouped = {};
  recommendations.forEach((rec) => {
    const key = rec.skillName || 'Chung';
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(rec);
  });

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4, color: '#1e293b' }}>
        🎯 Việc cần làm ngay
      </h3>
      {readinessScore != null && readinessScore < 85 && !hasTarget && (
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
          Mục tiêu: tăng readiness từ <strong>{readinessScore}%</strong> lên{' '}
          <strong>{Math.min(readinessScore + 10, 100)}%</strong>
        </p>
      )}
      {hasTarget && recommendations.length > 0 && (
        <p style={{ fontSize: 14, color: '#64748b', marginBottom: 16 }}>
          <strong>Mục tiêu của bạn:</strong> Lấp đầy khoảng trống kiến thức để đạt target. Các tài liệu dưới đây được gợi ý dựa trên những phần thi bạn chưa đạt mục tiêu đề ra.
        </p>
      )}

      {Object.entries(grouped).map(([skillName, recs]) => (
        <div key={skillName} style={{ marginBottom: 16 }}>
          <p style={{
            fontSize: 14, fontWeight: 600, color: '#475569',
            marginBottom: 8, paddingBottom: 4, borderBottom: '1px solid #e2e8f0',
          }}>
            Tài liệu {skillName}
          </p>

          {recs.map((rec, idx) => (
            <div
              key={rec.resourceId || idx}
              style={{
                display: 'flex', alignItems: 'flex-start', gap: 12,
                padding: '12px 16px', marginBottom: 8,
                background: '#f8fafc', borderRadius: 10, border: '1px solid #e2e8f0',
              }}
            >
              <IoBookOutline size={20} style={{ color: '#6366f1', flexShrink: 0, marginTop: 2 }} />
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 2 }}>
                  {rec.resourceTitle}
                </p>
                {rec.tagNames && rec.tagNames.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 4 }}>
                    {rec.tagNames.map((tag, i) => (
                      <span key={i} style={{
                        display: 'inline-block', fontSize: 11, padding: '2px 8px',
                        background: '#ede9fe', color: '#7c3aed', borderRadius: 12,
                      }}>
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
                {rec.resourceDescription && (
                  <p style={{ fontSize: 13, color: '#64748b', marginBottom: 0 }}>
                    {rec.resourceDescription}
                  </p>
                )}
              </div>
              {rec.resourceUrl && (
                <a
                  href={rec.resourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4,
                    padding: '6px 12px', background: '#6366f1', color: '#fff',
                    borderRadius: 8, fontSize: 13, fontWeight: 600,
                    textDecoration: 'none', flexShrink: 0,
                  }}
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
