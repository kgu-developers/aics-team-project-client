import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { updatePresentationOrderFixture } from '../data/adminMilestoneSubmissions';
import {
  adminPresentationEvaluationsFixture,
  resetAdminPresentationEvaluationsFixture,
} from '../data/adminPresentationEvaluations';
import {
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import { demoAdmin } from '../data/users';

function resetPresentationEvaluationScenario() {
  resetAdminPresentationEvaluationsFixture();
  resetAdminSectionMilestonesFixture();
}

function getPresentationEvaluationPeriod() {
  const schedule = getAdminSectionMilestoneFixture(
    adminPresentationEvaluationsFixture.section.id,
    '103',
  )?.schedule;
  const startsAt = schedule?.evaluationOpensAt ?? schedule?.opensAt;
  const endsAt = schedule?.evaluationClosesAt ?? schedule?.dueAt;

  return startsAt && endsAt
    ? { endsAt, startsAt }
    : adminPresentationEvaluationsFixture.evaluationPeriod;
}

function isPresentationOrderRequest(
  value: unknown,
): value is { teamOrders: Array<{ teamId: number; order: number }> } {
  if (!value || typeof value !== 'object' || !('teamOrders' in value)) {
    return false;
  }

  const { teamOrders } = value;
  return (
    Array.isArray(teamOrders) &&
    teamOrders.every(
      team =>
        Boolean(team) &&
        typeof team === 'object' &&
        'teamId' in team &&
        'order' in team &&
        Number.isInteger(team.teamId) &&
        Number.isInteger(team.order),
    )
  );
}

export const adminPresentationEvaluationHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (getMockAuthenticatedAccount(request)?.user.id !== demoAdmin.id) {
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
      return HttpResponse.json({
        ...structuredClone(adminPresentationEvaluationsFixture),
        evaluationPeriod: getPresentationEvaluationPeriod(),
      });
    },
  ),
  http.patch(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.PRESENTATION_ORDER(':milestoneId')}`,
    async ({ params, request }) => {
      if (getMockAuthenticatedAccount(request)?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (params.milestoneId !== '103') {
        return HttpResponse.json(
          { message: '발표 평가 마일스톤을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
      if (!isPresentationOrderRequest(body)) {
        return HttpResponse.json(
          { message: '필수 설정이 없습니다.' },
          { status: 400 },
        );
      }

      const expectedTeamIds = adminPresentationEvaluationsFixture.teams.map(
        team => team.teamId,
      );
      const submittedTeamIds = body.teamOrders.map(team => team.teamId);
      const orders = body.teamOrders.map(team => team.order);
      const hasValidTeams =
        submittedTeamIds.length === expectedTeamIds.length &&
        new Set(submittedTeamIds).size === expectedTeamIds.length &&
        expectedTeamIds.every(teamId => submittedTeamIds.includes(teamId));
      const hasValidOrders =
        orders.every(order => Number.isInteger(order) && order > 0) &&
        new Set(orders).size === orders.length;

      if (!hasValidTeams || !hasValidOrders) {
        return HttpResponse.json(
          { message: '발표 순서가 올바르지 않습니다.' },
          { status: 400 },
        );
      }

      const teamOrders = new Map(
        body.teamOrders.map(team => [team.teamId, team.order]),
      );
      adminPresentationEvaluationsFixture.teams =
        adminPresentationEvaluationsFixture.teams.map(team => ({
          ...team,
          presentationOrder:
            teamOrders.get(team.teamId) ?? team.presentationOrder,
        }));
      updatePresentationOrderFixture(body.teamOrders);

      return new HttpResponse(null, { status: 204 });
    },
  ),
];

export { resetPresentationEvaluationScenario };
