import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminMilestoneScheduleMilestoneDto = {
  id: string;
  summary: string;
  title: string;
};

export type AdminMilestoneScheduleSectionDto = {
  memberCountLabel: string;
  milestones: AdminMilestoneScheduleMilestoneDto[];
  sectionId: string;
  sectionLabel: string;
  unreadMessageCountLabel: string;
};

export type AdminMilestoneScheduleResponse = {
  sections: AdminMilestoneScheduleSectionDto[];
};

export async function fetchAdminMilestoneSchedule(): Promise<AdminMilestoneScheduleResponse> {
  const response = await apiClient.get<AdminMilestoneScheduleResponse>(
    ENDPOINTS.ADMIN.MILESTONE_SCHEDULE,
  );

  return response.data;
}
