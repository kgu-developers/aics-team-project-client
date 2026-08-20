import { Button, Heading } from '@aics/design-system';
import { type RefObject, useEffect, useRef } from 'react';

import * as styles from './StudentDetailDialog.css';

export type StudentDetailDialogStudent = {
  name: string;
  studentNumber: string;
  major: string;
  team: {
    name: string;
  } | null;
};

type StudentDetailDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  student: StudentDetailDialogStudent | null;
  triggerRef: RefObject<HTMLButtonElement | null>;
};

export default function StudentDetailDialog({
  isOpen,
  onClose,
  student,
  triggerRef,
}: StudentDetailDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;

    if (!isOpen || !dialog) return;

    dialog.showModal();
    closeButtonRef.current?.focus();

    return () => {
      if (dialog.open) dialog.close();
    };
  }, [isOpen]);

  if (!isOpen || !student) return null;

  function handleClose() {
    onClose();
    requestAnimationFrame(() => triggerRef.current?.focus());
  }

  return (
    <dialog
      aria-labelledby='student-detail-title'
      aria-modal='true'
      className={styles.dialog}
      onCancel={event => {
        event.preventDefault();
        handleClose();
      }}
      onKeyDown={event => {
        if (event.key !== 'Escape') return;

        event.preventDefault();
        handleClose();
      }}
      ref={dialogRef}
    >
      <Heading id='student-detail-title' level={2}>
        {student.name} 수강생 정보
      </Heading>
      <dl className={styles.detailList}>
        <div className={styles.detailRow}>
          <dt>이름</dt>
          <dd>{student.name}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>학번</dt>
          <dd>{student.studentNumber}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>전공</dt>
          <dd>{student.major}</dd>
        </div>
        <div className={styles.detailRow}>
          <dt>팀</dt>
          <dd>{student.team?.name ?? '미배정'}</dd>
        </div>
      </dl>
      <div className={styles.modalActions}>
        <Button
          label='닫기'
          onClick={handleClose}
          ref={closeButtonRef}
          variant='secondary'
        />
      </div>
    </dialog>
  );
}
