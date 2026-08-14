import {useState} from 'react';
import {motion, AnimatePresence} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './FaqSection.module.scss';

const cx = classNames.bind(styles);

const faqs = [
  {
    id: 'free',
    q: 'WinDe miễn phí tới đâu?',
    a: 'Bạn có thể làm kiểm tra nhanh và khám phá các kỳ thi mà không mất phí. Một số tính năng sâu hơn (lưu tiến độ, lớp học, đánh giá…) sẽ cần tài khoản để đồng bộ.',
  },
  {
    id: 'signup',
    q: 'Khi nào mình cần đăng ký?',
    a: 'Khi muốn giữ kết quả lâu dài, theo lộ trình cá nhân, hoặc dùng tính năng cần lưu hồ sơ. Còn muốn thử trước thì cứ làm bài  không bắt buộc tạo tài khoản ngay.',
  },
  {
    id: 'quick',
    q: 'Kiểm tra nhanh khác gì đề thi thật?',
    a: 'Bài ngắn hơn, đủ để lộ điểm yếu và hướng ôn. Khi đã quen nhịp, bạn có thể chuyển sang bộ đề mock sát cấu trúc kỳ thi thật hơn.',
  },
  {
    id: 'path',
    q: 'Có lộ trình cá nhân thật không?',
    a: 'Có. Sau khi làm bài và xem chẩn đoán, WinDe gợi ý thứ tự ôn theo chỗ bạn còn yếu  thay vì tự mò giữa hàng loạt tài liệu.',
  },
  {
    id: 'exams',
    q: 'Hỗ trợ những kỳ thi nào?',
    a: 'Các kỳ thi chuẩn đang có trên nền tảng (xem phần “Chọn kỳ thi của bạn” phía trên). Danh sách sẽ mở rộng theo nội dung được cập nhật.',
  },
];

export default function FaqSection() {
  const [openId, setOpenId] = useState(faqs[0].id);

  const toggle = (id) => {
    setOpenId((prev) => (prev === id ? null : id));
  };

  return (
    <section className={cx('section')} aria-label="Câu hỏi thường gặp">
      <div className={cx('inner')}>
        <motion.header
          className={cx('header')}
          initial={{opacity: 0, y: 18}}
          whileInView={{opacity: 1, y: 0}}
          viewport={{once: true, amount: 0.5}}
          transition={{duration: 0.55}}
        >
          <p className={cx('eyebrow')}>FAQ</p>
          <h2 className={cx('title')}>Câu hỏi hay gặp</h2>
          <p className={cx('subtitle')}>
            Miễn phí tới đâu, khi nào cần đăng ký, và cách WinDe giúp bạn ôn.
          </p>
        </motion.header>

        <div className={cx('list')}>
          {faqs.map((item, i) => {
            const open = openId === item.id;
            return (
              <motion.div
                key={item.id}
                className={cx('item', {open})}
                initial={{opacity: 0, y: 16}}
                whileInView={{opacity: 1, y: 0}}
                viewport={{once: true, amount: 0.3}}
                transition={{
                  duration: 0.45,
                  delay: i * 0.04,
                  ease: [0.22, 1, 0.36, 1],
                }}
              >
                <button
                  type="button"
                  className={cx('trigger')}
                  aria-expanded={open}
                  aria-controls={`faq-panel-${item.id}`}
                  id={`faq-trigger-${item.id}`}
                  onClick={() => toggle(item.id)}
                >
                  <span className={cx('question')}>{item.q}</span>
                  <span className={cx('icon')} aria-hidden="true">
                    {open ? '−' : '+'}
                  </span>
                </button>
                <AnimatePresence initial={false}>
                  {open && (
                    <motion.div
                      id={`faq-panel-${item.id}`}
                      role="region"
                      aria-labelledby={`faq-trigger-${item.id}`}
                      className={cx('panel')}
                      initial={{height: 0, opacity: 0}}
                      animate={{height: 'auto', opacity: 1}}
                      exit={{height: 0, opacity: 0}}
                      transition={{duration: 0.28, ease: [0.22, 1, 0.36, 1]}}
                    >
                      <p className={cx('answer')}>{item.a}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
