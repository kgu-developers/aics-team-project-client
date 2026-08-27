import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminMilestoneSubmissionCard.css';

type AdminMilestoneSubmissionDetailActionProps = {
  milestoneId: string;
  sectionId: string | undefined;
  submissionId: string | null;
};

export function AdminMilestoneSubmissionDetailAction({
  milestoneId,
  sectionId,
  submissionId,
}: AdminMilestoneSubmissionDetailActionProps) {
  if (!sectionId || !submissionId) {
    return (
      <button
        className={`${styles.detailLink} ${styles.detailButtonDisabled}`}
        disabled
        type='button'
      >
        상세보기
      </button>
    );
  }

  return (
    <Link
      className={styles.detailLink}
      params={{ submissionId }}
      search={{ milestoneId, sectionId }}
      to={ROUTES.ADMIN_SUBMISSION_DETAIL}
    >
      상세보기
    </Link>
  );
}

export function AdminMilestoneSubmissionBulkDownloadAction() {
  return (
    <button
      className={`${styles.detailLink} ${styles.detailButtonDisabled}`}
      disabled
      type='button'
    >
      일괄 다운로드
    </button>
  );
}
