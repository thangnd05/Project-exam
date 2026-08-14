import {useEffect, useMemo, useState} from 'react';
import {Form} from 'react-bootstrap';
import {Eye, Send} from 'lucide-react';
import {toast} from 'react-toastify';
import ReactQuill from 'react-quill';
import classNames from 'classnames/bind';
import 'react-quill/dist/quill.snow.css';

import BaseModal from '~/shared/ui/modal/BaseModal';
import ModalActionFooter from '~/shared/ui/modal/ModalActionFooter';
import ButtonPrime from '~/shared/ui/Button/ButtonPrime';
import {AdminFieldError} from '../components/common';
import {useEmailMutations} from './hooks/useAdminEmails';
import styles from './EmailEditorModal.module.scss';

const cx = classNames.bind(styles);

const emptyForm = {name: '', description: '', subject: '', bodyHtml: '', active: true};

const QUILL_MODULES = {
  toolbar: [
    [{header: [1, 2, 3, false]}, {size: ['small', false, 'large', 'huge']}],
    ['bold', 'italic', 'underline', 'strike'],
    [{color: []}, {background: []}],
    [{list: 'ordered'}, {list: 'bullet'}],
    // Tách thành 4 nút riêng thay vì dropdown: dropdown 4 mục rất dễ bấm nhầm "căn đều"
    // (justify) thành "căn giữa", mà một dòng ngắn căn đều thì trông y hệt căn trái.
    [{align: ''}, {align: 'center'}, {align: 'right'}, {align: 'justify'}],
    ['link', 'blockquote'],
    ['clean'],
  ],
};

const QUILL_FORMATS = [
  'header', 'size',
  'bold', 'italic', 'underline', 'strike',
  'color', 'background',
  'list', 'bullet', 'align',
  'link', 'blockquote',
];

/**
 * Soạn nội dung email bằng trình soạn thảo. Backend tự đổi HTML của trình soạn thảo sang
 * style inline lúc gửi (EmailHtmlNormalizer) vì hộp thư không đọc CSS ngoài.
 */
