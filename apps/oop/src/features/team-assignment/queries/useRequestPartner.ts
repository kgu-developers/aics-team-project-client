import { requestPartner } from '@aics/api-client';
import { useMutation } from '@tanstack/react-query';

import { teamAssignmentQueryKey } from './teamAssignmentKeys';

export function useRequestPartner(sectionId: string) {
  return useMutation({
    mutationFn: (candidateId: string) => requestPartner(sectionId, candidateId),
    meta: { invalidates: teamAssignmentQueryKey(sectionId) },
  });
}
