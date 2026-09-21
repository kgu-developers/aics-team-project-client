import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { createAdminPeerEvaluationFormFixture } from '../data/adminSectionMilestones';
import { demoAdmin } from '../data/users';

let nextPeerEvaluationFormId = 1;

function isAdminRequest(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function invalidRequest() {
  return HttpResponse.json(
    {
      code: 'INVALID_REQUEST',
      message: '상호평가 양식 입력값이 올바르지 않습니다.',
    },
    { status: 400 },
  );
}

export function resetAdminPeerEvaluationFormsFixture() {
  nextPeerEvaluationFormId = 1;
}

export const adminPeerEvaluationFormHandlers = [
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM(':sectionId')}`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return invalidRequest();
      }
      if (!body || typeof body !== 'object' || Array.isArray(body)) {
        return invalidRequest();
      }

      const input = body as Partial<AdminPeerEvaluationFormCreateInput>;
      if (
        typeof input.milestoneId !== 'number' ||
        input.milestoneId < 1 ||
        typeof input.opensAt !== 'string' ||
        !input.opensAt ||
        typeof input.closesAt !== 'string' ||
        !input.closesAt ||
        typeof input.anonymous !== 'boolean' ||
        input.opensAt >= input.closesAt
      ) {
        return invalidRequest();
      }

      const id = nextPeerEvaluationFormId++;
      const result = createAdminPeerEvaluationFormFixture(
        String(params.sectionId),
        id,
        input as AdminPeerEvaluationFormCreateInput,
      );
      if ('form' in result) return HttpResponse.json({ id }, { status: 201 });
      if (result.error === 'PEER_EVALUATION_FORM_ALREADY_EXISTS') {
        return HttpResponse.json(
          {
            code: result.error,
            message: '이미 상호평가 양식이 존재합니다.',
          },
          { status: 409 },
        );
      }
      return HttpResponse.json(
        {
          code: result.error,
          message: '상호평가 마일스톤을 찾을 수 없습니다.',
        },
        { status: 404 },
      );
    },
  ),
];
