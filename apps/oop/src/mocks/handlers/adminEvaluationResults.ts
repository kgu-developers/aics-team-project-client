import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { getAdminSectionTeamsResponse } from './adminStudentTeams';
import {
  adminPeerEvaluationDetailFixture,
  adminPeerEvaluationListFixture,
  adminPeerEvaluationTeamTwoDetailFixture,
  adminPresentationEvaluationDetailFixture,
  adminPresentationEvaluationListFixture,
  adminPresentationEvaluationTeamTwoDetailFixture,
} from '../data/adminEvaluationResults';
import { getAdminSection } from '../data/adminSections';
import { demoAdmin } from '../data/users';

function isAdmin(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function isAccessibleSection(
  sectionId: string | readonly string[] | undefined,
) {
  if (typeof sectionId !== 'string') return false;
  if (sectionId === '1' || sectionId === 'oop-2026-2-01') return true;
  const numericSectionId = Number(sectionId);
  return (
    Number.isSafeInteger(numericSectionId) &&
    Boolean(getAdminSection(numericSectionId))
  );
}

function isKnownTeam(teamId: string | readonly string[] | undefined) {
  return teamId === '1' || teamId === '2';
}

function unauthorized() {
  return HttpResponse.json(
    { message: '관리자 로그인이 필요합니다.' },
    { status: 401 },
  );
}

function forbidden() {
  return HttpResponse.json(
    { message: '담당 분반만 조회할 수 있습니다.' },
    { status: 403 },
  );
}

function withLeaderNames<T extends { teamId: number }>(
  sectionId: string,
  teams: readonly T[],
) {
  const leaderNameByTeamId = new Map(
    getAdminSectionTeamsResponse(sectionId).contents.map(team => [
      team.id,
      team.leaderName ?? null,
    ]),
  );

  return teams.map(team => ({
    ...team,
    leaderName: leaderNameByTeamId.get(team.teamId) ?? null,
  }));
}

export const adminEvaluationResultHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      return HttpResponse.json({
        ...adminPeerEvaluationListFixture,
        teams: withLeaderNames(
          String(params.sectionId),
          adminPeerEvaluationListFixture.teams,
        ),
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_TEAM(':sectionId', ':teamId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      if (!isKnownTeam(params.teamId)) {
        return HttpResponse.json(
          { message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      return HttpResponse.json(
        params.teamId === '2'
          ? adminPeerEvaluationTeamTwoDetailFixture
          : adminPeerEvaluationDetailFixture,
      );
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      const sectionId = String(params.sectionId);
      if (sectionId === '1' || sectionId === 'oop-2026-2-01') {
        return HttpResponse.json({
          ...adminPresentationEvaluationListFixture,
          teams: withLeaderNames(
            sectionId,
            adminPresentationEvaluationListFixture.teams,
          ),
        });
      }
      const milestoneId = Number(
        new URL(request.url).searchParams.get('milestoneId'),
      );
      const criteria = structuredClone(
        adminPresentationEvaluationListFixture.criteria,
      );
      return HttpResponse.json({
        closesAt: null,
        criteria,
        milestoneId: Number.isSafeInteger(milestoneId) ? milestoneId : 0,
        milestoneTitle: '발표 평가',
        sectionId: Number(sectionId) || 0,
        teams: getAdminSectionTeamsResponse(sectionId).contents.map(team => ({
          evaluationCount: 0,
          leaderName: team.leaderName ?? null,
          projectTitle: null,
          scores: criteria.map(criterion => ({
            criterionId: criterion.criterionId,
            criterionTitle: criterion.title,
            score: null,
          })),
          teamId: team.id,
          teamName: team.name,
          totalScore: null,
        })),
      });
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_TEAM(':sectionId', ':teamId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      const sectionId = String(params.sectionId);
      if (sectionId === '1' || sectionId === 'oop-2026-2-01') {
        if (!isKnownTeam(params.teamId)) {
          return HttpResponse.json(
            { message: '팀을 찾을 수 없습니다.' },
            { status: 404 },
          );
        }
        return HttpResponse.json(
          params.teamId === '2'
            ? adminPresentationEvaluationTeamTwoDetailFixture
            : adminPresentationEvaluationDetailFixture,
        );
      }

      const teamId = Number(params.teamId);
      const team = getAdminSectionTeamsResponse(sectionId).contents.find(
        item => item.id === teamId,
      );
      if (!team) {
        return HttpResponse.json(
          { message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      const milestoneId = Number(
        new URL(request.url).searchParams.get('milestoneId'),
      );
      return HttpResponse.json({
        closesAt: null,
        criteria: structuredClone(
          adminPresentationEvaluationListFixture.criteria,
        ),
        evaluations: [],
        meetingRecords: [],
        milestoneId: Number.isSafeInteger(milestoneId) ? milestoneId : 0,
        projectTitle: null,
        teamId: team.id,
        teamName: team.name,
      });
    },
  ),
];
