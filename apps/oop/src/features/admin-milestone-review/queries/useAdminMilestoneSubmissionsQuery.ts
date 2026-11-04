import {
  fetchAdminMilestoneSubmissions,
  fetchProjectProposal,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { toAdminMilestoneSubmissionsView } from '../model';
import { adminMilestoneSubmissionsKeys } from './adminMilestoneSubmissionsKeys';

function hasSubmittedProposal(
  approvalStatus:
    | 'DRAFT'
    | 'PENDING'
    | 'REVISION_REQUESTED'
    | 'APPROVED'
    | 'REJECTED'
    | null
    | undefined,
  proposalCompletedAt: string | null | undefined,
) {
  return (
    Boolean(proposalCompletedAt) ||
    (approvalStatus !== undefined &&
      approvalStatus !== null &&
      approvalStatus !== 'DRAFT')
  );
}

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
      // Proposal approval state belongs to Project. A malformed or unavailable
      // project for one team must not hide every team's submission row.
      const projects = await Promise.allSettled(
        response.contents.map(item =>
          item.currentVersion > 0 && item.projectId != null
            ? Promise.resolve(null)
            : fetchProjectProposal(String(item.teamId)),
        ),
      );
      return {
        ...view,
        submissions: view.submissions.map((item, index) => {
          const projectResult = projects[index];
          if (
            projectResult?.status === 'rejected' &&
            item.submissionId === null
          ) {
            return {
              ...item,
              statusLabel: '제안서 확인 실패',
            };
          }
          const project =
            projectResult?.status === 'fulfilled' ? projectResult.value : null;

          if (!project && item.currentVersion > 0) return item;

          const sourceSubmissionId = response.contents[index]?.id;

          const submissionId =
            item.submissionId ??
            (project &&
            sourceSubmissionId !== undefined &&
            hasSubmittedProposal(
              project.approvalStatus,
              project.proposalCompletedAt,
            )
              ? String(sourceSubmissionId)
              : null);

          if (project?.approvalStatus === 'REVISION_REQUESTED') {
            return {
              ...item,
              projectId: String(project.id),
              projectTitle: project.title ?? item.projectTitle,
              proposalCompletedAt:
                project.proposalCompletedAt ?? item.proposalCompletedAt,
              status: 'REVISION_REQUESTED' as const,
              statusLabel: '수정 요청',
              submissionId,
            };
          }

          return {
            ...item,
            projectId: project ? String(project.id) : item.projectId,
            projectTitle: project?.title ?? item.projectTitle,
            proposalCompletedAt:
              project?.proposalCompletedAt ?? item.proposalCompletedAt,
            submissionId,
          };
        }),
      };
    },
  });
}
