import { apiClient } from '../client';
import type { AdminMidReportResponse } from './fetchAdminMidReport';
import { ENDPOINTS } from '../constants/endpoints';

export async function completeAdminMidReportFeedback(
  sectionId: string,
  teamId: string,
  version: number,
): Promise<AdminMidReportResponse> {
  const response = await apiClient.patch<AdminMidReportResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT_FEEDBACK_COMPLETE(
      sectionId,
      teamId,
    ),
    { version },
  );
  return response.data;
}
