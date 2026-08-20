import { respondToPartnerRequest } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

type RespondToPartnerRequestVariables = {
  requestId: string;
  decision: 'approve' | 'reject';
};

export function useRespondToPartnerRequest(sectionId: string) {
  return useMutation({
    mutationFn: ({ decision, requestId }: RespondToPartnerRequestVariables) =>
      respondToPartnerRequest(sectionId, requestId, decision),
    meta: { invalidates: teamAssignmentQueryKey(sectionId) },
  });
}
