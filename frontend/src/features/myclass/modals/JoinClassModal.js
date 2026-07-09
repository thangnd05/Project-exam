import { useState } from "react";
import { Alert } from "react-bootstrap";
import { joinClass } from '~/api/classMemberApi';
import classNames from "classnames/bind";
import { FaKey, FaInfoCircle } from "react-icons/fa";
import { useAuth } from "~/shared/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import routes from "~/shared/config/Routes";
import CommonFormModal from "~/shared/ui/modal/CommonFormModal";
import ModalActionFooter from "~/shared/ui/modal/ModalActionFooter";
import styles from "~/shared/ui/modal/CommonFormModal.module.scss";

const cx = classNames.bind(styles);

function JoinClassModal({ show, onClose }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);

    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const { user } = useAuth();
    const navigate = useNavigate();

    const handleJoin = async () => {
        setMessage("");

        if (!user) {
            setType("warning");
            setMessage(" Bạn cần đăng nhập trước khi tham gia lớp!");

            setTimeout(() => {
                onClose();
                navigate(routes.login);
            }, 1200);

            return;
        }

        if (!code.trim()) {
            setType("danger");
            setMessage("Vui lòng nhập mã classQr!");
            return;
        }

        setLoading(true);

        try {

            await joinClass({
                classQr: code.trim().toUpperCase(),
            });

            setType("success");
            setMessage(" Gửi yêu cầu tham gia lớp thành công!");

            setTimeout(() => {
                setCode("");
                onClose();
                navigate(routes.myClasses);
            }, 1500);
        } catch (err) {
            setType("danger");
            setMessage(
                err.response?.data?.message ||
                " Không có lớp nào với mã tham gia này!"
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

            {message && (
                <Alert
                    variant={type}
                    style={{ margin: "15px 20px", fontSize: "14px" }}
                >
                    {message}
                </Alert>
            )}

            <div className={cx("formGroup")}>
                <label className={cx("label")}>Mã classQr</label>

                <div className={cx("inputWrapper")}>
                    <span className={cx("inputIcon")}>
                        <FaKey />
                    </span>

                    <input
                        type="text"
                        className={cx("inputControl")}
                        placeholder="Ví dụ: AB12CD34"
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                        disabled={loading}
                    />
                </div>

                <div className={cx("tip")}>
                    <FaInfoCircle />
                    <span>Liên hệ giáo viên để lấy mã classQr chính xác.</span>
                </div>
            </div>
        </CommonFormModal>
    );
}

export default JoinClassModal;
