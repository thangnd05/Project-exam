import { useState } from "react";
import classNames from "classnames/bind";
import style from "./login.module.scss";
import routes from "~/config";
import { Form, Button } from "react-bootstrap";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const cx = classNames.bind(style);

function ResetPassWord() {
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleResetPassword = async (e) => {
    e.preventDefault(); // Ngăn reload trang (nếu input nằm trong form)
    setMessage('');
    setError('');
  
    // Kiểm tra khớp mật khẩu
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu mới và mật khẩu xác nhận không khớp!");
      return;
    }
  
    try {
      // Chuẩn bị dữ liệu theo dạng x-www-form-urlencoded
      const params = new URLSearchParams();
      params.append("token", token);
      params.append("newPassword", newPassword);
  
      // Gửi yêu cầu đặt lại mật khẩu
      const response = await axios.post(
        "http://localhost:8080/api/auth/reset-password",
        params,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
  
      // Hiển thị thông báo thành công và chuyển hướng
      setMessage("Đặt lại mật khẩu thành công!");
      setTimeout(() => {
        navigate(routes.login); // Chuyển sang trang đăng nhập
      }, 2000);
    } catch (err) {
      // Xử lý lỗi
      if (err.response && err.response.status === 400 ) {
        setError("Token không hợp lệ hoặc đã hết hạn!");
      } 
    }
  };

  
  

  return (
    <div className={cx("bodic")}>
      <Form
        className={cx("wrap")}
        id="login-form"
        onSubmit={handleResetPassword}
      >
        <h1>Đặt lại mật khẩu</h1>

        {/* Nhập Token */}
        <Form.Group className={cx("input-box")}>
          <Form.Control
            type="text"
            className={cx("wrap-username")}
            placeholder="Token"
            required
            value={token}
            onChange={(e) => setToken(e.target.value)}
            onInvalid={(e) => {
                e.target.setCustomValidity("Vui lòng nhập token!"); // Tùy chỉnh thông báo
            }}
            onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập
          />
        </Form.Group>

        {/* Nhập mật khẩu mới */}
        <Form.Group className={cx("input-box")}>
          <Form.Control
            type="password"
            className={cx("wrap-password")}
            placeholder="Mật khẩu mới"
            required
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            onInvalid={(e) => {
                e.target.setCustomValidity("Vui lòng nhập mật khẩu mới!"); // Tùy chỉnh thông báo
            }}
            onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập
          />
        </Form.Group>

        {/* Nhập lại mật khẩu mới */}
        <Form.Group className={cx("input-box")}>
          <Form.Control
            type="password"
            className={cx("wrap-password")}
            placeholder="Xác nhận mật khẩu mới"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            onInvalid={(e) => {
                e.target.setCustomValidity("Xác nhận mật khẩu mới!"); // Tùy chỉnh thông báo
            }}
            onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập
            
          />
        </Form.Group>

        {/* Thông báo */}
        {message && <div className={cx("alert", "alert-success")}>{message}</div>}
        {error && <div className={cx("alert", "alert-danger")}>{error}</div>}

        <div className={cx("login-link")}>
          <Button className={cx("login-btn")} type="submit">
            Đặt lại mật khẩu
          </Button>
        </div>

        <div className={cx("register-link")}>
          <span>Nhớ lại mật khẩu? </span>
          <Link to={routes.forgot}>Quên</Link>
        </div>
      </Form>
    </div>
  );
}

export default ResetPassWord;
