import * as styles from './AdminUnreadDot.css';

export function AdminUnreadDot() {
  return (
    <span
      aria-hidden='true'
      className={styles.dot}
      data-unread-indicator='true'
    />
  );
}
