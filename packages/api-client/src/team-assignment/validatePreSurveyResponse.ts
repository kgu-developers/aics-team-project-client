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
  return response;
}
