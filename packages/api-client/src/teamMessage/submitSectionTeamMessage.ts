import type {
  SectionTeamMessagePersistResponse,
  SubmitSectionTeamMessageInput,
} from '@aics/core';

import { apiClient } from '../client';
import { validateTeamMessageId } from './teamMessageApiContract';
import { ENDPOINTS } from '../constants/endpoints';

export async function submitSectionTeamMessage(
  sectionId: string,
  input: SubmitSectionTeamMessageInput,
): Promise<SectionTeamMessagePersistResponse> {
  validateTeamMessageId(sectionId);
  const response = await apiClient.post<SectionTeamMessagePersistResponse>(
    ENDPOINTS.TEAM_MESSAGE.BY_SECTION(sectionId),
    input,
  );
  if (
    !Number.isSafeInteger(response.data.sentCount) ||
    response.data.sentCount < 0
  ) {
    throw new Error('전체 메시지 전송 결과를 확인할 수 없습니다.');
  }
  return response.data;
}
