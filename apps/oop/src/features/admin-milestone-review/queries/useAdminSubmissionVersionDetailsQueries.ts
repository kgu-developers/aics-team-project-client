import { fetchAdminSubmissionVersion } from '@aics/api-client';
import { useQueries } from '@tanstack/react-query';

import { toAdminSubmissionVersionDetailView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

type SubmissionVersionTarget = {
  submissionId: string;
  version: number;
};

export function useAdminSubmissionVersionDetailsQueries(
  targets: SubmissionVersionTarget[],
  isEnabled: boolean,
) {
  return useQueries({
    queries: targets.map(target => ({
      enabled: isEnabled,
      queryKey: adminMilestoneSubmissionsKeys.version(
        target.submissionId,
        target.version,
      ),
      queryFn: async () =>
        toAdminSubmissionVersionDetailView(
          await fetchAdminSubmissionVersion(
            target.submissionId,
            target.version,
          ),
        ),
    })),
  });
}
