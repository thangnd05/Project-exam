import { useState } from "react";
import { Modal, Alert } from "react-bootstrap";
import axios from "axios";
import classNames from "classnames/bind";
import styles from "./CreateClassModal.module.scss";
import { FaChalkboardTeacher, FaEdit, FaInfoCircle, FaTimes } from "react-icons/fa";
import { useAuth } from "~/hook/useAuth";
import { useNavigate } from "react-router-dom";
import routes from "~/config/Routes";

const cx = classNames.bind(styles);

function CreateClassModal({ show, onClose }) {
    const [className, setClassName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    // ✅ Message state
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const { user } = useAuth();
    const navigate = useNavigate();

    // ✅ Create class logic
    const handleCreate = async () => {
        setMessage("");

        // 🟢 Check login
        if (!user) {
            setType("warning");
            setMessage("⚠️ Bạn cần đăng nhập trước khi tạo lớp!");

            setTimeout(() => {
                onClose();
                navigate(routes.login);
            }, 1200);

            return;
        }

        // 🟡 Validate input
        if (!className.trim()) {
            setType("danger");
            setMessage("⚠️ Vui lòng nhập tên lớp học!");
            return;
        }

        setLoading(true);

        try {
            // ✅ Call API create class
            // Request body matches ClassEntity: className, description, teacherId (handled by backend or passed from frontend)
            // Backend should handle teacherId from session (as mentioned in conversation 5997355f)
            await axios.post("/api/classes", {
                className: className,
                description: description
            });

            setType("success");
            setMessage("🎉 Tạo lớp học thành công!");

            // Reset + close modal
            setTimeout(() => {
                setClassName("");
                setDescription("");
                onClose();
                // Optionally navigate to myClasses or the new class
                navigate(routes.myClasses);
            }, 1500);
        } catch (err) {
            setType("danger");
            setMessage(
                err.response?.data?.message ||
                "❌ Có lỗi xảy ra khi tạo lớp học!"
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
                    <FaChalkboardTeacher />
                    <h3 className={cx("title")}>Tạo lớp học mới</h3>
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
                    <label className={cx("label")}>Tên lớp học</label>
                    <div className={cx("inputWrapper")}>
                        <span className={cx("inputIcon")}>
                            <FaEdit />
                        </span>
                        <input
                            type="text"
                            className={cx("inputControl")}
                            placeholder="Nhập tên lớp học (ví dụ: Lớp Tiếng Anh 10A1)"
                            value={className}
                            onChange={(e) => setClassName(e.target.value)}
                            disabled={loading}
                        />
                    </div>
                </div>

                <div className={cx("formGroup", "mt-4")}>
                    <label className={cx("label")}>Mô tả lớp học</label>
                    <div className={cx("inputWrapper")}>
                        <textarea
                            className={cx("inputControl", "textarea")}
                            placeholder="Nhập mô tả về lớp học (không bắt buộc)"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            disabled={loading}
                            rows={3}
                        />
                    </div>
                    <div className={cx("tip")}>
                        <FaInfoCircle />
                        <span>Mô tả giúp học sinh hiểu rõ hơn về nội dung lớp học.</span>
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
                    onClick={handleCreate}
                    disabled={loading}
                >
                    {loading ? "Đang xử lý..." : "Tạo lớp ngay"}
                </button>
            </div>
        </Modal>
    );
}

export default CreateClassModal;
