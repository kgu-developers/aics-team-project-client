import type {
  SectionAnnouncementUpdateRequest,
  SectionAnnouncementResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateSectionAnnouncement(
  id: number,
  input: SectionAnnouncementUpdateRequest,
) {
  const response = await apiClient.patch<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.DETAIL(String(id)),
    input,
  );
  return response.data;
}
