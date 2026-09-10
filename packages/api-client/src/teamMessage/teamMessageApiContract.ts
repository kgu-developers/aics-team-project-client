import type { TeamMessagePersistResponse } from '@aics/core';

export function validateTeamMessageId(id: string | number) {
  if (
    (typeof id === 'string' && !/^\d+$/.test(id)) ||
    !Number.isSafeInteger(Number(id)) ||
    Number(id) <= 0
  ) {
    throw new Error('메시지 관련 식별자를 정확하게 확인할 수 없습니다.');
  }
}

export function validateTeamMessageRelatedId(id: number) {
  if (!Number.isSafeInteger(id)) {
    throw new Error('메시지 관련 식별자를 정확하게 확인할 수 없습니다.');
  }
}

export function validateTeamMessageResponseIds(
  message: TeamMessagePersistResponse,
) {
  validateTeamMessageId(message.id);
  validateTeamMessageId(message.threadId);
  if (message.relatedId != null)
    validateTeamMessageRelatedId(message.relatedId);
}
