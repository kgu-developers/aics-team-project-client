import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMidReportBlockDto = {
  fields: unknown;
  key: string;
  lastEditedBy: string | null;
  lastEditedByName: string | null;
  lastSavedAt: string | null;
  status: string;
  title: string;
};

export type AdminMidReportRevisionDto = {
  affectedBlockKeys: string[];
  changedBlockKeys: string[];
  requestedAt: string | null;
  resubmittedAt: string | null;
} | null;

export type AdminMidReportResponse = {
  blocks: AdminMidReportBlockDto[];
  dueDate: string | null;
  id: number;
  leaderName: string | null;
  milestoneId: number;
  revision: AdminMidReportRevisionDto;
  status: string;
  submittedAt: string | null;
  submittedBy: string | null;
  submittedByName: string | null;
  teamId: number;
  teamName: string;
  title: string;
  version: number;
};

export async function fetchAdminMidReport(
  sectionId: string | number,
  teamId: string | number,
): Promise<AdminMidReportResponse> {
  const response = await apiClient.get<AdminMidReportResponse>(
    ENDPOINTS.ADMIN.SECTION_TEAM_MID_REPORT(sectionId, teamId),
  );

  return response.data;
}
