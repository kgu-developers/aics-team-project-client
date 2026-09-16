import type {
  SectionAnnouncementCreateRequest,
  SectionAnnouncementResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitSectionAnnouncement(
  sectionId: number,
  input: SectionAnnouncementCreateRequest,
) {
  const response = await apiClient.post<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(String(sectionId)),
    input,
  );
  return response.data;
}
