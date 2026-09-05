import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { adminTeamDashboardFixtures } from '../data/adminTeamDashboard';
import { demoAdmin } from '../data/users';

export const adminTeamDashboardHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.TEAM_DASHBOARD(':teamId')}`,
    ({ params, request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const teamId = params.teamId;
      const teamDashboard = adminTeamDashboardFixtures.find(
        fixture => fixture.id === teamId,
      );

      if (!teamDashboard) {
        return HttpResponse.json(
          { code: 'TEAM_NOT_FOUND', message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      return HttpResponse.json(teamDashboard);
    },
  ),
];
