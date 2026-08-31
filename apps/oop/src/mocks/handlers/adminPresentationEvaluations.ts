import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { adminMilestoneDeadlineFixtures } from '../data/adminMilestoneDeadlines';
import { adminMilestoneScheduleFixture } from '../data/adminMilestoneSchedule';
import {
  adminPresentationEvaluationsFixture,
  resetAdminPresentationEvaluationsFixture,
} from '../data/adminPresentationEvaluations';
import { adminTeamDashboardFixtures } from '../data/adminTeamDashboard';
import { demoAdminAccessToken } from '../data/users';

const initialDeadlineFixtures = structuredClone(adminMilestoneDeadlineFixtures);
const initialScheduleFixture = structuredClone(adminMilestoneScheduleFixture);
const initialTeamDashboardFixtures = structuredClone(
  adminTeamDashboardFixtures,
);

function updatePresentationEvaluationDeadline(endsAt: string) {
  adminMilestoneDeadlineFixtures['presentation-evaluate'] = endsAt.slice(0, 10);
  const deadlineLabel = endsAt.slice(0, 10);
  const scheduleSummary = `~${deadlineLabel.replaceAll('-', '/')}\n평가 완료`;

  adminMilestoneScheduleFixture.sections.forEach(section => {
    const milestone = section.milestones.find(
      item => item.id === 'presentation-evaluate',
    );
    if (milestone) milestone.summary = scheduleSummary;
  });

  adminTeamDashboardFixtures.forEach(teamDashboard => {
    const milestone = teamDashboard.milestones.find(
      item => item.id === 'presentation-evaluate',
    );
    if (milestone) milestone.deadlineLabel = deadlineLabel;
  });
}

function resetPresentationEvaluationScenario() {
  resetAdminPresentationEvaluationsFixture();
  Object.assign(adminMilestoneDeadlineFixtures, initialDeadlineFixtures);
  adminMilestoneScheduleFixture.sections = structuredClone(
    initialScheduleFixture.sections,
  );
  adminTeamDashboardFixtures.splice(
    0,
    adminTeamDashboardFixtures.length,
    ...structuredClone(initialTeamDashboardFixtures),
  );
}

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
      const expectedTeamIds = adminPresentationEvaluationsFixture.teams.map(
        team => team.teamId,
      );
      const submittedTeamIds = body.teams.map(team => team.teamId);
      const orders = body.teams.map(team => team.presentationOrder);
      const hasValidTeams =
        submittedTeamIds.length === expectedTeamIds.length &&
        new Set(submittedTeamIds).size === expectedTeamIds.length &&
        expectedTeamIds.every(teamId => submittedTeamIds.includes(teamId));
      const hasValidOrders =
        orders.every(order => Number.isInteger(order) && order > 0) &&
        new Set(orders).size === orders.length;
      const startsAtTime = Date.parse(body.startsAt);
      const endsAtTime = Date.parse(body.endsAt);

      if (
        !hasValidTeams ||
        !hasValidOrders ||
        Number.isNaN(startsAtTime) ||
        Number.isNaN(endsAtTime) ||
        startsAtTime >= endsAtTime
      ) {
        return HttpResponse.json(
          { message: '발표 순서 또는 평가 기간이 올바르지 않습니다.' },
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
      updatePresentationEvaluationDeadline(body.endsAt);
      return HttpResponse.json({ ok: true });
    },
  ),
];

export { resetPresentationEvaluationScenario };
