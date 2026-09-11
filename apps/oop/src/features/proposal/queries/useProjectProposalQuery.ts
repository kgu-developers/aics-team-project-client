import { fetchProjectProposal } from '@aics/api-client';
import { skipToken, useQuery } from '@tanstack/react-query';

import {
  useAuthStore,
  selectHasAuthenticatedSession,
} from '~/features/auth/authStore';

import {
  projectProposalKeys,
  validProposalTeamId,
} from './projectProposalKeys';
export function useProjectProposalQuery() {
  const session = useAuthStore();
  const teamId = session.currentUser?.teamId;
  const enabled =
    selectHasAuthenticatedSession(session) && validProposalTeamId(teamId);
  return useQuery({
    queryKey: [...projectProposalKeys.scope(session, teamId), 'document'],
    queryFn: enabled ? () => fetchProjectProposal(teamId) : skipToken,
    retry: false,
  });
}
