import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getAdminMilestoneSubmissionDetailFixture } from '../data/adminMilestoneSubmissionDetails';
import { demoAdminAccessToken } from '../data/users';

export const adminMilestoneSubmissionDetailHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL(':submissionId')}`,
    ({ params, request }) => {
      const authorization = request.headers.get('authorization');

      if (authorization !== `Bearer ${demoAdminAccessToken}`) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminMilestoneSubmissionDetailFixture(
        String(params.submissionId),
      );

      if (!fixture) {
        return HttpResponse.json(
          {
            code: 'SUBMISSION_NOT_FOUND',
            message: '제출물을 찾을 수 없습니다.',
          },
          { status: 404 },
        );
      }

      return HttpResponse.json(fixture);
    },
  ),
];
