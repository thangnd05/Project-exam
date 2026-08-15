import styles from './Loading.module.scss';

type LoadingProps = {
  label?: string;
};

/**
 * Khung chờ dùng chung cho `loading.tsx` của từng route và cho fallback của <Suspense>
 * ở layout nhóm. Trước đây mỗi layout tự viết một khối style inline giống hệt nhau.
 */
function Loading({ label = 'Đang tải...' }: LoadingProps) {
  return (
    <div className={styles.wrapper} role="status" aria-live="polite">
      <div className={styles.spinner} />
      <span className={styles.label}>{label}</span>
    </div>
  );
}

export default Loading;
