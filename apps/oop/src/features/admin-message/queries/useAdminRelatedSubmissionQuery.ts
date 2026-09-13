import {
  fetchAdminMilestoneSubmissions,
  fetchAdminSectionMilestones,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export type AdminMessageFeedbackType = 'PROPOSAL' | 'MID_REPORT';

export type AdminRelatedSubmission = {
  milestoneId: number;
  milestoneTitle: string;
  submissionId: number;
};

export function useAdminRelatedSubmissionQuery(
  sectionId: string | undefined,
  teamId: string | undefined,
  relatedType: AdminMessageFeedbackType | undefined,
) {
  const enabled = Boolean(sectionId && teamId && relatedType);

  return useQuery({
    enabled,
    queryKey:
      sectionId && teamId && relatedType
        ? adminMessageKeys.relatedSubmission(sectionId, teamId, relatedType)
        : ([
            ...adminMessageKeys.all,
            'related-submission',
            'disabled',
          ] as const),
    queryFn: async (): Promise<AdminRelatedSubmission | null> => {
      if (!sectionId || !teamId || !relatedType) {
        throw new Error('분반, 팀, 피드백 유형이 필요합니다.');
      }

      const milestones = await fetchAdminSectionMilestones(sectionId);
      const milestone = milestones.content.find(
        item => item.type === relatedType,
      );
      if (!milestone) return null;

      const submissions = await fetchAdminMilestoneSubmissions(
        String(milestone.id),
        teamId,
      );
      const submission = submissions.contents.find(
        item => String(item.teamId) === teamId,
      );
      if (!submission) return null;

      return {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        submissionId: submission.id,
      };
    },
  });
}
