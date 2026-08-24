import { updateProposalBlock } from '@aics/api-client';
import type { Proposal, ProposalBlockKey, ProposalField } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { proposalKeys } from './proposalKeys';

type UpdateProposalBlockVariables = {
  documentId: string;
  version: number;
  blockKey: ProposalBlockKey;
  fields: ProposalField[];
};

export function useUpdateProposalBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
      fields,
    }: UpdateProposalBlockVariables): Promise<Proposal> =>
      updateProposalBlock(documentId, blockKey, { version, fields }),
    onSuccess: proposal => {
      queryClient.setQueryData(proposalKeys.current(), proposal);
    },
  });
}
