import type {
  SubmitTeamMessageInput,
  TeamMessagePersistResponse,
} from '@aics/core';

import { apiClient } from '../client';
import {
  validateTeamMessageId,
  validateTeamMessageRelatedId,
  validateTeamMessageResponseIds,
} from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitTeamMessage(
  teamId: string,
  input: SubmitTeamMessageInput,
): Promise<TeamMessagePersistResponse> {
  validateTeamMessageId(teamId);
  if (input.relatedId != null) validateTeamMessageRelatedId(input.relatedId);
  const response = await apiClient.post<TeamMessagePersistResponse>(
    ENDPOINTS.TEAM_MESSAGE.BY_TEAM(teamId),
    input,
  );
  validateTeamMessageResponseIds(response.data);
  return response.data;
}
