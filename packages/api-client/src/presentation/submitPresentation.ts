import type { Presentation, SubmitDocumentSessionInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitPresentation(
  presentationId: string,
  input: SubmitDocumentSessionInput,
): Promise<Presentation> {
  const response = await apiClient.post<Presentation>(
    ENDPOINTS.PRESENTATION.SUBMIT(presentationId),
    input,
  );
  return response.data;
}
