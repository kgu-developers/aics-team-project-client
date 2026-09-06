import type {
  MeetingActionEntry,
  MeetingActionResponseDto,
  MeetingActionUpdateRequest,
} from '@aics/core';

import { apiClient } from '../client';
import { mapMeetingAction } from './meetingApiMapper';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateMeetingActionApi(
  actionId: string,
  input: MeetingActionUpdateRequest,
): Promise<MeetingActionEntry> {
  const response = await apiClient.patch<MeetingActionResponseDto>(
    ENDPOINTS.MEETING.ACTION(actionId),
    input,
  );

  return mapMeetingAction(response.data);
}
