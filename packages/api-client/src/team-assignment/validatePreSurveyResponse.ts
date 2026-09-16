import type { PreSurveyResponseDetailResponse } from '@aics/core';
export function validatePreSurveyResponse(
  response: PreSurveyResponseDetailResponse,
) {
  if (
    !response ||
    !Array.isArray(response.preferredRoles) ||
    !response.preferredRoles.every(role => typeof role === 'string')
  ) {
    throw new Error('사전 설문 역할 응답 형식이 올바르지 않습니다.');
  }
  if (
    response.preferredPeerUserId !== undefined &&
    response.preferredPeerUserId !== null &&
    typeof response.preferredPeerUserId !== 'string'
  ) {
    throw new Error('선호 학생 식별자 형식이 올바르지 않습니다.');
  }
  if (
    response.preferredPeerStatus !== undefined &&
    response.preferredPeerStatus !== null &&
    response.preferredPeerStatus !== 'PENDING' &&
    response.preferredPeerStatus !== 'ACCEPTED' &&
    response.preferredPeerStatus !== 'REJECTED'
  ) {
    throw new Error('선호 학생 요청 상태 형식이 올바르지 않습니다.');
  }
  return response;
}
