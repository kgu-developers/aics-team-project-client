import {
  fetchAdminMilestoneSubmissions,
  fetchProjectProposal,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionsView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

export function useAdminMilestoneSubmissionsQuery(
  milestoneId: string | undefined,
  isEnabled: boolean,
  teamId?: string,
  isProposal = false,
) {
  return useQuery({
    enabled: Boolean(milestoneId) && isEnabled,
    queryKey: [
      ...adminMilestoneSubmissionsKeys.list(milestoneId ?? 'disabled', teamId),
      isProposal ? 'proposal-document' : 'submission',
    ],
    queryFn: async () => {
      if (!milestoneId) {
        throw new Error('마일스톤 ID가 필요합니다.');
      }

      const response = await fetchAdminMilestoneSubmissions(
        milestoneId,
        teamId,
      );
      const view = toAdminMilestoneSubmissionsView(response);
      if (!isProposal) return view;
      // Proposal completion belongs to Project. Generic Submission versions
      // are independent and cannot determine whether that document was submitted.
      const projects = await Promise.all(
        response.contents.map(item =>
          item.currentVersion > 0
            ? Promise.resolve(null)
            : fetchProjectProposal(String(item.teamId)),
        ),
      );
      return {
        ...view,
        submissions: view.submissions.map((item, index) => {
          if (item.currentVersion > 0) return item;
          const project = projects[index];
          return {
            ...item,
            projectTitle: project?.title ?? item.projectTitle,
            status: project?.proposalCompletedAt
              ? ('SUBMITTED' as const)
              : ('NOT_SUBMITTED' as const),
            statusLabel: project?.proposalCompletedAt ? '제출 완료' : '미제출',
            submissionId: project ? String(response.contents[index]!.id) : null,
          };
        }),
      };
    },
  });
}
