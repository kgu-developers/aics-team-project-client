import { completeMidReportBlock } from '@aics/api-client';
import type { MidReport, MidReportBlockKey } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';
import { studentHomeKeys } from '~/features/student-home/queries';

import { midReportKeys } from './midReportKeys';

export function useCompleteMidReportBlockMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore();
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
      if (useAuthStore.getState() !== session) return;
      queryClient.setQueryData<MidReport>(
        midReportKeys.current(session),
        report,
      );
      void queryClient.invalidateQueries({
        queryKey: studentHomeKeys.dashboards(),
      });
    },
  });
}
