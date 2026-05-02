import styles from './BackgroundDecor.module.scss';

/**
 * Lớp họa tiết nền động đặt phía sau toàn bộ page.
 * - 3 blob gradient trôi chậm theo path khác nhau
 * - 1 lớp dot pattern tĩnh để tăng texture
 * - position: fixed → không scroll cùng nội dung
 * - z-index: -1 + pointer-events: none → không cản tương tác
 */
function BackgroundDecor() {
  return (
    <div className={styles.decor} aria-hidden="true">
      <span className={`${styles.blob} ${styles.blob1}`} />
      <span className={`${styles.blob} ${styles.blob2}`} />
      <span className={`${styles.blob} ${styles.blob3}`} />
      <span className={styles.grid} />
    </div>
  );
}

export default BackgroundDecor;
