import {useEffect} from 'react';
import {useNavigate} from 'react-router-dom';
import {useQuery} from '@tanstack/react-query';
import { getStandardExamTypes } from '~/shared/api/examTypeApi';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import style from './ExamTypeStyle.module.scss';

const cx = classNames.bind(style);

export const examTypeKeys = {
  standard: ['exam-types', 'standard'],
};

const normalizeExamTypes = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (payload && Array.isArray(payload.data)) {
    return payload.data;
  }
  if (payload && Array.isArray(payload.content)) {
    return payload.content;
  }
  return [];
};

const getInitials = (name) => {
  if (!name) return '?';
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
};

const headerVariants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const cardVariants = {
  hidden: {opacity: 0, y: 30},
  visible: (i) => ({
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.6,
      delay: i * 0.1,
      ease: [0.22, 1, 0.36, 1],
    },
  }),
};

function ExamTypePage() {
  const navigate = useNavigate();

  const {
    data: examTypes = [],
    isError,
    error,
  } = useQuery({
    queryKey: examTypeKeys.standard,
    queryFn: getStandardExamTypes,
    select: (payload) => normalizeExamTypes(payload).filter((t) => !t.parentId),
  });

  useEffect(() => {
    if (isError) {
      console.error('Lỗi khi lấy exam types:', error);
    }
  }, [isError, error]);

  const handleClick = (examTypeId) => {
    navigate(`/exam-types/${examTypeId}`);
  };

  return (
    <div id="exam-types" className={cx('exam-type-container')}>
      <div className="container">

        <motion.div
          className={cx('header-box')}
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.5}}
          variants={headerVariants}
        >
          <h2 className={cx('exam-type-title')}>Lựa chọn loại đề thi</h2>
          <p className={cx('exam-type-subtitle')}>Khám phá kho đề thi phong phú và đa dạng phù hợp với mọi mục tiêu ôn tập</p>
        </motion.div>

        <div className={cx('exam-types-grid')}>
          {examTypes.map((examType, index) => (
          <motion.div
            key={examType.examTypeId}
            className={cx('category-card')}
            onClick={() => handleClick(examType.examTypeId)}
            custom={index}
            initial="hidden"
            whileInView="visible"
            viewport={{once: true, amount: 0.2}}
            variants={cardVariants}
            whileHover={{y: -8}}
          >
            <div className={cx('monogram')} aria-hidden="true">
              {getInitials(examType.name)}
            </div>
            <div className={cx('card-info')}>
              <h4 className={cx('name')}>{examType.name}</h4>
              <div className={cx('cardActions')}>
                <span className={cx('action-text')}>
                  {examType.childCount > 0 ? 'Xem các kỳ thi' : 'Khám phá ngay'}
                </span>
              </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ExamTypePage;
