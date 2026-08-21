import { Button, Dialog, Heading, HStack } from '@aics/design-system';

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
};

export default function StudentDetailDialog({
  isOpen,
  onClose,
  student,
}: StudentDetailDialogProps) {
  return (
    <Dialog
      aria-label={student ? `${student.name} 수강생 정보` : '수강생 정보'}
      isOpen={isOpen && student !== null}
      onOpenChange={nextIsOpen => {
        if (!nextIsOpen) onClose();
      }}
      purpose='info'
      width={480}
    >
      {student ? (
        <>
          <Heading level={2}>{student.name} 수강생 정보</Heading>
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
          <HStack gap={2} justify='end'>
            <Button
              data-autofocus=''
              label='닫기'
              onClick={onClose}
              variant='secondary'
            />
          </HStack>
        </>
      ) : null}
    </Dialog>
  );
}
