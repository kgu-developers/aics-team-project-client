import type { CreateMeetingActionInput, MeetingAction } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitMeetingAction(
  meetingId: string,
  input: CreateMeetingActionInput,
): Promise<MeetingAction> {
  const response = await apiClient.post<MeetingAction>(
    ENDPOINTS.MEETING.RECORD_ACTIONS(meetingId),
    input,
  );
  return response.data;
}
