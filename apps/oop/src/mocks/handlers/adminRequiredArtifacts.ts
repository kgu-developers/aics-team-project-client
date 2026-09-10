import {
  API_BASE_URL,
  ENDPOINTS,
  type RequiredArtifactInput,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';

import { getMockAuthenticatedAccount } from '../authSession';
import {
  createAdminRequiredArtifactFixture,
  getAdminRequiredArtifactsFixture,
  removeAdminRequiredArtifactFixture,
  updateAdminRequiredArtifactFixture,
} from '../data/adminRequiredArtifacts';
import { demoAdmin } from '../data/users';

function isAdminRequest(request: Request) {
  return getMockAuthenticatedAccount(request)?.user.id === demoAdmin.id;
}

function unauthorized() {
  return HttpResponse.json(
    { code: 'UNAUTHORIZED', message: '관리자 로그인이 필요합니다.' },
    { status: 401 },
  );
}

export const adminRequiredArtifactHandlers = [
  http.get(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(':sectionId', ':milestoneId')}`,
    ({ params, request }) => {
      if (!isAdminRequest(request)) return unauthorized();

      return HttpResponse.json(
        getAdminRequiredArtifactsFixture(String(params.milestoneId)),
      );
    },
  ),
  http.post(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(':sectionId', ':milestoneId')}`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) return unauthorized();

      const artifact = createAdminRequiredArtifactFixture(
        String(params.milestoneId),
        (await request.json()) as RequiredArtifactInput,
      );
      return HttpResponse.json({ id: artifact.id }, { status: 201 });
    },
  ),
  http.put(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(':sectionId', ':milestoneId')}/:requiredArtifactId`,
    async ({ params, request }) => {
      if (!isAdminRequest(request)) return unauthorized();

      const artifact = updateAdminRequiredArtifactFixture(
        String(params.milestoneId),
        String(params.requiredArtifactId),
        (await request.json()) as RequiredArtifactInput,
      );
      return artifact
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json(
            {
              code: 'REQUIRED_ARTIFACT_NOT_FOUND',
              message: '산출물을 찾을 수 없습니다.',
            },
            { status: 404 },
          );
    },
  ),
  http.delete(
    `${API_BASE_URL}${ENDPOINTS.ADMIN.REQUIRED_ARTIFACTS(':sectionId', ':milestoneId')}/:requiredArtifactId`,
    ({ params, request }) => {
      if (!isAdminRequest(request)) return unauthorized();

      return removeAdminRequiredArtifactFixture(
        String(params.milestoneId),
        String(params.requiredArtifactId),
      )
        ? new HttpResponse(null, { status: 204 })
        : HttpResponse.json(
            {
              code: 'REQUIRED_ARTIFACT_NOT_FOUND',
              message: '산출물을 찾을 수 없습니다.',
            },
            { status: 404 },
          );
    },
  ),
];
