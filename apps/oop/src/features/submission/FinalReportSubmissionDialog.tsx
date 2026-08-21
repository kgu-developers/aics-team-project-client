import { Dialog } from '@aics/design-system';

import { useFinalReportSubmissionDialog } from './FinalReportSubmissionDialogContext';
import SubmissionFilePanel from './SubmissionFilePanel';

export default function FinalReportSubmissionDialog() {
  const { isOpen, setIsOpen } = useFinalReportSubmissionDialog();

  return (
    <Dialog
      aria-label='최종 파일 제출'
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      purpose='form'
    >
      <SubmissionFilePanel
        milestoneId='final-report'
        showCurrentFiles={false}
        title='최종 파일 제출'
      />
    </Dialog>
  );
}
