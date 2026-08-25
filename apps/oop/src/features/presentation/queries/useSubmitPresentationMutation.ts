import { submitPresentation } from '@aics/api-client';
import type { Presentation } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { presentationKeys } from './presentationKeys';

export function useSubmitPresentationMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
    }: {
      documentId: string;
      version: number;
    }) => submitPresentation(documentId, { version }),
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
