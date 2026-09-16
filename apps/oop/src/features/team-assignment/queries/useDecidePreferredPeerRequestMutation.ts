import {
  acceptPreferredPeerRequest,
  rejectPreferredPeerRequest,
} from '@aics/api-client';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { livePreSurveyProjectionQueryKey } from './teamAssignmentKeys';

type Variables = {
  decision: 'approve' | 'reject';
  requesterUserId: string;
};

export function useDecidePreferredPeerRequestMutation(sectionId: number) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ decision, requesterUserId }: Variables) =>
      decision === 'approve'
        ? acceptPreferredPeerRequest(sectionId, requesterUserId)
        : rejectPreferredPeerRequest(sectionId, requesterUserId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({
        queryKey: livePreSurveyProjectionQueryKey(sectionId),
      });
    },
  });
}
