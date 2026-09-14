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
  const response = await apiClient.patch<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.DETAIL(announcementId),
    input,
  );

  return response.data;
}
