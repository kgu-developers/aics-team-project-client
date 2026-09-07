import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  getAdminSubmissionFixture,
  getAdminSubmissionVersionFixture,
  getAdminSubmissionVersionsFixture,
} from '../data/adminMilestoneSubmissionDetails';
import { demoAdmin } from '../data/users';

function requireAdmin(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function notFoundResponse() {
  return HttpResponse.json(
    { code: 'SUBMISSION_NOT_FOUND', message: '제출물을 찾을 수 없습니다.' },
    { status: 404 },
  );
}

export const adminMilestoneSubmissionDetailHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION(':submissionId')}`,
    ({ params, request }) => {
      if (!requireAdmin(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminSubmissionFixture(String(params.submissionId));
      return fixture ? HttpResponse.json(fixture) : notFoundResponse();
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_VERSIONS(':submissionId')}`,
    ({ params, request }) => {
      if (!requireAdmin(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminSubmissionVersionsFixture(
        String(params.submissionId),
      );
      return fixture ? HttpResponse.json(fixture) : notFoundResponse();
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SUBMISSION_VERSION(':submissionId', ':version')}`,
    ({ params, request }) => {
      if (!requireAdmin(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminSubmissionVersionFixture(
        String(params.submissionId),
        Number(params.version),
      );
      return fixture ? HttpResponse.json(fixture) : notFoundResponse();
    },
  ),
];
