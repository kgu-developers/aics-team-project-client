import {
  fetchAdminMilestoneSubmissions,
  fetchAdminMidReport,
  fetchAdminSectionMilestones,
  fetchProjectProposal,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { adminMessageKeys } from './adminMessageKeys';

export type AdminMessageFeedbackType = 'PROPOSAL' | 'MID_REPORT';

export type AdminRelatedSubmission = {
  milestoneId: number;
  milestoneTitle: string;
  /** Document ID required by the message contract, distinct from submissionId. */
  relatedId: number;
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

      const document =
        relatedType === 'PROPOSAL'
          ? await fetchProjectProposal(teamId)
          : await fetchAdminMidReport(sectionId, teamId);
      if (!document) return null;
      if (String(document.teamId) !== teamId) {
        throw new Error('현재 팀의 피드백 대상 문서를 확인할 수 없습니다.');
      }
      const relatedId = document.id;
      if (!relatedId) return null;

      return {
        milestoneId: milestone.id,
        milestoneTitle: milestone.title,
        relatedId,
        submissionId: submission.id,
      };
    },
  });
}
