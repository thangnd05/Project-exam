import { useState } from "react";
import { Modal, Alert } from "react-bootstrap";
import axios from "axios";
import classNames from "classnames/bind";
import styles from "./JoinClassModal.module.scss";
import { FaUsers, FaKey, FaInfoCircle, FaTimes } from "react-icons/fa";
import { useAuth } from "~/hook/useAuth";
import { useNavigate } from "react-router-dom";
import routes from "~/config/Routes";

const cx = classNames.bind(styles);

function JoinClassModal({ show, onClose }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Message state
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const { user } = useAuth();
    const navigate = useNavigate();

    // ✅ Join class logic
    const handleJoin = async () => {
        setMessage("");

        // 🟢 Check login
        if (!user) {
            setType("warning");
            setMessage("⚠️ Bạn cần đăng nhập trước khi tham gia lớp!");

            setTimeout(() => {
                onClose();
                navigate(routes.login);
            }, 1200);

            return;
        }

        // 🟡 Validate input
        if (!code.trim()) {
            setType("danger");
            setMessage("⚠️ Vui lòng nhập mã lớp!");
            return;
        }

        setLoading(true);

        try {
            // ✅ Call API join class (đúng như JoinClassPage)
            await axios.post("/api/class-members/join", {
                classId: Number(code),
            });

            setType("success");
            setMessage("🎉 Gửi yêu cầu tham gia lớp thành công!");

            // Reset + close modal
            setTimeout(() => {
                setCode("");
                onClose();
                navigate(routes.myClasses);
            }, 1500);
        } catch (err) {
            setType("danger");
            setMessage(
                err.response?.data?.message ||
                "❌ Không có lớp nào với mã tham gia này!"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            show={show}
            onHide={onClose}
            centered
            className={cx("modalCustom")}
            contentClassName={cx("modalContent")}
        >
            {/* Header */}
            <div className={cx("header")}>
                <div className={cx("titleWrapper")}>
                    <FaUsers />
                    <h3 className={cx("title")}>Tham gia lớp học</h3>
                </div>

                <button className={cx("closeBtn")} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>

            {/* ✅ Alert Message */}
            {message && (
                <Alert
                    variant={type}
                    style={{ margin: "15px 20px", fontSize: "14px" }}
                >
                    {message}
                </Alert>
            )}

            {/* Body */}
            <div className={cx("body")}>
                <div className={cx("formGroup")}>
                    <label className={cx("label")}>Mã lớp học</label>

                    <div className={cx("inputWrapper")}>
                        <span className={cx("inputIcon")}>
                            <FaKey />
                        </span>

                        <input
                            type="text"
                            className={cx("inputControl")}
                            placeholder="Ví dụ: 123"
                            value={code}
                            onChange={(e) => setCode(e.target.value)}
                            disabled={loading}
                        />
                    </div>

                    <div className={cx("tip")}>
                        <FaInfoCircle />
                        <span>Liên hệ giáo viên để lấy mã lớp chính xác.</span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className={cx("footer")}>
                <button className={cx("btnCancel")} onClick={onClose}>
                    Hủy
                </button>

                <button
                    className={cx("btnSubmit")}
                    onClick={handleJoin}
                    disabled={loading}
                >
                    {loading ? "Đang xử lý..." : "Tham gia ngay"}
                </button>
            </div>
        </Modal>
    );
}

export default JoinClassModal;
