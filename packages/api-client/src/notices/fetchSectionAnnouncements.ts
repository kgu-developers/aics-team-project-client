import type {
  SectionAnnouncement,
  SectionAnnouncementListResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchSectionAnnouncements(
  sectionId: number,
): Promise<SectionAnnouncement[]> {
  const response = await apiClient.get<SectionAnnouncementListResponse>(
    ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(String(sectionId)),
  );

  return response.data.contents;
}
