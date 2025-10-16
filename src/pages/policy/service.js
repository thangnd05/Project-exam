import { Container } from "react-bootstrap";
import classNames from "classnames/bind";
import style from "./poliSer.module.scss";

const cx = classNames.bind(style);

function Service() {
  return (
    <Container className={cx("d-flex")}>
      <section className={cx("service-wapper")}>
        <h1>Dịch Vụ & Tính Năng Hệ Thống</h1>

        <div>
          <h2>1. Dành Cho Giáo Viên</h2>
          <ul>
            <li>
              <strong>Tạo bài kiểm tra dễ dàng:</strong> Hệ thống hỗ trợ giáo viên tạo đề thi theo kỹ năng hoặc môn học, 
              có thể nhập câu hỏi thủ công hoặc chọn từ ngân hàng đề.
            </li>
            <li>
              <strong>Quản lý lớp học:</strong> Giáo viên có thể tạo lớp, duyệt học viên tham gia, 
              và theo dõi tiến trình làm bài, điểm số, cũng như kết quả từng học viên.
            </li>
            <li>
              <strong>Chấm điểm và thống kê:</strong> Tự động chấm điểm, hiển thị thống kê theo lớp, theo kỹ năng hoặc theo kỳ thi.
            </li>
            <li>
              <strong>Tùy chỉnh thời gian và giới hạn:</strong> Có thể đặt thời gian thi, số lần làm, 
              hoặc giới hạn quyền truy cập theo lớp học cụ thể.
            </li>
          </ul>
        </div>

        <div>
          <h2>2. Dành Cho Học Viên</h2>
          <ul>
            <li>
              <strong>Tham gia lớp học:</strong> Học viên có thể nhập mã lớp để tham gia vào lớp học của giáo viên.
            </li>
            <li>
              <strong>Làm bài kiểm tra trực tuyến:</strong> Giao diện làm bài trực quan, hiển thị thời gian và tự động lưu tiến độ.
            </li>
            <li>
              <strong>Xem điểm và kết quả:</strong> Sau khi hoàn thành bài thi, hệ thống sẽ chấm tự động 
              và hiển thị chi tiết đáp án đúng/sai.
            </li>
            <li>
              <strong>Ôn tập và luyện thi:</strong> Học viên có thể làm lại bài hoặc luyện các câu hỏi trong ngân hàng đề của lớp.
            </li>
          </ul>
        </div>

        <div>
          <h2>3. Dành Cho Quản Trị Viên</h2>
          <ul>
            <li>
              <strong>Quản lý người dùng:</strong> Theo dõi, cập nhật hoặc khóa tài khoản khi phát hiện vi phạm.
            </li>
            <li>
              <strong>Kiểm duyệt nội dung:</strong> Xem xét các bài thi, câu hỏi, tài liệu được đăng tải để đảm bảo tuân thủ quy định.
            </li>
            <li>
              <strong>Báo cáo thống kê hệ thống:</strong> Tổng hợp số lượng lớp học, bài kiểm tra và hoạt động người dùng.
            </li>
          </ul>
        </div>

        <div>
          <h2>4. Hạ Tầng & Hỗ Trợ Kỹ Thuật</h2>
          <ul>
            <li>
              Dữ liệu được lưu trữ an toàn trên máy chủ, bảo mật bằng công nghệ mã hóa hiện đại.
            </li>
            <li>
              Hệ thống hoạt động ổn định trên cả máy tính và thiết bị di động.
            </li>
            <li>
              Hỗ trợ kỹ thuật và phản hồi người dùng qua trang liên hệ hoặc email hỗ trợ.
            </li>
          </ul>
        </div>

        <p className={cx("thankyou")}>
          Cảm ơn bạn đã sử dụng dịch vụ của hệ thống!  
          Chúng tôi cam kết mang đến trải nghiệm học tập và kiểm tra hiệu quả, minh bạch và an toàn.
        </p>
      </section>
    </Container>
  );
}

export default Service;
