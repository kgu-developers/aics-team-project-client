import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { adminPreSurveyResponsesBySection } from '../data/adminPreSurveyResponses';
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
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES(':sectionId')}`,
    ({ params, request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;

      const sectionId = String(params.sectionId);

      return HttpResponse.json({
        contents: adminPreSurveyResponsesBySection[sectionId] ?? [],
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRE_SURVEY_RESPONSES_DOWNLOAD(':sectionId')}`,
    async ({ request }) => {
      const errorResponse = guardAdmin(request);
      if (errorResponse) return errorResponse;

      const workbook =
        import.meta.env.MODE === 'test'
          ? new Uint8Array([0x50, 0x4b, 0x03, 0x04]).buffer
          : await (await fetch('/pre-survey-responses.xlsx')).arrayBuffer();

      return HttpResponse.arrayBuffer(workbook, {
        headers: {
          'Cache-Control': 'no-store',
          'Content-Disposition':
            "attachment; filename*=UTF-8''%EA%B0%9D%EC%B2%B4%EC%A7%80%ED%96%A5%ED%94%84%EB%A1%9C%EA%B7%B8%EB%9E%98%EB%B0%8D%2001-%EC%82%AC%EC%A0%84%EC%A1%B0%EC%82%AC.xlsx",
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        },
      });
    },
  ),
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
