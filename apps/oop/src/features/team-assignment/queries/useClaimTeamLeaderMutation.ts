import { claimTeamLeader } from '@aics/api-client';
import { useToast } from '@aics/design-system';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';

import { authKeys } from '~/features/auth/queries/authKeys';

import { teamKickoffQueryKey } from './teamAssignmentKeys';
import { isValidPositiveTeamId } from './useTeamMemberContactsQuery';

type ConfirmTeamLeaderVariables = {
  input: { teamId: string };
};

export function useClaimTeamLeaderMutation() {
  const queryClient = useQueryClient();
  const toast = useToast();

  const refreshTeam = async (teamId: string) => {
    await Promise.all([
      queryClient.invalidateQueries({
        queryKey: authKeys.currentUser(),
      }),
      queryClient.invalidateQueries({
        queryKey: teamKickoffQueryKey(teamId),
      }),
    ]);
  };

  return useMutation({
    mutationFn: ({ input }: ConfirmTeamLeaderVariables) => {
      if (!isValidPositiveTeamId(input.teamId)) {
        throw new Error('팀 ID를 확인할 수 없습니다.');
      }
      return claimTeamLeader(input);
    },
    onSuccess: (_result, { input }) => {
      toast({
        body: '팀장으로 확정되었어요.',
        uniqueID: 'team-leader-claim',
      });
      return refreshTeam(input.teamId);
    },
    onError: (error, { input }) => {
      if (isAxiosError(error) && error.response?.status === 409) {
        // The refreshed kickoff can unmount this flow and redirect to home.
        // Keep the conflict notice in the root viewport across that navigation.
        toast({
          body: '이미 팀장이 확정되어 신청하지 못했어요. 프로필에서 팀장을 확인해 주세요.',
          type: 'error',
          isAutoHide: false,
          uniqueID: 'team-leader-claim',
        });
        return refreshTeam(input.teamId);
      }
    },
  });
}
