import styles from './Loading.module.scss';

type LoadingProps = {
  label?: string;
};

function Loading({ label = 'Đang tải...' }: LoadingProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default Loading;
