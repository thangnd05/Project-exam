import { useState } from 'react';
import { IoCodeSlashOutline, IoFlashOutline } from 'react-icons/io5';
import { standardizeVocabularies, bulkCreateVocabularies } from '~/features/album/detail/api/vocabularyApi';
import { toast } from 'react-toastify';
import classNames from 'classnames/bind';
import CommonFormModal from '~/shared/ui/modal/CommonFormModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import styles from '~/shared/ui/modal/CommonFormModal.module.scss';

const cx = classNames.bind(styles);

const BulkCreateVocabularyModal = ({ show, onClose, onSuccess, albumId }) => {
    const [loading, setLoading] = useState(false);
    const [aiLoading, setAiLoading] = useState(false);
    const [jsonInput, setJsonInput] = useState('');

    const handleStandardize = async () => {
        if (!jsonInput.trim()) {
            toast.warning(' Vui lòng nhập văn bản thô để chuẩn hóa!');
            return;
        }

        setAiLoading(true);
        try {
            const result = await standardizeVocabularies({ rawText: jsonInput });

            let cleanedJson = (result?.data || '')
                .replace(/```json\n?|```/g, '')
                .trim();

            JSON.parse(cleanedJson);

            setJsonInput(cleanedJson);
            toast.success('✨ Chuẩn hóa dữ liệu thành công!');
        } catch (err) {
            console.error('Lỗi chuẩn hóa AI:', err);

            let errorMsg;
            if (err instanceof SyntaxError) {
                errorMsg = 'AI trả về dữ liệu không hợp lệ. Vui lòng thử lại!';
            } else {
                errorMsg = err.response?.data?.message
                    || err.message
                    || 'Không thể kết nối AI. Vui lòng thử lại!';
            }
            toast.error(`❌ ${errorMsg}`);
        } finally {
            setAiLoading(false);
        }
    };

    const handleSave = async (e) => {
        e.preventDefault();

        if (!jsonInput.trim()) {
            toast.warning(' Vui lòng nhập dữ liệu JSON!');
            return;
        }

        let payload;
        try {
            payload = JSON.parse(jsonInput);
            if (!Array.isArray(payload)) {
                toast.error('❌ Dữ liệu phải là một mảng (Array) các đối tượng từ vựng!');
                return;
            }
            if (payload.length === 0) {
                toast.error('❌ Mảng từ vựng không được rỗng!');
                return;
            }
        } catch (err) {
            toast.error('❌ Định dạng JSON không hợp lệ. Vui lòng kiểm tra lại!');
            return;
        }

        const processedPayload = payload.map((item) => ({
            ...item,
            albumId: item.albumId || albumId,
        }));

        setLoading(true);
        try {
            await bulkCreateVocabularies(processedPayload);
            toast.success(` Đã nhập thành công ${processedPayload.length} từ vựng!`);
            setJsonInput('');
            onSuccess();
            onClose();
        } catch (err) {
            console.error('Lỗi khi nhập bulk:', err);
            const msg = err.response?.data?.message
                || 'Có lỗi xảy ra khi nhập dữ liệu. Vui lòng kiểm tra cấu trúc JSON!';
            toast.error(`❌ ${msg}`);
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
                    <div className="d-flex gap-2">
                        <ButtonPrime
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={handleStandardize}
                            disabled={aiLoading || loading}
                        >
                            <IoFlashOutline className="me-1" />
                            {aiLoading ? 'Đang xử lý...' : 'Chuẩn hóa bằng AI'}
                        </ButtonPrime>
                        <ButtonPrime
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => setJsonInput(exampleJson)}
                            disabled={aiLoading || loading}
                        >
                            <IoCodeSlashOutline className="me-1" />
                            Xem mẫu JSON
                        </ButtonPrime>
                    </div>
                </div>
                <div className={cx('inputWrapper')}>
                    <textarea
                        className={cx('inputControl', 'textarea')}
                        placeholder='Dán mảng JSON vào đây: [{"word": "...", "meaning": "..."}, ...]'
                        value={jsonInput}
                        onChange={(e) => setJsonInput(e.target.value)}
                        disabled={loading || aiLoading}
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