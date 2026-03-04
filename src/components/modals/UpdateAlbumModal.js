import { useState, useEffect } from "react";
import { Modal } from "react-bootstrap";
import { toast } from 'react-toastify';
import axios from "axios";
import classNames from "classnames/bind";
import styles from "./CreateAlbumModal.module.scss"; // Reuse same styles
import { FaEdit, FaInfoCircle, FaTimes } from "react-icons/fa";
import { IoSaveOutline } from "react-icons/io5";

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
                    <FaEdit />
                    <h3 className={cx("title")}>Chỉnh sửa Album</h3>
                </div>

                <button className={cx("closeBtn")} onClick={onClose}>
                    <FaTimes />
                </button>
            </div>

            {/* Body */}
            <div className={cx("body")}>
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
            </div>

            {/* Footer */}
            <div className={cx("footer")}>
                <button className={cx("btnCancel")} onClick={onClose} disabled={loading}>
                    Hủy
                </button>

                <button
                    className={cx("btnSubmit")}
                    onClick={handleUpdate}
                    disabled={loading}
                >
                    <IoSaveOutline className="me-2" />
                    {loading ? "Đang lưu..." : "Lưu thay đổi"}
                </button>
            </div>
        </Modal>
    );
}

export default UpdateAlbumModal;
