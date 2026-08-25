import { completeMidReportBlock } from '@aics/api-client';
import type { MidReport, MidReportBlockKey } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentHomeKeys } from '~/features/student-home/queries';

import { midReportKeys } from './midReportKeys';

export function useCompleteMidReportBlockMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
    }: {
      documentId: string;
      version: number;
      blockKey: MidReportBlockKey;
    }) => completeMidReportBlock(documentId, blockKey, { version }),
    onSuccess: report => {
      queryClient.setQueryData<MidReport>(midReportKeys.current(), report);
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
