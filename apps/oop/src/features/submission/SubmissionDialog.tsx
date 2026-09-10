import { Dialog, EmptyState } from '@aics/design-system';

import FinalReportSubmissionPanel from './FinalReportSubmissionPanel';
import * as styles from './SubmissionDialog.css';
import {
  type SubmissionDialogMilestoneId,
  useSubmissionDialog,
} from './SubmissionDialogContext';
import SubmissionFilePanel from './SubmissionFilePanel';

const dialogCopy: Record<
  SubmissionDialogMilestoneId,
  { ariaLabel: string; title: string }
> = {
  presentation: {
    ariaLabel: '발표 자료 제출',
    title: '발표 자료 제출',
  },
  'final-report': {
    ariaLabel: '최종 파일 제출',
    title: '최종 파일 제출',
  },
};

export default function SubmissionDialog() {
  const { closeDialog, milestoneId, target } = useSubmissionDialog();

  if (!milestoneId) return null;

  const copy = dialogCopy[milestoneId];

  return (
    <Dialog
      aria-label={copy.ariaLabel}
      isOpen
      width='min(640px, calc(100vw - 32px))'
      maxHeight='calc(100dvh - 48px)'
      padding={0}
      onOpenChange={isOpen => {
        if (!isOpen) closeDialog();
      }}
      purpose='form'
    >
      <div className={styles.content}>
        {milestoneId === 'final-report' ? (
          target ? (
            <FinalReportSubmissionPanel
              key={`${target.studentNumber}:${target.sectionId}:${target.teamId}:${target.milestoneId}`}
              target={target}
            />
          ) : (
            <EmptyState title='최종보고서 제출 대상을 확인할 수 없어요.' />
          )
        ) : (
          <SubmissionFilePanel
            milestoneId={milestoneId}
            showCurrentFiles={false}
            title={copy.title}
          />
        )}
      </div>
    </Dialog>
  );
}
