import { completePresentationBlock } from '@aics/api-client';
import type { Presentation, PresentationBlockKey } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { presentationKeys } from './presentationKeys';

export function useCompletePresentationBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
    }: {
      documentId: string;
      version: number;
      blockKey: PresentationBlockKey;
    }) => completePresentationBlock(documentId, blockKey, { version }),
    onSuccess: presentation => {
      queryClient.setQueryData<Presentation>(
        presentationKeys.current(),
        presentation,
      );
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
