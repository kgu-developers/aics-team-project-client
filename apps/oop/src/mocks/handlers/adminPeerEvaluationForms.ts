import {
  API_BASE_URL,
  ENDPOINTS,
  type AdminPeerEvaluationFormCreateInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import { demoAdmin } from '../data/users';

let nextPeerEvaluationFormId = 1;

function isAdminRequest(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

export function resetAdminPeerEvaluationFormsFixture() {
  nextPeerEvaluationFormId = 1;
}

export const adminPeerEvaluationFormHandlers = [
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.OOP_PEER_EVALUATION_FORM(':sectionId')}`,
    async ({ request }) => {
      if (!isAdminRequest(request)) {
        return HttpResponse.json(
          { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
          { status: 401 },
        );
      }

      const input =
        (await request.json()) as AdminPeerEvaluationFormCreateInput;
      if (!input.milestoneId || !input.opensAt || !input.closesAt) {
        return HttpResponse.json(
          {
            code: 'INVALID_REQUEST',
            message: '상호평가 양식 입력값이 올바르지 않습니다.',
          },
          { status: 400 },
        );
      }

      return HttpResponse.json(
        { id: nextPeerEvaluationFormId++ },
        { status: 201 },
      );
    },
  ),
];
