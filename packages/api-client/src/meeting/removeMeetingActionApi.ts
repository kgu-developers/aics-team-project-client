import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export async function removeMeetingActionApi(actionId: string): Promise<void> {
  await apiClient.delete(ENDPOINTS.MEETING.ACTION(actionId));
}
