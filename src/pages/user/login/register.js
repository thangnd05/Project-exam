import classNames from "classnames/bind";
import style from './login.module.scss';
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { Form, Button } from "react-bootstrap";
import { useState } from "react";
import routes from "~/config";

const cx = classNames.bind(style);

function Register() {
    const [fullname, setFullName] = useState('');
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        if (!rememberMe) {
            setMessage("Bạn phải đồng ý với điều khoản & điều kiện.");
            setMessageType("error");
            return;
        }
        setLoading(true);
        setMessage('');
        try {
            const response = await axios.post("http://localhost:8080/api/register", {
                username,
                password,
                email,
                fullname,
            });
            setLoading(false);
            setMessage("Đăng ký thành công. Vui lòng đăng nhập.");
            setMessageType("success");
            setTimeout(() => navigate(routes.login), 2000);
        } catch (err) {
            setLoading(false);
            if (err.response) {
                if (err.response.status === 409) {
                    setMessage("Email hoặc Username đã tồn tại.");
                } else if (err.response.status === 400) {
                    setMessage("Yêu cầu nhập mật khẩu.");
                } else {
                    setMessage("Có lỗi xảy ra. Vui lòng thử lại sau.");
                }
            } else {
                setMessage("Không thể kết nối đến server. Vui lòng kiểm tra lại.");
            }
            setMessageType("error");
        }
    };



    

    return (
        <div className={cx("bodic")}>
            <Form className={cx("wrap")} id="login-form" onSubmit={handleRegister}>
                <h1>Đăng ký</h1>
                <Form.Group className={cx("input-box")}>
                    <Form.Control
                        type="text"
                        className={cx("wrap-fullname")}
                        id="fullname"
                        placeholder="Họ và tên"
                        onInvalid={(e) => {
                            e.target.setCustomValidity("Vui lòng nhập Họ và tên!"); // Tùy chỉnh thông báo
                        }}
                        onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập
                        required
                        value={fullname}
                        onChange={(e) => setFullName(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className={cx("input-box")}>
                    <Form.Control
                        type="email"
                        className={cx("wrap-email")}
                        id="email"
                        placeholder="Email"
                        onInvalid={(e) => {
                            if (!e.target.value) {
                                e.target.setCustomValidity("Vui lòng nhập email!"); // Khi để trống
                            } else if (!e.target.value.includes("@")) {
                                e.target.setCustomValidity("Email phải có ký tự '@'!"); // Khi thiếu '@'
                            } else {
                                e.target.setCustomValidity("Vui lòng nhập đúng định dạng email!"); // Khi sai định dạng
                            }
                        }}
                        onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập lại
    
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                    />
                </Form.Group>

                <Form.Group className={cx("input-box")}>
                    <Form.Control
                        type="text"
                        className={cx("wrap-username")}
                        id="username"
                        placeholder="Tên đăng nhập"
                        onInvalid={(e) => {
                            e.target.setCustomValidity("Vui lòng nhập tên đăng nhập!"); // Tùy chỉnh thông báo
                        }}
                        onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập
                        required
                        value={username}
                        onChange={(e) => setUserName(e.target.value)}
                        maxLength={10}
                    />
                </Form.Group>

                <Form.Group className={cx("input-box")}>
                    <Form.Control
                        type="password"
                        className={cx("wrap-password")}
                        id="password"
                        placeholder="Mật khẩu"
                        onInvalid={(e) => {
                            e.target.setCustomValidity("Vui lòng nhập mật khẩu!"); // Tùy chỉnh thông báo
                        }}        
                        onInput={(e) => e.target.setCustomValidity("")} // Xóa thông báo khi người dùng nhập               
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}

                    />
                </Form.Group>

                <div className={cx("remember-forgot")}>
                    <label>
                        <input
                            type="checkbox"
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                        />
                        <span> Đồng ý với điều khoản & điều kiện</span>
                    </label>
                </div>

                <div className={cx("register-message", messageType)}>
                    {message && (
                        <p style={{ color: messageType === "error" ? "red" : "green" }}>{message}</p>
                    )}
                </div>

                <div className={cx("login-link")}>
                    <Button
                        className={cx("login-btn")}
                        type="submit"
                        disabled={loading}
                    >
                        {loading ? "Đang xử lý..." : "Đăng ký"}
                    </Button>
                </div>

                <div className={cx("register-link")}>
                    <span>Đã có tài khoản? </span>
                    <Link to={routes.login}>Đăng nhập</Link>
                </div>
            </Form>
        </div>
    )
}

export default Register;
