import type {
  SectionAnnouncementResponse,
  UpdateSectionAnnouncementInput,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateSectionAnnouncement(
  announcementId: string | number,
  input: UpdateSectionAnnouncementInput,
): Promise<SectionAnnouncementResponse> {
  const { files = [], ...request } = input;
  const formData = new FormData();
  formData.append(
    'request',
    new Blob([JSON.stringify(request)], { type: 'application/json' }),
  );
  files.forEach(file => formData.append('files', file));
  const response = await apiClient.patch<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.DETAIL(announcementId),
    formData,
    // The shared client defaults to JSON. `false` removes that default so the
    // browser can add the multipart boundary for this FormData request.
    { headers: { 'Content-Type': false } },
  );

  return response.data;
}
