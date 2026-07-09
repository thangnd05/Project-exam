import { Container } from "react-bootstrap";
import classNames from "classnames/bind";
import style from "./poliSer.module.scss";

const cx = classNames.bind(style);

function Policy() {
  return (
    <Container className={cx("d-flex")}>
      <section className={cx("policy-wapper")}>
        <h1>Chính Sách Sử Dụng Nền Tảng</h1>

        <div>
          <p>
            Trang này mô tả các nguyên tắc sử dụng nền tảng học tập và kiểm tra trực tuyến
            (bài kiểm tra, lớp học, kho câu hỏi, kho từ vựng, hồ sơ người dùng…).
            Khi sử dụng hệ thống, bạn đồng ý tuân thủ các quy định dưới đây để đảm bảo
            trải nghiệm minh bạch, an toàn và công bằng.
          </p>
        </div>

        <div>
          <h2>1. Tài khoản và trách nhiệm của người dùng</h2>
          <ul>
            <li>
              Cung cấp thông tin đăng ký hợp lệ, chính xác và cập nhật khi cần.
            </li>
            <li>
              Bảo mật thông tin đăng nhập, không chia sẻ tài khoản hoặc cho người khác mượn quyền truy cập.
            </li>
            <li>
              Chịu trách nhiệm với mọi hoạt động phát sinh từ tài khoản của mình.
            </li>
            <li>
              Không sử dụng hệ thống cho mục đích gây gián đoạn, phá hoại, hoặc khai thác lỗi.
            </li>
          </ul>
        </div>

        <div>
          <h2>2. Nội dung người dùng tạo và quyền sở hữu</h2>
          <ul>
            <li>
              Nội dung bạn tạo (câu hỏi, bài kiểm tra, album/từ vựng, bình luận, bài viết blog trong tương lai…)
              cần tuân thủ pháp luật và không vi phạm bản quyền.
            </li>
            <li>
              Không đăng tải nội dung nhạy cảm, xúc phạm, kích động thù ghét hoặc thông tin cá nhân của người khác.
            </li>
            <li>
              Bạn chịu trách nhiệm về tính chính xác của nội dung học tập/đề thi do mình tạo.
            </li>
            <li>
              Hệ thống có thể kiểm duyệt, ẩn hoặc xóa nội dung vi phạm (bao gồm bài kiểm tra, câu hỏi hoặc bình luận không phù hợp).
            </li>
          </ul>
        </div>

        <div>
          <h2>3. Quy tắc khi tham gia lớp học và làm bài kiểm tra</h2>
          <ul>
            <li>
              Tôn trọng giáo viên/học viên khác; giao tiếp văn minh, không xúc phạm hay quấy rối.
            </li>
            <li>
              Không chia sẻ đề thi/đáp án/bài làm ra bên ngoài khi chưa được cho phép.
            </li>
            <li>
              Không gian lận: không dùng công cụ/tiện ích/thiết bị nhằm can thiệp kết quả, không sao chép bài làm.
            </li>
            <li>
              Tuân thủ các giới hạn của bài (thời gian, số lần làm, quy định truy cập theo lớp/chương).
            </li>
          </ul>
        </div>

        <div>
          <h2>4. Dữ liệu và bảo mật</h2>
          <ul>
            <li>
              Hệ thống có thể lưu trữ thông tin phục vụ vận hành như: hồ sơ cơ bản, lớp học tham gia,
              bài làm, điểm số, lịch sử làm bài và các dữ liệu thống kê.
            </li>
            <li>
              Dữ liệu được sử dụng nhằm cải thiện trải nghiệm, hỗ trợ quản lý lớp học và đảm bảo tính công bằng khi kiểm tra.
            </li>
            <li>
              Một số nhật ký truy cập/hành động có thể được ghi nhận để phòng chống gian lận và xử lý sự cố.
            </li>
          </ul>
        </div>

        <div>
          <h2>5. Blog (dự kiến)</h2>
          <p>
            Trong tương lai, nền tảng có thể bổ sung mục Blog để chia sẻ kiến thức và kinh nghiệm học tập.
            Nội dung blog (nếu có) vẫn cần tuân thủ quy tắc cộng đồng và quy định bản quyền như các nội dung khác.
          </p>
        </div>

        <div>
          <h2>6. Thay đổi chính sách</h2>
          <p>
            Chính sách này có thể được cập nhật theo từng giai đoạn để phù hợp với quy định mới hoặc cải thiện chất lượng dịch vụ.
            Khi có thay đổi quan trọng, hệ thống sẽ thông báo công khai trước khi áp dụng.
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
