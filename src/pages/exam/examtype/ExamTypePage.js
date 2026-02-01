import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import classNames from 'classnames/bind';
import style from './ExamTypeStyle.module.scss';
import { FaBookOpen, FaGlobe, FaCertificate, FaGraduationCap, FaLayerGroup } from 'react-icons/fa';

const cx = classNames.bind(style);

// 🎨 Icon Mapping for common exam types
const ICONS = {
  'TOEIC': <FaCertificate />,
  'IELTS': <FaGlobe />,
  'NORMAL': <FaLayerGroup />,
  'VSTEP': <FaGraduationCap />,
  'ENGLISH': <FaBookOpen />,
  'default': <FaLayerGroup />
};

function ExamTypePage() {
  const [examTypes, setExamTypes] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get('/api/exam-types')
      .then((response) => {
        setExamTypes(response.data);
      })
      .catch((error) => {
        console.error('Lỗi khi lấy exam types:', error);
      });
  }, []);

  const handleClick = (examTypeId) => {
    navigate(`/exam-types/${examTypeId}`);
  };

  const getIcon = (name) => {
    const upper = name.toUpperCase();
    if (upper.includes('TOEIC')) return ICONS['TOEIC'];
    if (upper.includes('IELTS')) return ICONS['IELTS'];
    if (upper.includes('NORMAL')) return ICONS['NORMAL'];
    if (upper.includes('VSTEP')) return ICONS['VSTEP'];
    if (upper.includes('ENGLISH')) return ICONS['ENGLISH'];
    return ICONS['default'];
  };

  return (
    <div className={cx('exam-type-container')}>
      <div className={cx('header-box')}>
        <h2 className={cx('exam-type-title')}>Lựa chọn loại đề thi</h2>
        <p className={cx('exam-type-subtitle')}>Khám phá kho đề thi phong phú và đa dạng phù hợp với mọi mục tiêu ôn tập</p>
      </div>

      <div className={cx('exam-types-grid')}>
        {examTypes.map((examType) => (
          <div
            key={examType.examTypeId}
            className={cx('category-card')}
            onClick={() => handleClick(examType.examTypeId)}
          >
            <div className={cx('icon-wrapper')}>
              {getIcon(examType.name)}
            </div>
            <div className={cx('card-info')}>
              <h4 className={cx('name')}>{examType.name}</h4>
              <span className={cx('action-text')}>Khám phá ngay →</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ExamTypePage;
