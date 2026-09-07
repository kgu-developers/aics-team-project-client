import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getAdminMilestoneSubmissionsFixture } from '../data/adminMilestoneSubmissions';
import { demoAdmin } from '../data/users';

export const adminMilestoneSubmissionsHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSIONS(':milestoneId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const milestoneId = String(params.milestoneId);

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
