import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './WhyWinDe.module.scss';

const cx = classNames.bind(styles);

const points = [
  {
    id: 'diagnose',
    title: 'Chẩn đoán theo kỹ năng',
    text: 'Bạn không cần đoán mình yếu chỗ nào. Làm bài xong là thấy rõ phần đang kéo điểm, và nên ưu tiên cái gì trước.',
  },
  {
    id: 'path',
    title: 'Lộ trình cá nhân',
    text: 'Không còn mở mười tab rồi chẳng biết học gì hôm nay. WinDe xếp sẵn thứ tự ôn đúng với khoảng trống của bạn.',
  },
  {
    id: 'mock',
    title: 'Mock sát đề thật',
    text: 'Ngày thi đỡ bỡ ngỡ vì bạn đã luyện đúng cấu trúc, đúng nhịp thời gian như đề thật.',
  },
  {
    id: 'try',
    title: 'Làm thử không cần đăng ký',
    text: 'Chưa chắc cũng được. Làm một bài nhanh miễn phí trước, thấy hợp rồi hãy quyết định đi tiếp.',
  },
];

export default function WhyWinDe() {
  return (
    <section className={cx('section')} aria-label="Vì sao chọn WinDe">
      <div className={cx('inner')}>
        <motion.header
          className={cx('header')}
          initial={{opacity: 0, y: 18}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.5}}
          transition={{duration: 0.55}}
        >
          <p className={cx('eyebrow')}>Vì sao WinDe</p>
          <h2 className={cx('title')}>Ôn có hướng, không luyện mù</h2>
          <p className={cx('subtitle')}>
            WinDe không chỉ là kho đề mà còn giúp bạn biết đang đứng đâu, cần gì tiếp
            theo, và luyện sát với kỳ thi thật.
          </p>
        </motion.header>

        <ul className={cx('list')}>
          {points.map((point, i) => (
            <motion.li
              key={point.id}
              className={cx('item')}
              initial={{opacity: 0, y: 24}}
              whileInView={{opacity: 1, y: 0}}
              viewport={{once: true, amount: 0.35}}
              transition={{
                duration: 0.5,
                delay: i * 0.06,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <span className={cx('num')} aria-hidden="true">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div className={cx('body')}>
                <h3 className={cx('itemTitle')}>{point.title}</h3>
                <p className={cx('itemText')}>{point.text}</p>
              </div>
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}
