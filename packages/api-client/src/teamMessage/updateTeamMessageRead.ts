import { apiClient } from '../client';
import { validateTeamMessageId } from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateTeamMessageRead(messageId: string | number) {
  validateTeamMessageId(messageId);
  await apiClient.patch(ENDPOINTS.TEAM_MESSAGE.READ(messageId));
}
