import classNames from 'classnames/bind';
import styles from './CommonFormModal.module.scss';
import ButtonPrime from '../Button/ButtonPrime';

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
    <>
      <ButtonPrime
        type="button"
        variant="ghost"
        size="lg"
        className={cx('btnCancel')}
        onClick={onCancel}
        disabled={loading}
      >
        {cancelLabel}
      </ButtonPrime>

      <ButtonPrime
        type="button"
        variant="primary"
        size="lg"
        className={cx('btnSubmit')}
        onClick={onSubmit}
        disabled={loading}
      >
        {SubmitIcon ? <SubmitIcon className="me-2" /> : null}
        {loading ? loadingLabel || submitLabel : submitLabel}
      </ButtonPrime>
    </>
  );
}

export default ModalActionFooter;
