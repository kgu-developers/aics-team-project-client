import { updateMidReportBlock } from '@aics/api-client';
import type { MidReport, MidReportBlockKey, MidReportField } from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { midReportKeys } from './midReportKeys';

type UpdateMidReportBlockVariables = {
  documentId: string;
  version: number;
  blockKey: MidReportBlockKey;
  fields: MidReportField[];
};

export function useUpdateMidReportBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
      fields,
    }: UpdateMidReportBlockVariables): Promise<MidReport> =>
      updateMidReportBlock(documentId, blockKey, { version, fields }),
    onSuccess: report => {
      queryClient.setQueryData(midReportKeys.current(), report);
    },
  });
}
