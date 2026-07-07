import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import { getStandardExamTypes } from '../../../api/examTypeApi';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import style from './ExamTypeStyle.module.scss';
import {useAuth} from '../../../hooks/useAuth';
import routes from '~/config/Routes';

const cx = classNames.bind(style);

// Monogram tối giản: lấy 1-2 chữ cái đầu tên loại đề (thay cho icon).
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
  const [examTypes, setExamTypes] = useState([]);
  const navigate = useNavigate();
  const {user} = useAuth();

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

  useEffect(() => {
    getStandardExamTypes()
      .then((data) => {
        // Chỉ hiện loại kỳ thi gốc (parentId null); loại con (vd các cert AWS) xem khi bấm vào cha.
        setExamTypes(normalizeExamTypes(data).filter((t) => !t.parentId));
      })
      .catch((error) => {
        console.error('Lỗi khi lấy exam types:', error);
        setExamTypes([]);
      });
  }, []);

  const handleClick = (examTypeId) => {
    navigate(`/exam-types/${examTypeId}`);
  };

  const handleSetTarget = (event, examTypeId) => {
    event.stopPropagation();
    if (!user) {
      navigate(routes.login);
      return;
    }
    navigate(`${routes.myTarget}?examTypeId=${examTypeId}`);
  };

  return (
    <div id="exam-types" className={cx('exam-type-container')}>
      {/* Decorative background elements managed in CSS, but keeping structure clean */}
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
                {/* Node cha (gom nhiều kỳ thi con) không phải mục tiêu cụ thể nên ẩn nút mục tiêu. */}
                {!(examType.childCount > 0) && (
                  <button
                    type="button"
                    className={cx('targetBtn')}
                    onClick={(event) => handleSetTarget(event, examType.examTypeId)}
                  >
                    Mục tiêu của tôi
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ExamTypePage;
