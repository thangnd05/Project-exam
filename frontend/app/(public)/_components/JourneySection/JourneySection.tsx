'use client';

import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './JourneySection.module.scss';
import {imageAssets} from '@/app/assets/images';
import DeviceMockup from '../DeviceMockup/DeviceMockup';

const cx = classNames.bind(styles);

const steps = [
  {
    id: 'try',
    index: '01',
    title: 'Làm bài thử',
    text: 'Bài ngắn, khoảng 15 phút. Đủ để lộ điểm yếu mà không cần ngồi cả buổi.',
    hint: 'Có timer · như thi thật',
    shot: imageAssets.quickImage,
    shotAlt: 'Màn hình làm đề trên WinDe',
  },
  {
    id: 'see',
    index: '02',
    title: 'Nhận chẩn đoán',
    text: 'Xem rõ kỹ năng nào đang kéo điểm và nên sửa phần nào trước.',
    hint: 'Theo từng kỹ năng',
    shot: imageAssets.dignos,
    shotAlt: 'Trang chẩn đoán năng lực trên WinDe',
  },
  {
    id: 'path',
    index: '03',
    title: 'Luyện theo kế hoạch',
    text: 'Nhận lộ trình cá nhân: đúng thứ tự, đúng chỗ còn yếu. Không còn mò giữa hàng đống tài liệu.',
    hint: 'Luyện đúng chỗ hổng',
    shot: imageAssets.learningPlan,
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
          <h2 className={cx('title')}>Ba bước tối ưu hóa thời gian</h2>
          <p className={cx('subtitle')}>
            Làm thử, xem rõ điểm yếu, rồi ôn đúng chỗ. Không luyện mù quáng.
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
