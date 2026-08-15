'use client';

import { useRouter } from 'next/navigation';
import { useState } from "react";
import { Alert } from "react-bootstrap";
import { useJoinClass } from '@/app/hooks/useMyClasses';
import classNames from "classnames/bind";
import { FaKey, FaInfoCircle } from "react-icons/fa";
import { useAuth } from "@/app/hooks/useAuth";
import routes from "@/app/configs/Routes";
import CommonFormModal from "@/app/components/modal/CommonFormModal";
import ModalActionFooter from "@/app/components/modal/ModalActionFooter";
import styles from "@/app/components/modal/CommonFormModal.module.scss";

const cx = classNames.bind(styles);

type JoinClassModalProps = {
    show: boolean;
    onClose: () => void;
};

function JoinClassModal({ show, onClose }: JoinClassModalProps) {
    const [code, setCode] = useState("");

    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");

    const { user } = useAuth();
    const router = useRouter();
    const joinMutation = useJoinClass();
    const loading = joinMutation.isPending;

    const handleJoin = () => {
        setMessage("");

        if (!user) {
            setType("warning");
            setMessage(" Bạn cần đăng nhập trước khi tham gia lớp!");

            setTimeout(() => {
                onClose();
                router.push(routes.login);
            }, 1200);

            return;
        }

        if (!code.trim()) {
            setType("danger");
            setMessage("Vui lòng nhập mã classQr!");
            return;
        }

        joinMutation.mutate(
            { classQr: code.trim().toUpperCase() },
            {
                onSuccess: () => {
                    setType("success");
                    setMessage(" Gửi yêu cầu tham gia lớp thành công!");

                    setTimeout(() => {
                        setCode("");
                        onClose();
                        router.push(routes.myClasses);
                    }, 1500);
                },
                onError: (err) => {
                    setType("danger");
                    setMessage(
                        err.response?.data?.message ||
                        " Không có lớp nào với mã tham gia này!"
                    );
                },
            }
        );
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
                    style={{ margin: "1.5rem 2rem", fontSize: "var(--font-size-ssm)" }}
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
