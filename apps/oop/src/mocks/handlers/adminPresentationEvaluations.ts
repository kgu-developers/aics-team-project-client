import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { adminPresentationEvaluationsFixture } from '../data/adminPresentationEvaluations';
import { demoAdminAccessToken } from '../data/users';

export const adminPresentationEvaluationHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (
        request.headers.get('authorization') !==
        `Bearer ${demoAdminAccessToken}`
      ) {
        return HttpResponse.json(
          { message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (params.sectionId !== adminPresentationEvaluationsFixture.section.id) {
        return HttpResponse.json(
          { message: '담당 분반만 조회할 수 있습니다.' },
          { status: 403 },
        );
      }
      return HttpResponse.json(
        structuredClone(adminPresentationEvaluationsFixture),
      );
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATION_SETTINGS(':sectionId')}`,
    async ({ params, request }) => {
      if (
        request.headers.get('authorization') !==
        `Bearer ${demoAdminAccessToken}`
      ) {
        return HttpResponse.json(
          { message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (params.sectionId !== adminPresentationEvaluationsFixture.section.id) {
        return HttpResponse.json(
          { message: '담당 분반만 수정할 수 있습니다.' },
          { status: 403 },
        );
      }
      const body = (await request.json()) as {
        teams?: Array<{ teamId: string; presentationOrder: number }>;
        startsAt?: string;
        endsAt?: string;
      };
      if (!body.teams || !body.startsAt || !body.endsAt) {
        return HttpResponse.json(
          { message: '필수 설정이 없습니다.' },
          { status: 400 },
        );
      }
      const teamOrders = new Map(
        body.teams.map(team => [team.teamId, team.presentationOrder]),
      );
      adminPresentationEvaluationsFixture.evaluationPeriod = {
        startsAt: body.startsAt,
        endsAt: body.endsAt,
      };
      adminPresentationEvaluationsFixture.teams =
        adminPresentationEvaluationsFixture.teams.map(team => ({
          ...team,
          presentationOrder:
            teamOrders.get(team.teamId) ?? team.presentationOrder,
        }));
      return HttpResponse.json({ ok: true });
    },
  ),
];
