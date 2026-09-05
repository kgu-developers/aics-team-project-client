import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthorization } from '../authSession';
import { getAdminMilestoneSubmissionsFixture } from '../data/adminMilestoneSubmissions';
import { demoAdminAccessToken } from '../data/users';

export const adminMilestoneSubmissionsHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_SUBMISSIONS(
      ':sectionId',
      ':milestoneId',
    )}`,
    ({ params, request }) => {
      const authorization = getMockAuthorization(request);

      if (authorization !== `Bearer ${demoAdminAccessToken}`) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const sectionId = String(params.sectionId);
      const milestoneId = String(params.milestoneId);

      if (sectionId !== 'oop-2026-2-01') {
        return HttpResponse.json(
          { code: 'FORBIDDEN', message: '담당 분반만 조회할 수 있습니다.' },
          { status: 403 },
        );
      }

      const fixture = getAdminMilestoneSubmissionsFixture(milestoneId);

      if (!fixture) {
        return HttpResponse.json(
          { code: 'NOT_FOUND', message: '마일스톤을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json(fixture);
    },
  ),
];
