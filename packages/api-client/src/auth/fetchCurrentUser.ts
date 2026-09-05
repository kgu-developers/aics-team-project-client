import type {
  AuthSessionRole,
  CurrentUser,
  CurrentUserResponse,
} from '@aics/core';

import { apiClient } from '../client';
import { ENDPOINTS } from '../constants/endpoints';

export function mapCurrentUserResponse(
  response: CurrentUserResponse,
  role: AuthSessionRole,
): CurrentUser {
  const hasCompatibleRole =
    (response.globalRole === 'ADMIN' && role === 'ADMIN') ||
    (response.globalRole === 'USER' &&
      (role === 'STUDENT' || role === 'ASSISTANT'));

  if (!hasCompatibleRole) {
    throw new Error('사용자 정보와 로그인 역할이 일치하지 않습니다.');
  }

  const globalRole = role === 'ADMIN' ? 'PROFESSOR' : role;
  return {
    id: response.studentNumber,
    studentNumber: response.studentNumber,
    name: response.name,
    email: response.email,
    globalRole,
    sections: (response.sections ?? []).map(section => ({
      id: String(section.id),
      code: section.code,
      name: section.name,
      role: globalRole,
    })),
    teamId: response.teamId == null ? null : String(response.teamId),
    currentTeam: null,
  };
}

export async function fetchCurrentUser(
  role: AuthSessionRole,
): Promise<CurrentUser> {
  const response = await apiClient.get<CurrentUserResponse>(ENDPOINTS.USER.ME);
  return mapCurrentUserResponse(response.data, role);
}
