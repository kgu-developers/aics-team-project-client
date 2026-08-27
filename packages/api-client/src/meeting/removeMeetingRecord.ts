import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeMeetingRecord(meetingId: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.MEETING.RECORD(meetingId));
}
