import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './JourneySection.module.scss';

const cx = classNames.bind(styles);

const steps = [
  {
    id: 'try',
    index: '01',
    title: 'Kiểm tra nhanh',
    text: 'Làm bài ngắn, đủ để lộ điểm yếu — không cần ngồi cả buổi.',
    hint: 'Timer · áp lực thật',
  },
  {
    id: 'see',
    index: '02',
    title: 'Xem chẩn đoán',
    text: 'Biết kỹ năng nào đang kéo điểm xuống, ưu tiên sửa chỗ nào trước.',
    hint: 'Bản đồ năng lực',
  },
  {
    id: 'path',
    index: '03',
    title: 'Luyện theo lộ trình',
    text: 'Nhận kế hoạch cá nhân: từng task đúng chỗ còn hổng.',
    hint: 'Task theo thứ tự',
  },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: {staggerChildren: 0.14, delayChildren: 0.08},
  },
};

const itemVariants = {
  hidden: {opacity: 0, y: 28},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.55, ease: [0.22, 1, 0.36, 1]},
  },
};

function StepIcon({id}) {
  if (id === 'try') {
    return (
      <svg viewBox="0 0 64 64" className={cx('icon')} aria-hidden="true">
        <circle cx="32" cy="32" r="22" className={cx('iconRing')} />
        <path
          d="M32 18v14l9 6"
          className={cx('iconStroke')}
          fill="none"
          strokeWidth="3"
          strokeLinecap="round"
        />
      </svg>
    );
  }
  if (id === 'see') {
    return (
      <svg viewBox="0 0 64 64" className={cx('icon')} aria-hidden="true">
        <polygon
          points="32,12 52,26 44,50 20,50 12,26"
          className={cx('iconFill')}
        />
        <polygon
          points="32,20 44,28 39,44 25,42 20,30"
          className={cx('iconAccent')}
        />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 64 64" className={cx('icon')} aria-hidden="true">
      <path
        d="M10 44c12 0 14-24 27-24s12 24 17 24"
        className={cx('iconStroke')}
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
      />
      <circle cx="10" cy="44" r="4" className={cx('iconDot')} />
      <circle cx="37" cy="20" r="4" className={cx('iconDot')} />
      <circle cx="54" cy="44" r="5" className={cx('iconDotNext')} />
    </svg>
  );
}

export default function JourneySection() {
  return (
    <section className={cx('section')} aria-label="Hành trình trên WinDe">
      <div className={cx('inner')}>
        <motion.header
          className={cx('header')}
          initial={{opacity: 0, y: 18}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.6}}
          transition={{duration: 0.55}}
        >
          <p className={cx('eyebrow')}>Cách WinDe hoạt động</p>
          <h2 className={cx('title')}>Ba bước tới lộ trình của bạn</h2>
          <p className={cx('subtitle')}>
            Không luyện mù quáng — làm thử, xem rõ điểm yếu, rồi ôn đúng chỗ.
          </p>
        </motion.header>

        <motion.ol
          className={cx('steps')}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{once: true, amount: 0.25}}
        >
          {steps.map((step, i) => (
            <motion.li key={step.id} className={cx('step')} variants={itemVariants}>
              {i < steps.length - 1 && <span className={cx('connector')} aria-hidden="true" />}
              <div className={cx('stepTop')}>
                <span className={cx('index')}>{step.index}</span>
                <div className={cx('iconWrap')}>
                  <StepIcon id={step.id} />
                </div>
              </div>
              <h3 className={cx('stepTitle')}>{step.title}</h3>
              <p className={cx('stepText')}>{step.text}</p>
              <span className={cx('hint')}>{step.hint}</span>
            </motion.li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
