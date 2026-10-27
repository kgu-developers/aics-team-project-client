import type {
  CreateSectionAnnouncementInput,
  SectionAnnouncementResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitSectionAnnouncement(
  sectionId: string | number,
  input: CreateSectionAnnouncementInput,
): Promise<SectionAnnouncementResponse> {
  const { files = [], ...request } = input;
  const formData = new FormData();
  formData.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  );
  files.forEach(file => formData.append('files', file));
  const response = await apiClient.post<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(String(sectionId)),
    formData,
    // The shared client defaults to JSON. `false` removes that default so the
    // browser can add the multipart boundary for this FormData request.
    { headers: { 'Content-Type': false } },
  );

  return response.data;
}
