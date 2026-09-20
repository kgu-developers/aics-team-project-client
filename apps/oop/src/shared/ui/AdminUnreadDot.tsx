import * as styles from './AdminUnreadDot.css';

export function AdminUnreadDot() {
  return (
    <span
      aria-label='읽지 않음'
      className={styles.dot}
      data-unread-indicator='true'
      role='img'
    />
  );
}
