import styles from './intro.module.scss';
import classNames from "classnames/bind";
import { name } from "~/assets/images";

const cx = classNames.bind(styles);

function About() {
  return (
    <div className={cx("wrapper")}>
      <h1 className={cx("title")}>Giới thiệu về Hệ thống {name}</h1>

      <p>
        Xin chào! Chào mừng bạn đến với <strong>{name}</strong> — nền tảng học tập và kiểm tra trực tuyến
        hiện đại, được xây dựng để hỗ trợ giáo viên và học sinh trong việc tạo, tham gia và quản lý bài thi
        một cách nhanh chóng, thuận tiện và hiệu quả.
      </p>

      <h2>🎓 Mục tiêu phát triển</h2>
      <p>
        Ứng dụng được thiết kế nhằm giúp các trường học, trung tâm hoặc cá nhân có thể dễ dàng:
      </p>
      <ul>
        <li>Tạo bài kiểm tra theo từng kỹ năng hoặc môn học.</li>
        <li>Quản lý lớp học, danh sách học viên và bài thi theo từng lớp.</li>
        <li>Theo dõi tiến độ làm bài, chấm điểm tự động và hiển thị kết quả ngay lập tức.</li>
        <li>Tổ chức kỳ thi online có thời gian, số lần làm và giới hạn truy cập theo lớp.</li>
      </ul>

      <h2>💡 Tính năng nổi bật</h2>
      <ul>
        <li><strong>Tạo đề thi linh hoạt:</strong> Giáo viên có thể tự tạo đề hoặc chọn câu hỏi từ ngân hàng đề.</li>
        <li><strong>Quản lý lớp học:</strong> Tạo lớp, duyệt học viên tham gia, và theo dõi tiến trình học tập.</li>
        <li><strong>Phân quyền người dùng:</strong> Phân biệt rõ vai trò.</li>
        <li><strong>Lưu trữ đa phương tiện:</strong> Hỗ trợ chèn hình ảnh, âm thanh và tài liệu cho từng câu hỏi.</li>
        <li><strong>Báo cáo thống kê:</strong> Tổng hợp điểm, thời gian làm bài và kết quả học tập chi tiết.</li>
      </ul>

      <h2>🤝 Định hướng cộng đồng</h2>
      <p>
        <strong>{name}</strong> không chỉ là nơi kiểm tra kiến thức, mà còn là môi trường học tập tương tác,
        nơi giáo viên có thể chia sẻ tài liệu, và học viên có thể học hỏi lẫn nhau thông qua các lớp học trực tuyến.
      </p>

      <h2>📞 Liên hệ & Góp ý</h2>
      <p>
        Hệ thống vẫn đang trong quá trình phát triển và hoàn thiện. Nếu bạn có bất kỳ góp ý hoặc mong muốn cải thiện
        tính năng nào, hãy liên hệ với chúng tôi. Mỗi phản hồi của bạn đều là động lực để <strong>{name}</strong> ngày càng tốt hơn!
      </p>

      <p className={cx("thankyou")}>
        Cảm ơn bạn đã tin tưởng và sử dụng hệ thống. Chúc bạn học tập và giảng dạy hiệu quả!
      </p>
    </div>
  );
}

export default About;
