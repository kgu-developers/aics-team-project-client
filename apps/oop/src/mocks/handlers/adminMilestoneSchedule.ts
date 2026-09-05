import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { adminMilestoneScheduleFixture } from '../data/adminMilestoneSchedule';
import { demoAdmin } from '../data/users';

export const adminMilestoneScheduleHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SCHEDULE}`,
    ({ request }) => {
      const account = getMockAuthenticatedAccount(request);

      if (account?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      return HttpResponse.json(adminMilestoneScheduleFixture);
    },
  ),
];
