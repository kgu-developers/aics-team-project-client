import { cancelPartnerRequest } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

export function useCancelPartnerRequest(sectionId: string) {
  return useMutation({
    mutationFn: (requestId: string) =>
      cancelPartnerRequest(sectionId, requestId),
    meta: { invalidates: teamAssignmentQueryKey(sectionId) },
  });
}
