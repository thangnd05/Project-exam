import { useState } from "react";
import { toast } from 'react-toastify';
import { useCreateAlbum } from '../hooks/useCreateAlbum';
import classNames from "classnames/bind";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import CommonFormModal from "~/shared/ui/modal/CommonFormModal";
import ModalActionFooter from "~/shared/ui/modal/ModalActionFooter";
import styles from "~/shared/ui/modal/CommonFormModal.module.scss";

const cx = classNames.bind(styles);

function CreateAlbumModal({ show, onClose, onSuccess }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");

    const createMutation = useCreateAlbum();
    const loading = createMutation.isPending;

    const handleCreate = () => {
        if (!name.trim()) {
            toast.warning(" Vui lòng nhập tên Album!");
            return;
        }

        const payload = {
            name: name,
            description: description
        };

        createMutation.mutate(payload, {
            onSuccess: () => {
                toast.success("Tạo Album thành công!");

                setName("");
                setDescription("");
                onClose();

                if (onSuccess) onSuccess();
            },
            onError: (err) => {
                console.error(err);
                toast.error(
                    err.response?.data?.message ||
                    "Có lỗi xảy ra khi tạo Album!"
                );
            },
        });
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Tạo Album Mới"
            footer={(
                <ModalActionFooter
                    cancelLabel="Để sau"
                    submitLabel="Tạo Album ngay"
                    loadingLabel="Đang tạo..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleCreate}
                />
            )}
        >
            <div className={cx("formGroup")}>
                <label className={cx("label")}>Tên Album</label>
                <div className={cx("inputWrapper")}>
                    <span className={cx("inputIcon")}>
                        <FaEdit />
                    </span>
                    <input
                        type="text"
                        className={cx("inputControl")}
                        placeholder="Ví dụ: Từ vựng IELTS, Giao tiếp..."
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={loading}
                        autoFocus
                    />
                </div>
            </div>

            <div className={cx("formGroup")}>
                <label className={cx("label")}>Mô tả</label>
                <div className={cx("inputWrapper")}>
                    <textarea
                        className={cx("inputControl", "textarea")}
                        placeholder="Nhập mô tả về mục tiêu của album này..."
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        disabled={loading}
                        rows={3}
                    />
                </div>
                <div className={cx("tip")}>
                    <FaInfoCircle />
                    <span>Mô tả giúp bạn ghi nhớ mục đích học tập của album.</span>
                </div>
            </div>
        </CommonFormModal>
    );
}

export default CreateAlbumModal;
