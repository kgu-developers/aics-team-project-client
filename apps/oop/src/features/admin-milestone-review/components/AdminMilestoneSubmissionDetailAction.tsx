import { Link } from '@tanstack/react-router';

import { ROUTES } from '~/app/constants/routes';

import * as styles from './AdminMilestoneSubmissionCard.css';

type AdminMilestoneSubmissionDetailActionProps = {
  milestoneId: string;
  sectionId: string | undefined;
  submissionId: string | null;
  unavailableReason?: string;
};

export function AdminMilestoneSubmissionDetailAction({
  milestoneId,
  sectionId,
  submissionId,
  unavailableReason,
}: AdminMilestoneSubmissionDetailActionProps) {
  if (!sectionId || !submissionId || unavailableReason) {
    return (
      <button
        aria-label={
          unavailableReason ? `상세보기: ${unavailableReason}` : undefined
        }
        className={`${styles.detailLink} ${styles.detailButtonDisabled}`}
        disabled
        title={unavailableReason}
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

export function AdminMilestoneSubmissionBulkDownloadAction({
  href,
  label = '일괄 다운로드',
  onClick,
}: {
  href?: string;
  label?: string;
  onClick?: () => void;
}) {
  if (href) {
    return (
      <a className={styles.detailLink} href={href} onClick={onClick}>
        {label}
      </a>
    );
  }

  return (
    <button
      className={`${styles.detailLink} ${styles.detailButtonDisabled}`}
      disabled
      onClick={onClick}
      type='button'
    >
      {label}
    </button>
  );
}
