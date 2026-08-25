import { submitProposal } from '@aics/api-client';
import type { Proposal } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { proposalKeys } from './proposalKeys';

export function useSubmitProposalMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
    }: {
      documentId: string;
      version: number;
    }) => submitProposal(documentId, { version }),
    onSuccess: proposal => {
      queryClient.setQueryData<Proposal>(proposalKeys.current(), proposal);
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
