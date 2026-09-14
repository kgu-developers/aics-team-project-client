import { fetchProjectProposal } from '@aics/api-client';
import type { SubmitProposalFeedbackResponseInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';
import { teamMessageMutationOptions } from '~/features/team-message/queries';

export type SubmitProposalFeedbackResponseVariables =
  SubmitProposalFeedbackResponseInput;

export function useSubmitProposalFeedbackResponseMutation(teamId?: string) {
  const queryClient = useQueryClient();
  const options = teamMessageMutationOptions(queryClient, teamId);
  return useMutation({
    ...options,
    mutationFn: async (input: SubmitProposalFeedbackResponseVariables) => {
      if (!isValidPositiveTeamId(teamId)) {
        throw new Error('팀 배정 정보를 확인한 뒤 다시 시도해 주세요.');
      }
      if (!input.content.trim())
        throw new Error('메시지 내용을 입력해 주세요.');
      const document = await fetchProjectProposal(teamId);
      if (!document || String(document.teamId) !== teamId) {
        throw new Error('피드백 대상 문서를 확인할 수 없습니다.');
      }
      return options.mutationFn({
        message: input.content.trim(),
        relatedType: 'PROPOSAL',
        relatedId: document.id,
      });
    },
  });
}
