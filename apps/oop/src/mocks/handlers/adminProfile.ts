import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getAdminProfile, updateAdminProfile } from '../data/adminProfile';

function guardAdmin(request: Request) {
  const account = getMockAuthenticatedAccount(request);

  if (!account) {
    return HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 });
  }

  if (account.user.globalRole === 'STUDENT') {
    return HttpResponse.json(
      { code: 'PROFILE_ACCESS_DENIED' },
      { status: 403 },
    );
  }

  return null;
}

export const adminProfileHandlers = [
  http.get(`${API_BASE_URL}${ENDPOINTS.PROFILE.ME}`, ({ request }) => {
    const errorResponse = guardAdmin(request);
    if (errorResponse) return errorResponse;

    return HttpResponse.json(getAdminProfile());
  }),
  http.patch(`${API_BASE_URL}${ENDPOINTS.PROFILE.ME}`, async ({ request }) => {
    const errorResponse = guardAdmin(request);
    if (errorResponse) return errorResponse;

    const input = (await request.json()) as { introduction?: string };
    if (typeof input.introduction !== 'string') {
      return HttpResponse.json(
        { code: 'INVALID_PROFILE_INPUT' },
        { status: 400 },
      );
    }

    return HttpResponse.json(
      updateAdminProfile({
        introduction: input.introduction,
      }),
    );
  }),
];
