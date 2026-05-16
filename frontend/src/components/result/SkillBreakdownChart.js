import { useState } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';

const getBarColor = (percentage) => {
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 60) return '#f59e0b';
  return '#ef4444';
};

const getStatusIcon = (percentage) => {
  if (percentage >= 80) return '✅';
  if (percentage >= 60) return '⚠️';
  return '❌';
};

function SkillBreakdownChart({ skillBreakdown = [], partBreakdown = [] }) {
  const [expandedParts, setExpandedParts] = useState({});

  if (!skillBreakdown.length && !partBreakdown.length) return null;

  const togglePart = (partId) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  // Group parts by skill
  const partsBySkill = {};
  partBreakdown.forEach((part) => {
    if (!partsBySkill[part.skillId]) {
      partsBySkill[part.skillId] = [];
    }
    partsBySkill[part.skillId].push(part);
  });

  return (
    <div style={{ marginTop: 24 }}>
      <h3 style={{ fontSize: 18, fontWeight: 700, marginBottom: 16, color: '#1e293b' }}>
        📊 Phân tích theo lĩnh vực
      </h3>

      {/* Skill level breakdown */}
      {skillBreakdown.map((skill) => (
        <div key={skill.skillId} style={{ marginBottom: 20 }}>
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            marginBottom: 6, fontWeight: 600, fontSize: 15, color: '#334155',
          }}>
            <span>{skill.skillName}</span>
            <span style={{ color: getBarColor(skill.percentage) }}>
              {skill.correct}/{skill.total} ({skill.percentage}%) {getStatusIcon(skill.percentage)}
              {skill.convertedScore != null && (
                <span style={{ marginLeft: 8, color: '#6366f1', fontWeight: 700 }}>
                  → {skill.convertedScore}
                </span>
              )}
            </span>
          </div>

          {/* Skill progress bar */}
          <div style={{
            background: '#e2e8f0', borderRadius: 8, height: 12, overflow: 'hidden',
          }}>
            <div style={{
              width: `${Math.min(skill.percentage, 100)}%`,
              background: getBarColor(skill.percentage),
              height: '100%', borderRadius: 8,
              transition: 'width 0.6s ease',
            }} />
          </div>

          {/* Parts within this skill */}
          {partsBySkill[skill.skillId]?.map((part) => (
            <div key={part.examPartId} style={{ marginTop: 10, marginLeft: 16 }}>
              <div
                onClick={() => togglePart(part.examPartId)}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  cursor: 'pointer', padding: '8px 12px',
                  background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0',
                  fontSize: 14, color: '#475569',
                }}
              >
                <span>{part.partName}</span>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ color: getBarColor(part.percentage) }}>
                    {part.correct}/{part.total} ({part.percentage}%) {getStatusIcon(part.percentage)}
                  </span>
                  {part.weakTags?.length > 0 && (
                    expandedParts[part.examPartId] ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />
                  )}
                </span>
              </div>

              {/* Part progress bar */}
              <div style={{
                background: '#e2e8f0', borderRadius: 6, height: 6, overflow: 'hidden',
                marginTop: 4,
              }}>
                <div style={{
                  width: `${Math.min(part.percentage, 100)}%`,
                  background: getBarColor(part.percentage),
                  height: '100%', borderRadius: 6,
                  transition: 'width 0.6s ease',
                }} />
              </div>

              {/* Tầng 3: Tag breakdown */}
              {expandedParts[part.examPartId] && part.weakTags?.length > 0 && (
                <div style={{
                  marginTop: 8, marginLeft: 12, padding: '10px 14px',
                  background: '#fff', borderRadius: 8, border: '1px solid #e2e8f0',
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 8 }}>
                    Chi tiết theo chủ đề:
                  </p>
                  {part.weakTags.map((tag) => (
                    <div key={tag.tagId} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '4px 0', fontSize: 13, color: '#475569',
                    }}>
                      <span>{tag.tagName}</span>
                      <span style={{ color: getBarColor(tag.percentage), fontWeight: 600 }}>
                        {tag.correct}/{tag.total} ({tag.percentage}%) {getStatusIcon(tag.percentage)}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

export default SkillBreakdownChart;
