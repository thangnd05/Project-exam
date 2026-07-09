import styles from './BackgroundDecor.module.scss';

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
