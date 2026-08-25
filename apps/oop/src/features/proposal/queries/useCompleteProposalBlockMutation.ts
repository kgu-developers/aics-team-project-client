import { completeProposalBlock } from '@aics/api-client';
import type { Proposal, ProposalBlockKey } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { proposalKeys } from './proposalKeys';

export function useCompleteProposalBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
    }: {
      documentId: string;
      version: number;
      blockKey: ProposalBlockKey;
    }) => completeProposalBlock(documentId, blockKey, { version }),
    onSuccess: proposal => {
      queryClient.setQueryData<Proposal>(proposalKeys.current(), proposal);
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
