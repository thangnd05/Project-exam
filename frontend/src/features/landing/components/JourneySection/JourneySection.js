import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './JourneySection.module.scss';
import images from '~/shared/assets/images';
import DeviceMockup from '../DeviceMockup/DeviceMockup';

const cx = classNames.bind(styles);

const steps = [
  {
    id: 'try',
    index: '01',
    title: 'Làm bài thử',
    text: 'Bài ngắn, đủ để lộ điểm yếu — không cần ngồi cả buổi.',
    hint: 'Có timer · như thi thật',
    shot: images.quickImage,
    shotAlt: 'Màn hình làm đề trên WinDe',
  },
  {
    id: 'see',
    index: '02',
    title: 'Nhận chẩn đoán',
    text: 'Biết chỗ nào đang kéo điểm, ưu tiên sửa phần nào trước.',
    hint: 'Theo từng kỹ năng',
    shot: images.dignos,
    shotAlt: 'Trang chẩn đoán năng lực trên WinDe',
  },
  {
    id: 'path',
    index: '03',
    title: 'Luyện theo kế hoạch',
    text: 'Nhận lộ trình cá nhân: làm đúng thứ tự, đúng chỗ còn yếu.',
    hint: 'Task đúng chỗ hổng',
    shot: images.learningPlan,
    shotAlt: 'Trang lộ trình cá nhân trên WinDe',
  },
];

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
          <h2 className={cx('title')}>Ba bước để ôn đúng chỗ</h2>
          <p className={cx('subtitle')}>
            Không luyện mù quáng — làm thử, xem rõ điểm yếu, rồi ôn đúng chỗ.
          </p>
        </motion.header>

        <div className={cx('rows')}>
          {steps.map((step, i) => (
            <motion.div
              key={step.id}
              className={cx('row', {reverse: i % 2 === 1})}
              initial={{opacity: 0, y: 40}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.3}}
              transition={{duration: 0.6, ease: [0.22, 1, 0.36, 1]}}
            >
              <div className={cx('rowText')}>
                <div className={cx('stepTop')}>
                  <span className={cx('index')}>{step.index}</span>
                  <h3 className={cx('stepTitle')}>{step.title}</h3>
                </div>
                <p className={cx('stepText')}>{step.text}</p>
                <span className={cx('hint')}>{step.hint}</span>
              </div>
              <div className={cx('rowVisual')}>
                <DeviceMockup src={step.shot} alt={step.shotAlt} />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
