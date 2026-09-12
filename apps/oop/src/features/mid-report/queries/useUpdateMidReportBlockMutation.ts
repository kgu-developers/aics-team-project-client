import { updateMidReportBlock } from '@aics/api-client';
import type { MidReport, MidReportBlockKey, MidReportField } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuthStore } from '~/features/auth/authStore';

import { midReportKeys } from './midReportKeys';

type UpdateMidReportBlockVariables = {
  documentId: string;
  version: number;
  blockKey: MidReportBlockKey;
  fields: MidReportField[];
};

export function useUpdateMidReportBlockMutation() {
  const queryClient = useQueryClient();
  const session = useAuthStore();

  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
      fields,
    }: UpdateMidReportBlockVariables): Promise<MidReport> =>
      updateMidReportBlock(documentId, blockKey, { version, fields }),
    onSuccess: report => {
      if (useAuthStore.getState() !== session) return;
      queryClient.setQueryData(midReportKeys.current(session), report);
    },
  });
}
