import { useState, useEffect } from "react";
import { toast } from 'react-toastify';
import axios from "axios";
import classNames from "classnames/bind";
import { FaEdit, FaInfoCircle } from "react-icons/fa";
import { IoSaveOutline } from "react-icons/io5";
import CommonFormModal from "~/components/common/modal/CommonFormModal";
import ModalActionFooter from "~/components/common/modal/ModalActionFooter";
import styles from "~/components/common/modal/CommonFormModal.module.scss";

const cx = classNames.bind(styles);

function UpdateAlbumModal({ show, onClose, onSuccess, album }) {
    const [name, setName] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (album) {
            setName(album.name || "");
            setDescription(album.description || "");
        }
    }, [album, show]);

    const handleUpdate = async () => {
        if (!name.trim()) {
            toast.warning("⚠️ Vui lòng nhập tên Album!");
            return;
        }

        setLoading(true);

        try {
            const payload = {
                name: name,
                description: description
            };

            await axios.put(`/api/vocabulary-albums/${album.albumId}`, payload);

            toast.success("🎉 Cập nhật Album thành công!");

            onClose();
            if (onSuccess) onSuccess();

        } catch (err) {
            console.error(err);
            toast.error(
                err.response?.data?.message ||
                "❌ Có lỗi xảy ra khi cập nhật Album!"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Chỉnh sửa Album"
            icon={FaEdit}
            footer={(
                <ModalActionFooter
                    cancelLabel="Hủy"
                    submitLabel="Lưu thay đổi"
                    loadingLabel="Đang lưu..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleUpdate}
                    submitIcon={IoSaveOutline}
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

export default UpdateAlbumModal;
