import classNames from 'classnames/bind';
import {motion} from 'framer-motion';
import styles from './HeroSection.module.scss';
import {name} from '~/assets/images';

const cx = classNames.bind(styles);

const containerVariants = {
  hidden: {opacity: 0},
  visible: {
    opacity: 1,
    transition: {staggerChildren: 0.12, delayChildren: 0.1},
  },
};

const itemVariants = {
  hidden: {opacity: 0, y: 24},
  visible: {
    opacity: 1,
    y: 0,
    transition: {duration: 0.7, ease: [0.22, 1, 0.36, 1]},
  },
};

const imageVariants = {
  hidden: {opacity: 0, scale: 0.95, y: 20},
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: {duration: 0.9, ease: [0.22, 1, 0.36, 1], delay: 0.2},
  },
};

function HeroSection() {
  return (
    <section className={cx('hero')}>
      <motion.div
        className={cx('content')}
        initial="hidden"
        animate="visible"
        variants={containerVariants}
      >
        <motion.h1 className={cx('welcome')} variants={itemVariants}>
          Chào mừng đến với {name}
        </motion.h1>
        <motion.p className={cx('desc')} variants={itemVariants}>
          <strong>{name}</strong> – Người đồng hành cùng bạn trên hành trình
          chinh phục tri thức. Chúng tôi mang đến giải pháp hỗ trợ thông minh và
          cá nhân hóa, không chỉ cung cấp nguồn bài tập chọn lọc mà còn giúp bạn
          tự xây dựng kho câu hỏi riêng để việc ôn luyện trở nên thực tế và thú
          vị hơn.
        </motion.p>
        <motion.div className={cx('actions')} variants={itemVariants}>
          <button className={cx('btn-primary')}>Bắt đầu ngay</button>
          <button className={cx('btn-outline')}>Tìm hiểu thêm</button>
        </motion.div>
      </motion.div>

      <motion.div
        className={cx('image-wrapper')}
        initial="hidden"
        animate="visible"
        variants={imageVariants}
      >
        <div className={cx('mockup-screen')}>
          <img
            src="https://img.freepik.com/free-vector/online-certification-illustration-concept_23-2148575640.jpg"
            alt="WinDe Education Illustration"
          />
        </div>
      </motion.div>
    </section>
  );
}

export default HeroSection;
