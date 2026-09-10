import { submitTeamMessage } from '@aics/api-client';
import type { SubmitTeamMessageInput } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { isValidPositiveTeamId } from '~/features/team-assignment/queries/useTeamMemberContactsQuery';

import { teamMessageKeys } from './teamMessageKeys';

export function useSubmitTeamMessageMutation(teamId?: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: SubmitTeamMessageInput) => {
      if (!isValidPositiveTeamId(teamId)) {
        throw new Error('팀 배정 정보를 확인한 뒤 다시 시도해 주세요.');
      }
      if (!input.message.trim()) {
        throw new Error('메시지 내용을 입력해 주세요.');
      }
      return submitTeamMessage(teamId, input);
    },
    retry: false,
    onMutate: () => ({ teamId }),
    onSuccess: (_message, _input, context) =>
      // Invalidate the mutation's team even if the active screen changes teams.
      queryClient.invalidateQueries({
        queryKey: teamMessageKeys.team(context?.teamId),
      }),
  });
}
