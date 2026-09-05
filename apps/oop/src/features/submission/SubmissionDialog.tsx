import { Dialog } from '@aics/design-system';

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
  const { closeDialog, milestoneId } = useSubmissionDialog();

  if (!milestoneId) return null;

  const copy = dialogCopy[milestoneId];

  return (
    <Dialog
      aria-label={copy.ariaLabel}
      isOpen
      onOpenChange={isOpen => {
        if (!isOpen) closeDialog();
      }}
      purpose='form'
    >
      <SubmissionFilePanel
        milestoneId={milestoneId}
        showCurrentFiles={false}
        title={copy.title}
      />
    </Dialog>
  );
}
