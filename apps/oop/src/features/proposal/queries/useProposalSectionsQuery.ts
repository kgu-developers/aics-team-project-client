import { fetchProposalSections } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
  selectHasAuthenticatedSession,
} from '~/features/auth/authStore';

import {
  projectProposalKeys,
  validProposalTeamId,
} from './projectProposalKeys';
export function useProposalSectionsQuery(projectId?: number) {
  const session = useAuthStore();
  return useQuery({
    queryKey: [
      ...projectProposalKeys.scope(session, session.currentUser?.teamId),
      'sections',
      projectId,
    ],
    queryFn:
      selectHasAuthenticatedSession(session) &&
      validProposalTeamId(session.currentUser?.teamId) &&
      projectId
        ? () => fetchProposalSections(projectId)
        : skipToken,
    retry: false,
  });
}
