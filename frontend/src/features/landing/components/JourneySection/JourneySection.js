import {motion} from 'framer-motion';
import classNames from 'classnames/bind';
import styles from './JourneySection.module.scss';
import DeviceMockup from '../DeviceMockup/DeviceMockup';

const cx = classNames.bind(styles);

// TODO: thay `shot` bằng ảnh chụp thật của từng bước (tỷ lệ 16:10 là đẹp nhất).
// import shotExam from '~/shared/assets/images/shot-exam.png';
// import shotDiagnosis from '~/shared/assets/images/shot-diagnosis.png';
// import shotPlan from '~/shared/assets/images/shot-plan.png';
const steps = [
  {
    id: 'try',
    index: '01',
    title: 'Kiểm tra nhanh',
    text: 'Làm một bài ngắn có giới hạn thời gian — đủ để lộ điểm yếu thật, không cần ngồi cả buổi. Bạn vào đề như thi thật, hệ thống ghi nhận cách bạn xử lý từng phần.',
    hint: 'Timer · áp lực thật',
    shot: undefined, // shotExam
    shotAlt: 'Màn hình làm đề trên WinDe',
  },
  {
    id: 'see',
    index: '02',
    title: 'Xem chẩn đoán',
    text: 'Sau bài kiểm tra, WinDe phân tích kỹ năng nào đang kéo điểm xuống và mức độ nghiêm trọng ra sao. Bạn biết ngay nên ưu tiên sửa chỗ nào trước thay vì ôn lan man.',
    hint: 'Bản đồ năng lực',
    shot: undefined, // shotDiagnosis
    shotAlt: 'Trang chẩn đoán năng lực trên WinDe',
  },
  {
    id: 'path',
    index: '03',
    title: 'Luyện theo lộ trình',
    text: 'Nhận kế hoạch cá nhân dựa trên kết quả chẩn đoán: từng task đúng chỗ còn hổng, xếp theo thứ tự hợp lý để tiến bộ rõ từng ngày thay vì luyện mù quáng.',
    hint: 'Task theo thứ tự',
    shot: undefined, // shotPlan
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
          <h2 className={cx('title')}>Ba bước tới lộ trình của bạn</h2>
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
