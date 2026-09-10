import type { AdminSectionMilestoneDto } from '@aics/api-client';

import type {
  AdminMilestoneSubmissionView,
  AdminSubmissionVersionDetailView,
} from '~/features/admin-milestone-review/model';

export type TeamMilestoneProgress = {
  milestone: AdminSectionMilestoneDto;
  submission: AdminMilestoneSubmissionView | null;
  submissionState: 'error' | 'pending' | 'ready';
  version: AdminSubmissionVersionDetailView | null;
  versionState: 'error' | 'idle' | 'pending' | 'ready';
};
