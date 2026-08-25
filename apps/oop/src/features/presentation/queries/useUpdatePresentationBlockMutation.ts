import { updatePresentationBlock } from '@aics/api-client';
import type {
  Presentation,
  PresentationBlockKey,
  PresentationField,
} from '@aics/core';
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { presentationKeys } from './presentationKeys';

type UpdatePresentationBlockVariables = {
  documentId: string;
  version: number;
  blockKey: PresentationBlockKey;
  fields: PresentationField[];
};

export function useUpdatePresentationBlockMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      documentId,
      version,
      blockKey,
      fields,
    }: UpdatePresentationBlockVariables): Promise<Presentation> =>
      updatePresentationBlock(documentId, blockKey, { version, fields }),
    onSuccess: presentation => {
      queryClient.setQueryData(presentationKeys.current(), presentation);
    },
  });
}
