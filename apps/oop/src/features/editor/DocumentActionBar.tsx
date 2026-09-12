import type { ReactNode } from 'react';

import * as styles from './DocumentEditorShell.css';

type Props = {
  children: ReactNode;
  error?: string | null;
};
/** Shared save/complete/submit row with one error slot. */
export default function DocumentActionBar({ children, error }: Props) {
  return (
    <div className={styles.actionBar}>
      {children}
      {error ? (
        <p className={styles.actionError} role='alert'>
          {error}
        </p>
      ) : null}
    </div>
  );
}
