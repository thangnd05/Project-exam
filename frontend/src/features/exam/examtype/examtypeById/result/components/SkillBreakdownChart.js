import { useState } from 'react';
import { IoChevronDown, IoChevronUp } from 'react-icons/io5';
import classNames from 'classnames/bind';
import styles from './Result.module.scss';
import { sortByPartOrder } from '~/shared/utils/partOrder';

const cx = classNames.bind(styles);

const getBarColor = (percentage) => {
  if (percentage >= 80) return '#22c55e';
  if (percentage >= 60) return '#f59e0b';
  return '#ef4444';
};

function SkillBreakdownChart({ skillBreakdown = [], partBreakdown = [] }) {
  const [expandedParts, setExpandedParts] = useState({});

  if (!skillBreakdown.length && !partBreakdown.length) return null;

  const togglePart = (partId) => {
    setExpandedParts((prev) => ({ ...prev, [partId]: !prev[partId] }));
  };

  const partsBySkill = {};
  partBreakdown.forEach((part) => {
    if (!partsBySkill[part.skillId]) {
      partsBySkill[part.skillId] = [];
    }
    partsBySkill[part.skillId].push(part);
  });
  Object.keys(partsBySkill).forEach((skillId) => {
    partsBySkill[skillId] = sortByPartOrder(partsBySkill[skillId], { nameKey: 'partName' });
  });

  return (
    <div className={cx('sectionContainer')}>
      <h3 className={cx('sectionTitle')}>
        Phân tích theo lĩnh vực
      </h3>

      {skillBreakdown.map((skill) => (
        <div key={skill.skillId} className={cx('skillContainer')}>
          <div className={cx('skillHeader')}>
            <span>{skill.skillName}</span>
            <span>
              {skill.correct}/{skill.total} ({skill.percentage}%)
            </span>
          </div>

          <div className={cx('progressBarContainer')}>
            <div
              className={cx('progressBarFill')}
              style={{
                width: `${Math.min(skill.percentage, 100)}%`,
                background: getBarColor(skill.percentage),
              }}
            />
          </div>

          {partsBySkill[skill.skillId]?.map((part) => (
            <div key={part.examPartId} className={cx('partContainer')}>
              <div
                onClick={() => togglePart(part.examPartId)}
                className={cx('partHeader')}
              >
                <span>{part.partName}</span>
                <span className={cx('partStats')}>
                  <span>
                    {part.correct}/{part.total} ({part.percentage}%)
                    {part.targetGapMessage && (
                      <span className={cx('targetGapMessage')}>
                        {part.targetGapMessage}
                      </span>
                    )}
                  </span>
                  {part.weakTags?.length > 0 && (
                    expandedParts[part.examPartId] ? <IoChevronUp size={16} /> : <IoChevronDown size={16} />
                  )}
                </span>
              </div>

              <div className={cx('partProgressBarContainer')}>
                <div
                  className={cx('partProgressBarFill')}
                  style={{
                    width: `${Math.min(part.percentage, 100)}%`,
                    background: part.isTargetMet != null ? (part.isTargetMet ? '#22c55e' : '#ef4444') : getBarColor(part.percentage),
                  }}
                />
                {part.targetPercentage != null && (
                  <div
                    title={`Mục tiêu: ${part.targetPercentage}%`}
                    className={cx('targetMarker')}
                    style={{ left: `${part.targetPercentage}%` }}
                  />
                )}
              </div>

              {expandedParts[part.examPartId] && part.weakTags?.length > 0 && (
                <div className={cx('tagBreakdownContainer')}>
                  <p className={cx('tagBreakdownTitle')}>
                    Chi tiết theo chủ đề:
                  </p>
                  {part.weakTags.map((tag) => (
                    <div key={tag.tagId} className={cx('tagBreakdownRow')}>
                      <span>{tag.tagName}</span>
                      <span className={cx('tagBreakdownStats')}>
                        {tag.correct}/{tag.total} ({tag.percentage}%)
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
