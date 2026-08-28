import type { SectionAnnouncement } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function fetchSectionAnnouncements(
  sectionId: string,
): Promise<SectionAnnouncement[]> {
  const response = await apiClient.get<SectionAnnouncement[]>(
    ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(sectionId),
  );

  return response.data;
}
