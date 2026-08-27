import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { adminMilestoneScheduleFixture } from '../data/adminMilestoneSchedule';
import { demoAdminAccessToken } from '../data/users';

export const adminMilestoneScheduleHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SCHEDULE}`,
    ({ request }) => {
      const authorization = request.headers.get('authorization');

      if (authorization !== `Bearer ${demoAdminAccessToken}`) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      return HttpResponse.json(adminMilestoneScheduleFixture);
    },
  ),
];
