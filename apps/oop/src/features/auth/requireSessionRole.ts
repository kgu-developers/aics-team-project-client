import type { AuthSessionRole, AuthSessionResponse } from '@aics/core';

export function requireSessionRole(
  response: AuthSessionResponse,
): AuthSessionRole {
  if (
    response.role === 'STUDENT' ||
    response.role === 'ADMIN' ||
    response.role === 'ASSISTANT'
  )
    return response.role;
  throw new Error('서버에서 사용자 역할을 확인하지 못했습니다.');
}
