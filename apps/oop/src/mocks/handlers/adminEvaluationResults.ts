import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  adminPeerEvaluationDetailFixture,
  adminPeerEvaluationListFixture,
  adminPresentationEvaluationDetailFixture,
  adminPresentationEvaluationListFixture,
} from '../data/adminEvaluationResults';
import { demoAdmin } from '../data/users';

function isAdmin(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function isAccessibleSection(
  sectionId: string | readonly string[] | undefined,
) {
  return sectionId === '1' || sectionId === 'oop-2026-2-01';
}

function isKnownTeam(teamId: string | readonly string[] | undefined) {
  return teamId === '11';
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

export const adminEvaluationResultHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      return HttpResponse.json(adminPeerEvaluationListFixture);
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
      return HttpResponse.json(adminPeerEvaluationDetailFixture);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATIONS(':sectionId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      return HttpResponse.json(adminPresentationEvaluationListFixture);
    },
  ),
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PRESENTATION_EVALUATION_TEAM(':sectionId', ':teamId')}`,
    ({ params, request }) => {
      if (!isAdmin(request)) return unauthorized();
      if (!isAccessibleSection(params.sectionId)) return forbidden();
      if (!isKnownTeam(params.teamId)) {
        return HttpResponse.json(
          { message: '팀을 찾을 수 없습니다.' },
          { status: 404 },
        );
      }
      return HttpResponse.json(adminPresentationEvaluationDetailFixture);
    },
  ),
];
