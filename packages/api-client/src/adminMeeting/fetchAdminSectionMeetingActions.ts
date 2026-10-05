import type { MeetingActionStatus } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export type AdminSectionMeetingAction = {
  assigneeId: string | null;
  assigneeName: string | null;
  content: string;
  createdAt: string;
  dueAt: string | null;
  id: number;
  meetingAt: string;
  meetingRecordId: number;
  meetingRecordTitle: string;
  status: MeetingActionStatus;
  teamId: number;
  teamName: string;
  updatedAt: string;
};

export type AdminSectionMeetingActionsFilter = {
  meetingRecordId?: number | string;
  page?: number;
  size?: number;
  status?: MeetingActionStatus;
  teamId?: number | string;
};

export type AdminSectionMeetingActionsResponse = {
  contents: AdminSectionMeetingAction[];
  pageable: {
    isEnd: boolean;
    page: number;
    size: number;
    totalElements: number;
    totalPages: number;
  };
};

export async function fetchAdminSectionMeetingActions(
  sectionId: string | number,
  filter: AdminSectionMeetingActionsFilter = {},
): Promise<AdminSectionMeetingActionsResponse> {
  const response = await apiClient.get<AdminSectionMeetingActionsResponse>(
    ENDPOINTS.ADMIN.SECTION_MEETING_ACTIONS(sectionId),
    { params: filter },
  );

  return response.data;
}
