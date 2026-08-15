'use client';

import { Container } from "react-bootstrap";
import classNames from "classnames/bind";
import style from "./poliSer.module.scss";

const cx = classNames.bind(style);

function Service() {
  return (
    <Container className={cx("d-flex")}>
      <section className={cx("service-wapper")}>
        <h1>Dịch Vụ & Tính Năng Nền Tảng</h1>

        <div>
          <p>
            Nền tảng hỗ trợ học tập và kiểm tra trực tuyến cho nhiều vai trò (học viên, giáo viên, quản trị viên).
            Các tính năng có thể thay đổi theo phiên bản và theo phân quyền tài khoản.
          </p>
        </div>

        <div>
          <h2>1. Dành Cho Giáo Viên</h2>
          <ul>
            <li>
              <strong>Tạo bài kiểm tra:</strong> Tạo đề theo kỹ năng/môn học, nhập câu hỏi thủ công hoặc chọn từ kho câu hỏi.
            </li>
            <li>
              <strong>Quản lý lớp học:</strong> Tạo lớp, duyệt học viên tham gia và theo dõi tiến trình/điểm số theo từng bài.
            </li>
            <li>
              <strong>Chấm điểm và thống kê:</strong> Tự động chấm điểm (tùy loại câu hỏi), hiển thị thống kê theo lớp/bài.
            </li>
            <li>
              <strong>Thiết lập điều kiện làm bài:</strong> Cấu hình thời gian, số lần làm, thời gian mở/đóng, phạm vi theo lớp/chương.
            </li>
          </ul>
        </div>

        <div>
          <h2>2. Dành Cho Học Viên</h2>
          <ul>
            <li>
              <strong>Tham gia lớp học:</strong> Tham gia lớp bằng mã/lời mời (tùy lớp) và xem các bài được công bố.
            </li>
            <li>
              <strong>Làm bài trực tuyến:</strong> Giao diện làm bài trực quan, hiển thị thời gian và tự động lưu tiến độ (khi được hỗ trợ).
            </li>
            <li>
              <strong>Xem kết quả:</strong> Xem điểm và lịch sử làm bài; một số bài có thể hiển thị chi tiết đáp án đúng/sai tùy cấu hình.
            </li>
            <li>
              <strong>Ôn tập:</strong> Luyện tập lại theo bài/lớp, và quản lý kho từ vựng/album cá nhân để học tập.
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
              Dữ liệu được lưu trữ và bảo vệ nhằm phục vụ vận hành hệ thống và hạn chế truy cập trái phép.
            </li>
            <li>
              Hệ thống hoạt động ổn định trên cả máy tính và thiết bị di động.
            </li>
            <li>
              Hỗ trợ kỹ thuật và phản hồi người dùng qua trang liên hệ hoặc email hỗ trợ.
            </li>
          </ul>
        </div>

        <div>
          <h2>5. Blog (dự kiến)</h2>
          <p>
            Nền tảng có thể phát triển thêm Blog để đăng bài chia sẻ kiến thức, thông báo và hướng dẫn học tập.
            Nội dung blog sẽ được quản lý theo quy tắc cộng đồng và chính sách bản quyền.
          </p>
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
