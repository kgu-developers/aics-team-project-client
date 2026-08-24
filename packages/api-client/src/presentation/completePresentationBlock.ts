import type {
  CompleteDocumentBlockInput,
  Presentation,
  PresentationBlockKey,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function completePresentationBlock(
  presentationId: string,
  blockKey: PresentationBlockKey,
  input: CompleteDocumentBlockInput,
): Promise<Presentation> {
  const response = await apiClient.post<Presentation>(
    ENDPOINTS.PRESENTATION.BLOCK_COMPLETION(presentationId, blockKey),
    input,
  );
  return response.data;
}
