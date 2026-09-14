import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  getAdminMilestoneSubmissionsFixture,
  resetAdminMilestoneSubmissionsFixture,
  updatePresentationOrderFixture,
} from '../data/adminMilestoneSubmissions';
import {
  adminPresentationEvaluationsFixture,
  resetAdminPresentationEvaluationsFixture,
} from '../data/adminPresentationEvaluations';
import {
  getAdminSectionMilestoneFixture,
  resetAdminSectionMilestonesFixture,
} from '../data/adminSectionMilestones';
import { demoAdmin } from '../data/users';

type TeamEvaluationCriterionRequest = {
  displayOrder: number;
  maxScore: number;
  title: string;
};

const initialCriteria = [
  { displayOrder: 0, id: 1, maxScore: 5, title: '프로젝트 완성도' },
  { displayOrder: 1, id: 2, maxScore: 5, title: '기능 구성과 구현' },
  { displayOrder: 2, id: 3, maxScore: 5, title: '발표 전달력' },
];
let criteria = structuredClone(initialCriteria);

function getTeamCriterionScore(
  team: (typeof adminPresentationEvaluationsFixture.teams)[number],
  criterion: (typeof initialCriteria)[number],
) {
  const legacyKey = ['completion', 'implementation', 'delivery'][
    criterion.displayOrder
  ];
  return (
    team.criteria[String(criterion.id)] ??
    (legacyKey ? team.criteria[legacyKey] : null) ??
    null
  );
}

function resetPresentationEvaluationScenario() {
  resetAdminMilestoneSubmissionsFixture();
  resetAdminPresentationEvaluationsFixture();
  resetAdminSectionMilestonesFixture();
  criteria = structuredClone(initialCriteria);
}

function isTeamEvaluationCriterionRequest(
  value: unknown,
): value is TeamEvaluationCriterionRequest {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;

  const body = value as Record<string, unknown>;
  const { displayOrder, maxScore, title } = body;
  return (
    typeof title === 'string' &&
    title.trim().length > 0 &&
    typeof maxScore === 'number' &&
    Number.isInteger(maxScore) &&
    maxScore > 0 &&
    typeof displayOrder === 'number' &&
    Number.isInteger(displayOrder) &&
    displayOrder >= 0
  );
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
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA(':sectionId')}`,
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

      return HttpResponse.json({ contents: structuredClone(criteria) });
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_TEAM_EVALUATION_CRITERIA(':sectionId')}`,
    async ({ params, request }) => {
      if (getMockAuthenticatedAccount(request)?.user.id !== demoAdmin.id) {
        return HttpResponse.json(
          { message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }
      if (params.sectionId !== adminPresentationEvaluationsFixture.section.id) {
        return HttpResponse.json(
          { message: '담당 분반만 생성할 수 있습니다.' },
          { status: 403 },
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        body = undefined;
      }
      if (!isTeamEvaluationCriterionRequest(body)) {
        return HttpResponse.json(
          { message: '평가 항목 입력값이 올바르지 않습니다.' },
          { status: 400 },
        );
      }

      const criterion = {
        ...body,
        id: Math.max(0, ...criteria.map(item => item.id)) + 1,
      };
      criteria = [...criteria, criterion].sort(
        (left, right) => left.displayOrder - right.displayOrder,
      );

      return HttpResponse.json({ id: criterion.id }, { status: 201 });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.SECTION_PRESENTATION_EVALUATION_TEAM(':sectionId', ':teamId')}`,
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

      const team = adminPresentationEvaluationsFixture.teams.find(
        candidate => String(candidate.teamId) === params.teamId,
      );
      if (!team) {
        return HttpResponse.json({ code: 'TEAM_NOT_FOUND' }, { status: 404 });
      }

      return HttpResponse.json({
        closesAt: adminPresentationEvaluationsFixture.evaluationPeriod.endsAt,
        criteria: criteria.map(criterion => ({
          criterionId: criterion.id,
          displayOrder: criterion.displayOrder,
          maxScore: criterion.maxScore,
          title: criterion.title,
        })),
        evaluations: [
          {
            evaluatorId: '20260001',
            evaluatorName: '테스트 평가자',
            isSubmitted: team.submittedEvaluatorCount > 0,
            submittedAt:
              team.submittedEvaluatorCount > 0 ? '2026-11-26T15:30:00' : null,
            teamName: 'OOP-01 - 2팀',
            scores: criteria.map(criterion => ({
              criterionId: criterion.id,
              criterionTitle: criterion.title,
              score: getTeamCriterionScore(team, criterion),
            })),
            totalScore:
              team.submittedEvaluatorCount > 0 &&
              criteria.every(criterion =>
                Number.isFinite(getTeamCriterionScore(team, criterion)),
              )
                ? criteria.reduce(
                    (sum, criterion) =>
                      sum + getTeamCriterionScore(team, criterion)!,
                    0,
                  )
                : null,
          },
        ],
        meetingRecords: [
          {
            id: 1,
            meetingAt: '2026-10-01T14:00:00',
            participantCount: 4,
            phase: 'MID_CHECK',
            title: `${team.teamName} 프로젝트 킥오프`,
          },
        ],
        milestoneId: 103,
        projectTitle: team.projectTopic,
        teamId: team.teamId,
        teamName: team.teamName,
      });
    },
  ),
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
        criteria: criteria.map(criterion => ({
          id: String(criterion.id),
          label: criterion.title,
        })),
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

      const expectedTeamIds = getAdminMilestoneSubmissionsFixture(
        String(params.milestoneId),
      )!.contents.map(team => team.teamId);
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
