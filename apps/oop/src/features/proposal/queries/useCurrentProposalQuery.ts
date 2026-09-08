import {
  fetchCurrentProposal,
  InvalidProposalResponseError,
} from '@aics/api-client';
import { useQuery } from '@tanstack/react-query';

import { proposalKeys } from './proposalKeys';

export function useCurrentProposalQuery(enabled: boolean) {
  return useQuery({
    enabled,
    queryKey: proposalKeys.current(),
    queryFn: fetchCurrentProposal,
    retry: (count, error) =>
      !(error instanceof InvalidProposalResponseError) && count < 3,
  });
}
