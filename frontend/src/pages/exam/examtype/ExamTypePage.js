import {useEffect, useState} from 'react';
import {useNavigate} from 'react-router-dom';
import axios from '../../../api/axiosClient';
import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import style from './ExamTypeStyle.module.scss';
import {FaBookOpen, FaBullseye, FaGlobe, FaCertificate, FaGraduationCap, FaLayerGroup} from 'react-icons/fa';
import {useAuth} from '../../../hook/useAuth';
import routes from '~/config/Routes';

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
    axios
      .get('/api/exam-types')
      .then((response) => {
        setExamTypes(normalizeExamTypes(response.data));
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
            <div className={cx('icon-wrapper')}>
              {getIcon(examType.name)}
            </div>
            <div className={cx('card-info')}>
              <h4 className={cx('name')}>{examType.name}</h4>
              <div className={cx('cardActions')}>
                <span className={cx('action-text')}>
                  Khám phá ngay
                  <span className={cx('arrow')}>→</span>
                </span>
                <button
                  type="button"
                  className={cx('targetBtn')}
                  onClick={(event) => handleSetTarget(event, examType.examTypeId)}
                >
                  <FaBullseye />
                  Mục tiêu của tôi
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export default ExamTypePage;
