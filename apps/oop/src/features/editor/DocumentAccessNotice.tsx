import type { ReactNode } from 'react';

import {
  documentAccessMessage,
  type DocumentAccessState,
} from './documentAccessMessage';
import * as styles from './DocumentEditorShell.css';

type Props = DocumentAccessState & {
  /** Control that takes or re-checks write access, when the page offers one. */
  action?: ReactNode;
  /** Document specific copy that replaces the derived message. */
  message?: string | undefined;
};
/** Shared access banner so every document editor states the same thing. */
export default function DocumentAccessNotice({
  action,
  message,
  ...state
}: Props) {
  return (
    <div className={styles.notice}>
      <p>{message ?? documentAccessMessage(state)}</p>
      {action}
    </div>
  );
}
