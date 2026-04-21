import classNames from 'classnames/bind';
import styles from './CommonFormModal.module.scss';

const cx = classNames.bind(styles);

function ModalActionFooter({
  cancelLabel = 'Hủy',
  submitLabel = 'Lưu',
  loadingLabel,
  loading = false,
  onCancel,
  onSubmit,
  submitIcon: SubmitIcon,
}) {
  return (
    <div className={cx('footer')}>
      <button
        type="button"
        className={cx('btnCancel')}
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </button>

      <button
        type="button"
        className={cx('btnSubmit')}
        onClick={onSubmit}
        disabled={loading}
      >
        {SubmitIcon ? <SubmitIcon className="me-2" /> : null}
        {loading ? loadingLabel || submitLabel : submitLabel}
      </button>
    </div>
  );
}

export default ModalActionFooter;
