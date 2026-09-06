import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  getAdminSectionMilestoneFixture,
  getAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import { demoAdmin } from '../data/users';

function isAdminRequest(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

export const adminSectionMilestoneHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(':sectionId')}`,
    ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminSectionMilestonesFixture(
        String(params.sectionId),
      );
      return fixture
        ? HttpResponse.json(fixture)
        : HttpResponse.json(
            { code: 'SECTION_NOT_FOUND', message: '분반을 찾을 수 없습니다.' },
            { status: 404 },
          );
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE(':sectionId', ':milestoneId')}`,
    ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const fixture = getAdminSectionMilestoneFixture(
        String(params.sectionId),
        String(params.milestoneId),
      );
      return fixture
        ? HttpResponse.json(fixture)
        : HttpResponse.json(
            {
              code: 'MILESTONE_NOT_FOUND',
              message: '마일스톤을 찾을 수 없습니다.',
            },
            { status: 404 },
          );
    },
  ),
];
