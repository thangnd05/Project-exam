import { useState } from 'react';
import { IoCloudUploadOutline, IoCodeSlashOutline } from 'react-icons/io5';
import axios from '../../api/axiosClient';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '~/components/common/modal/CommonFormModal';
import ModalActionFooter from '~/components/common/modal/ModalActionFooter';
import styles from '~/components/common/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

const BulkCreateVocabularyModal = ({ show, onClose, onSuccess, albumId }) => {
    const [loading, setLoading] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    const handleSave = async (e) => {
        e.preventDefault();
        
        if (!jsonInput.trim()) {
            toast.warning('⚠️ Vui lòng nhập dữ liệu JSON!');
            return;
        }

        let payload;
        try {
            payload = JSON.parse(jsonInput);
            if (!Array.isArray(payload)) {
                toast.error('❌ Dữ liệu phải là một mảng (Array) các đối tượng từ vựng!');
                return;
            }
        } catch (err) {
            toast.error('❌ Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại!');
            return;
        }

        // Add albumId to each item if not present
        const processedPayload = payload.map(item => ({
            ...item,
            albumId: item.albumId || albumId
        }));

        setLoading(true);
        try {
            await axios.post(
                '/api/vocabularies/bulk',
                processedPayload,
                { withCredentials: true }
            );
            toast.success(`🚀 Đã nhập thành công ${processedPayload.length} từ vựng!`);
            setJsonInput('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error(' Lỗi khi nhập bulk:', err);
            toast.error('Có lỗi xảy ra khi nhập dữ liệu. Vui lòng kiểm tra cấu trúc JSON!');
        } finally {
            setLoading(false);
        }
    };

    const exampleJson = `[
  {
    "word": "Consistency",
    "meaning": "Sự nhất quán",
    "example": "Consistency is key to success."
  },
  {
    "word": "Diligent",
    "meaning": "Cần cù, siêng năng",
    "example": "He is a diligent student."
  }
]`;

    return (
        <CommonFormModal
            show={show}
            onHide={onClose}
            title="Nhập Từ Vựng Hàng Loạt (JSON)"
            icon={IoCloudUploadOutline}
            size="lg"
            footer={(
                <ModalActionFooter
                    cancelLabel="Hủy bỏ"
                    submitLabel="Bắt đầu nhập ngay"
                    loadingLabel="Đang xử lý..."
                    loading={loading}
                    onCancel={onClose}
                    onSubmit={handleSave}
                />
            )}
        >
            <div className={cx('formGroup')}>
                <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className={cx('label', 'mb-0')}>Dữ liệu JSON</label>
                    <button 
                        type="button"
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => setJsonInput(exampleJson)}
                        style={{ fontSize: '1.2rem' }}
                    >
                        <IoCodeSlashOutline className="me-1" />
                        Xem mẫu JSON
                    </button>
                </div>
                <div className={cx('inputWrapper')}>
                    <textarea
                        className={cx('inputControl', 'textarea')}
                        placeholder='Dán mảng JSON vào đây: [{"word": "...", "meaning": "..."}, ...]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        disabled={loading}
                        rows={12}
                        style={{ fontFamily: 'monospace', fontSize: '1.3rem' }}
                    />
                </div>
                <small className="text-muted mt-2 d-block">
                    * Đảm bảo cấu trúc JSON là một mảng các đối tượng chứa các trường: <strong>word</strong>, <strong>meaning</strong>, <strong>example</strong> (tùy chọn).
                </small>
            </div>
        </CommonFormModal>
    );
};

export default BulkCreateVocabularyModal;
