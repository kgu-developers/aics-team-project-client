import { apiClient } from '../client';
import { validateTeamMessageId } from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function updateTeamMessageImportant(
  messageId: string | number,
  important: boolean,
) {
  validateTeamMessageId(messageId);
  await apiClient.patch(ENDPOINTS.TEAM_MESSAGE.IMPORTANT(messageId), {
    important,
  });
}
