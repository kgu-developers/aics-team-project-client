import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { Submission } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { submissionHandlers } from './submission';
import { resetSubmissionMockData } from '../data/submission';
import { demoAccessToken, demoAdminAccessToken } from '../data/users';

const headers = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const server = setupServer(...submissionHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetSubmissionMockData();
  server.resetHandlers();
});
afterAll(() => server.close());

function postVersion(
  submissionId: string,
  body: {
    description: string;
    artifacts: { kind: 'FILE'; name: string; size: number; mimeType: string }[];
  },
) {
  return fetch(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(submissionId)}`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  );
}

describe('submissionHandlers', () => {
  it('내 팀의 마일스톤 projection과 제출 상세을 조회한다', async () => {
    const projectionResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.MY_TEAM_BY_MILESTONE('presentation')}`,
      { headers },
    );
    const projection = (await projectionResponse.json()) as Submission;
    const detailResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL(projection.id)}`,
      { headers },
    );
    const detail = (await detailResponse.json()) as Submission;

    expect(projectionResponse.status).toBe(200);
    expect(projection).toMatchObject({
      teamId: 'team-07',
      milestoneKind: 'PRESENTATION',
      canSubmitNow: true,
    });
    expect(detail.currentVersion?.versionNumber).toBe(1);
  });

  it('공식 리뷰가 있는 발표 제출은 새 버전을 만들고 이후 수정은 같은 버전을 덮어쓴다', async () => {
    const body = {
      description: '발표 자료를 수정했습니다.',
      artifacts: [
        {
          kind: 'FILE' as const,
          name: 'presentation.pptx',
          size: 1024,
          mimeType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      ],
    };
    const created = await postVersion('submission-presentation', body);
    const createdSubmission = (await created.json()) as Submission;
    const overwritten = await postVersion('submission-presentation', {
      ...body,
      description: '오탈자를 바로잡았습니다.',
    });
    const overwrittenSubmission = (await overwritten.json()) as Submission;

    expect(createdSubmission.currentVersion?.versionNumber).toBe(2);
    expect(createdSubmission.versions).toHaveLength(2);
    expect(overwrittenSubmission.currentVersion).toMatchObject({
      versionNumber: 2,
      description: '오탈자를 바로잡았습니다.',
    });
    expect(overwrittenSubmission.versions).toHaveLength(2);
  });

  it('최종보고서 PDF의 누락, 형식, 용량을 검증한다', async () => {
    const missingPdf = await postVersion('submission-final-report', {
      description: '최종 제출입니다.',
      artifacts: [],
    });
    const oversizedPdf = await postVersion('submission-final-report', {
      description: '최종 제출입니다.',
      artifacts: [
        {
          kind: 'FILE',
          name: 'report.pdf',
          size: 21 * 1024 * 1024,
          mimeType: 'application/pdf',
        },
      ],
    });

    expect(missingPdf.status).toBe(400);
    await expect(missingPdf.json()).resolves.toMatchObject({
      code: 'REQUIRED_ARTIFACT_MISSING',
      message: '최종보고서 PDF 파일이 필요해요.',
    });
    expect(oversizedPdf.status).toBe(413);
    await expect(oversizedPdf.json()).resolves.toMatchObject({
      code: 'ARTIFACT_TOO_LARGE',
    });
  });

  it('비로그인·비학생·다른 팀 접근을 명시적으로 거부한다', async () => {
    const unauthorized = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL('submission-presentation')}`,
    );
    const nonStudent = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL('submission-presentation')}`,
      { headers: { Authorization: `Bearer ${demoAdminAccessToken}` } },
    );
    const otherTeam = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.DETAIL('submission-other-team')}`,
      { headers },
    );

    expect(unauthorized.status).toBe(401);
    expect(nonStudent.status).toBe(403);
    expect(otherTeam.status).toBe(403);
    await expect(otherTeam.json()).resolves.toMatchObject({
      code: 'TEAM_ACCESS_DENIED',
    });
  });

  it('canSubmitNow가 false이면 버전을 저장하지 않는다', async () => {
    const response = await postVersion('submission-locked', {
      description: '늦은 제출입니다.',
      artifacts: [
        {
          kind: 'FILE',
          name: 'presentation.pptx',
          size: 1024,
          mimeType: 'application/octet-stream',
        },
      ],
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      code: 'SUBMISSION_NOT_ALLOWED',
      message: '제출 가능 기간이 종료되었어요.',
    });
  });
});
