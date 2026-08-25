import type {
  Presentation,
  PresentationBlockKey,
  UpdatePresentationBlockInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updatePresentationBlock(
  presentationId: string,
  blockKey: PresentationBlockKey,
  input: UpdatePresentationBlockInput,
): Promise<Presentation> {
  const response = await apiClient.patch<Presentation>(
    ENDPOINTS.PRESENTATION.BLOCK(presentationId, blockKey),
    input,
  );
  return response.data;
}
