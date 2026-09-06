import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminMilestoneCreateInput,
  type AdminMilestoneUpdateInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createAdminSectionMilestoneFixture,
  getAdminSectionMilestoneFixture,
  getAdminSectionMilestonesFixture,
  updateAdminSectionMilestoneFixture,
  updateAdminSectionMilestoneFixtureStatus,
} from '../data/adminSectionMilestones';
import { demoAdmin } from '../data/users';

function isAdminRequest(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

export const adminSectionMilestoneHandlers = [
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONES(':sectionId')}`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const milestone = createAdminSectionMilestoneFixture(
        String(params.sectionId),
        (await request.json()) as AdminMilestoneCreateInput,
      );
      return milestone
        ? HttpResponse.json({ id: milestone.id }, { status: 201 })
        : HttpResponse.json(
            { code: 'SECTION_NOT_FOUND', message: '분반을 찾을 수 없습니다.' },
            { status: 404 },
          );
    },
  ),
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
  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE(':sectionId', ':milestoneId')}`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const milestone = updateAdminSectionMilestoneFixture(
        String(params.sectionId),
        String(params.milestoneId),
        (await request.json()) as AdminMilestoneUpdateInput,
      );
      return milestone
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json(
            {
              code: 'MILESTONE_NOT_FOUND',
              message: '마일스톤을 찾을 수 없습니다.',
            },
            { status: 404 },
          );
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_MILESTONE_STATUS(':sectionId', ':milestoneId')}`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const { status } = (await request.json()) as { status?: string };
      if (status !== 'DRAFT' && status !== 'PUBLISHED' && status !== 'CLOSED') {
        return HttpResponse.json(
          { code: 'INVALID_STATUS', message: '공개 상태가 올바르지 않습니다.' },
          { status: 400 },
        );
      }

      const milestone = updateAdminSectionMilestoneFixtureStatus(
        String(params.sectionId),
        String(params.milestoneId),
        status,
      );
      return milestone
        ? new HttpResponse(null, { status: 204 })
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