function EmailEditorModal({show, email, onClose}) {
  const isAuto = email?.type === 'AUTO';
  const isEditing = Boolean(email?.emailId);
  // Khung chung là HTML email viết tay (div lồng nhau, style inline)  nạp vào trình soạn
  // thảo là mất hết bố cục, nên chỉ cho sửa ở dạng HTML.
  const isLayout = email?.code === 'LAYOUT_BASE';

  const [form, setForm] = useState(emptyForm);
  const [errorMessage, setErrorMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [previewHtml, setPreviewHtml] = useState('');
  const [testEmail, setTestEmail] = useState('');

  const {createEmail, updateEmail, previewEmail, testSendEmail} = useEmailMutations();

  useEffect(() => {
    if (!show) {
      return;
    }
    setForm(
      email
        ? {
            name: email.name || '',
            description: email.description || '',
            subject: email.subject || '',
            bodyHtml: email.bodyHtml || '',
            active: email.active !== false,
          }
        : emptyForm,
    );
    setErrorMessage('');
    setPreviewHtml('');
    setTestEmail('');
  }, [show, email]);

  const setField = (field, value) => setForm((previous) => ({...previous, [field]: value}));

  const hasHandwrittenLayout = useMemo(
    () => /<(div|table|td)\b/i.test(form.bodyHtml),
    [form.bodyHtml],
  );

  const validate = () => {
    if (!form.subject.trim()) {
      setErrorMessage('Tiêu đề email không được để trống.');
      return false;
    }
    if (!form.bodyHtml.trim()) {
      setErrorMessage('Nội dung email không được để trống.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    setErrorMessage('');
    if (!validate()) {
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        description: form.description.trim(),
        subject: form.subject.trim(),
        bodyHtml: form.bodyHtml,
        active: form.active,
      };
      if (isEditing) {
        await updateEmail({emailId: email.emailId, payload});
      } else {
        await createEmail(payload);
      }
      toast.success('Đã lưu nội dung email.');
      onClose();
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không thể lưu email. Vui lòng thử lại.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePreview = async () => {
    setErrorMessage('');
    if (!validate()) {
      return;
    }
    try {
      const result = await previewEmail({subject: form.subject, bodyHtml: form.bodyHtml});
      setPreviewHtml(result.bodyHtml);
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không tạo được bản xem trước.');
    }
  };

  const handleTestSend = async () => {
    setErrorMessage('');
    if (!isEditing) {
      setErrorMessage('Hãy lưu email trước khi gửi thử.');
      return;
    }
    if (!validate()) {
      return;
    }
    try {
      await testSendEmail({
        emailId: email.emailId,
        payload: {subject: form.subject, bodyHtml: form.bodyHtml, toEmail: testEmail || undefined},
      });
      toast.info('Đã đưa email thử vào hàng gửi, kiểm tra hộp thư sau ít giây.');
    } catch (error) {
      setErrorMessage(error?.response?.data?.message || 'Không gửi thử được.');
    }
  };

  const insertVariable = (variable) => {
    setField('bodyHtml', `${form.bodyHtml}{{${variable}}}`);
  };

  return (
    <BaseModal
      show={show}
      onClose={submitting ? undefined : onClose}
      title={isEditing ? `Sửa nội dung: ${email?.name || email?.subject}` : 'Soạn email mới'}
      maxWidth={860}
      footer={
        <ModalActionFooter
          onCancel={onClose}
          onSubmit={handleSubmit}
          cancelLabel="Đóng"
          submitLabel="Lưu nội dung"
          loading={submitting}
        />
      }
    >
      {isAuto && (
        <div className="alert alert-info py-2 small">
          Mẫu tự động <b>{email.code}</b>  {email.description}
        </div>
      )}

      {!isAuto && (
        <Form.Group className="mb-3">
          <Form.Label>Tên gợi nhớ</Form.Label>
          <Form.Control
            value={form.name}
            placeholder="Ví dụ: Thông báo bảo trì hệ thống"
            onChange={(event) => setField('name', event.target.value)}
          />
        </Form.Group>
      )}

      <Form.Group className="mb-3">
        <Form.Label>Tiêu đề email</Form.Label>
        <Form.Control
          value={form.subject}
          onChange={(event) => setField('subject', event.target.value)}
        />
      </Form.Group>

      <Form.Label>Nội dung</Form.Label>

      {!isLayout && hasHandwrittenLayout && (
        <div className="alert alert-warning py-2 small">
          Nội dung này có khối HTML viết tay (nút bấm, khung màu). Trình soạn thảo không
          hiểu chúng nên nếu bạn sửa ở đây thì các khối đó sẽ mất định dạng.
        </div>
      )}

      {!isLayout ? (
        <div className={cx('editor', 'mb-3')}>
          <ReactQuill
            theme="snow"
            value={form.bodyHtml}
            // Chỉ nhận thay đổi do người dùng gõ. Quill chuẩn hóa lại HTML ngay khi nạp và
            // cũng bắn onChange  nhận luôn thì chỉ mở modal lên đã làm hỏng nội dung.
            onChange={(value, _delta, source) => {
              if (source === 'user') {
                setField('bodyHtml', value);
              }
            }}
            modules={QUILL_MODULES}
            formats={QUILL_FORMATS}
            placeholder="Viết nội dung email tại đây..."
          />
        </div>
      ) : (
        <Form.Group className="mb-2">
          <Form.Control
            as="textarea"
            rows={12}
            className="font-monospace small"
            value={form.bodyHtml}
            onChange={(event) => setField('bodyHtml', event.target.value)}
          />
        </Form.Group>
      )}

      {isLayout && (
        <div className="alert alert-secondary py-2 small">
          Đây là khung bọc ngoài mọi email nên chỉ sửa được ở dạng HTML. Giữ nguyên vị trí{' '}
          <code>{'{{content}}'}</code>  đó là chỗ nội dung từng email được chèn vào.
        </div>
      )}

      {email?.availableVars?.length > 0 && (
        <div className="mb-3 small text-muted">
          Biến dùng được (bấm để chèn vào cuối nội dung):{' '}
          {email.availableVars.map((variable) => (
            <button
              key={variable}
              type="button"
              className="btn btn-sm btn-outline-secondary py-0 px-2 me-1 mb-1"
              onClick={() => insertVariable(variable)}
            >
              {`{{${variable}}}`}
            </button>
          ))}
        </div>
      )}

      <Form.Check
        type="switch"
        className="mb-3"
        label={isAuto ? 'Đang bật (tắt là ngừng gửi loại email này)' : 'Đang bật'}
        checked={form.active}
        onChange={(event) => setField('active', event.target.checked)}
      />

      <div className="d-flex flex-wrap align-items-end gap-2 mb-3">
        <ButtonPrime type="button" variant="outline" onClick={handlePreview}>
          <Eye size={16} className="me-1" />
          Xem trước
        </ButtonPrime>
        <div className="flex-fill" style={{minWidth: '20rem'}}>
          <Form.Label className="small mb-1">Gửi thử tới</Form.Label>
          <Form.Control
            type="email"
            placeholder="Bỏ trống để gửi về email của bạn"
            value={testEmail}
            onChange={(event) => setTestEmail(event.target.value)}
          />
        </div>
        <ButtonPrime type="button" variant="outline" onClick={handleTestSend}>
          <Send size={16} className="me-1" />
          Gửi thử
        </ButtonPrime>
      </div>

      {previewHtml && (
        <div className="mb-2">
          <div className="small text-muted mb-1">
            Bản xem trước (đã lồng vào khung chung, biến thay bằng dữ liệu của bạn):
          </div>
          {/* iframe sandbox: cách ly CSS của trang admin và chặn mọi script trong nội dung. */}
          <iframe
            title="Xem trước email"
            srcDoc={previewHtml}
            sandbox=""
            style={{width: '100%', height: '32rem', border: '1px solid var(--border-color)', borderRadius: '0.8rem'}}
          />
        </div>
      )}

      <AdminFieldError message={errorMessage} />
    </BaseModal>
  );
}

export default EmailEditorModal;
