import { Container } from "react-bootstrap";
import classNames from "classnames/bind";
import style from "./poliSer.module.scss";

const cx = classNames.bind(style);

function Policy() {
  return (
    <Container className={cx("d-flex")}>
      <section className={cx("policy-wapper")}>
        <h1>Chính Sách Sử Dụng Hệ Thống</h1>

        <div>
          <h2>1. Quyền và Nghĩa Vụ của Người Dùng</h2>
          <ul>
            <li>
              Người dùng cần cung cấp thông tin chính xác, trung thực khi đăng ký tài khoản.
            </li>
            <li>
              Người dùng có trách nhiệm bảo mật thông tin đăng nhập và không chia sẻ tài khoản cho người khác.
            </li>
            <li>
              Nội dung (đề thi, câu hỏi, bình luận, tài liệu, v.v.) do người dùng đăng tải phải tuân thủ pháp luật và không vi phạm bản quyền.
            </li>
            <li>
              Khi tham gia lớp học hoặc làm bài thi, người dùng phải tuân thủ quy định của giảng viên và của hệ thống.
            </li>
          </ul>
        </div>

        <div>
          <h2>2. Quyền và Trách Nhiệm của Hệ Thống</h2>
          <ul>
            <li>
              Hệ thống cam kết bảo mật thông tin cá nhân của người dùng, không chia sẻ dữ liệu với bên thứ ba khi chưa có sự đồng ý.
            </li>
            <li>
              Có quyền kiểm duyệt, ẩn hoặc xóa nội dung vi phạm (bao gồm bài kiểm tra, câu hỏi, hoặc bình luận không phù hợp).
            </li>
            <li>
              Có quyền tạm khóa tài khoản nếu phát hiện hành vi gian lận, vi phạm điều khoản sử dụng hoặc gây ảnh hưởng đến người khác.
            </li>
            <li>
              Cập nhật và cải tiến tính năng thường xuyên để đảm bảo trải nghiệm ổn định và an toàn cho người dùng.
            </li>
          </ul>
        </div>

        <div>
          <h2>3. Quy Tắc Ứng Xử Trong Lớp Học và Cộng Đồng</h2>
          <ul>
            <li>
              Tôn trọng giảng viên và học viên khác, không sử dụng ngôn từ xúc phạm, khiêu khích hoặc kỳ thị.
            </li>
            <li>
              Không chia sẻ nội dung bài thi, đề thi hoặc đáp án ra bên ngoài khi chưa được phép.
            </li>
            <li>
              Khuyến khích chia sẻ kiến thức, tài liệu học tập chính xác và có giá trị.
            </li>
            <li>
              Cấm mọi hành vi gian lận, sao chép bài làm hoặc sử dụng phần mềm hỗ trợ gian thi.
            </li>
          </ul>
        </div>

        <div>
          <h2>4. Chính Sách Dữ Liệu và Bảo Mật</h2>
          <ul>
            <li>
              Hệ thống lưu trữ thông tin bài làm, điểm số và hoạt động học tập để phục vụ mục đích quản lý và đánh giá.
            </li>
            <li>
              Người dùng có quyền yêu cầu chỉnh sửa hoặc xóa dữ liệu cá nhân khi cần thiết.
            </li>
            <li>
              Mọi hoạt động truy cập đều được ghi nhận để bảo vệ quyền lợi của người dùng và đảm bảo tính minh bạch.
            </li>
          </ul>
        </div>

        <div>
          <h2>5. Thay Đổi Chính Sách</h2>
          <p>
            Chính sách này có thể được cập nhật theo từng giai đoạn nhằm phù hợp với quy định mới hoặc cải thiện chất lượng dịch vụ.
            Mọi thay đổi sẽ được thông báo công khai trên hệ thống trước khi áp dụng.
          </p>
        </div>

        <p className={cx("thankyou")}>
          Cảm ơn bạn đã tin tưởng và sử dụng hệ thống!  
          Hãy tuân thủ chính sách để cùng xây dựng môi trường học tập minh bạch, an toàn và hiệu quả.
        </p>
      </section>
    </Container>
  );
}

export default Policy;
