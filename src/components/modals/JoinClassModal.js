import { useState } from "react";
import { Alert } from "react-bootstrap";
import axios from "axios";
import classNames from "classnames/bind";
import { FaUsers, FaKey, FaInfoCircle } from "react-icons/fa";
import { useAuth } from "~/hook/useAuth";
import { useNavigate } from "react-router-dom";
import routes from "~/config/Routes";
import CommonFormModal from "~/components/common/modal/CommonFormModal";
import ModalActionFooter from "~/components/common/modal/ModalActionFooter";
import styles from "~/components/common/modal/CommonFormModal.module.scss";

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
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Tham gia lớp học"
            icon={FaUsers}
            footer={(
                <ModalActionFooter
                    cancelLabel="Để sau"
                    submitLabel="Tham gia ngay"
                    loadingLabel="Đang xử lý..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleJoin}
                />
            )}
        >
            {/* ✅ Alert Message */}
            {message && (
                <Alert
                    variant={type}
                    style={{ margin: "15px 20px", fontSize: "14px" }}
                >
                    {message}
                </Alert>
            )}

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
        </CommonFormModal>
    );
}

export default JoinClassModal;
