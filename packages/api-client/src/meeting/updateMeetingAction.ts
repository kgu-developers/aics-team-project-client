import type { MeetingAction, UpdateMeetingActionInput } from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMeetingAction(
  actionId: string,
  input: UpdateMeetingActionInput,
): Promise<MeetingAction> {
  const response = await apiClient.patch<MeetingAction>(
    ENDPOINTS.MEETING.ACTION(actionId),
    input,
  );

  return response.data;
}
