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
  const response = await apiClient.post<SectionAnnouncementResponse>(
    ENDPOINTS.ANNOUNCEMENTS.SECTION_LIST(String(sectionId)),
    input,
  );

  return response.data;
}
