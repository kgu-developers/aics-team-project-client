import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthorization } from '../authSession';
import { getAdminMilestoneSubmissionDetailFixture } from '../data/adminMilestoneSubmissionDetails';
import { demoAdmin, demoAdminAccessToken } from '../data/users';

export const adminMilestoneSubmissionDetailHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.MILESTONE_SUBMISSION_DETAIL(':submissionId')}`,
    ({ params, request }) => {
      const authorization = getMockAuthorization(request);

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

      if (
        !demoAdmin.sections.some(section => section.id === fixture.section.id)
      ) {
        return HttpResponse.json(
          {
            code: 'FORBIDDEN',
            message: '담당 분반의 제출물만 조회할 수 있습니다.',
          },
          { status: 403 },
        );
      }

      return HttpResponse.json(fixture);
    },
  ),
];
