import { submitMidReport } from '@aics/api-client';
import type { MidReport } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { midReportKeys } from './midReportKeys';

export function useSubmitMidReportMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
    }: {
      documentId: string;
      version: number;
    }) => submitMidReport(documentId, { version }),
    onSuccess: report => {
      queryClient.setQueryData<MidReport>(midReportKeys.current(), report);
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
