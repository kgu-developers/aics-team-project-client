import { API_BASE_URL, ENDPOINTS } from '@aics/api-client';
import type { Submission } from '@aics/core';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';

import { editLockHandlers, resetEditLockFixture } from './editLock';
import { submissionHandlers } from './submission';
import {
  completePresentationBlock,
  getCurrentPresentation,
  resetPresentationMockData,
  submitCurrentPresentation,
} from '../data/presentation';
import {
  getSubmissionById,
  getSubmissionByMilestone,
  resetSubmissionMockData,
} from '../data/submission';
import {
  demoAccessToken,
  demoAdminAccessToken,
  demoCompletedAccessToken,
  demoPartnerAccessToken,
} from '../data/users';

const headers = {
  Authorization: `Bearer ${demoAccessToken}`,
  'Content-Type': 'application/json',
};
const partnerHeaders = {
  Authorization: `Bearer ${demoPartnerAccessToken}`,
  'Content-Type': 'application/json',
};
const completedStudentHeaders = {
  Authorization: `Bearer ${demoCompletedAccessToken}`,
  'Content-Type': 'application/json',
};
const presentationMaterialLock = {
  targetType: 'PRESENTATION_CONTENT_BLOCK',
  targetId: 'presentation-team-07:presentation-material',
} as const;
const server = setupServer(...submissionHandlers, ...editLockHandlers);

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => {
  resetSubmissionMockData();
  resetPresentationMockData();
  resetEditLockFixture();
  server.resetHandlers();
});
afterAll(() => server.close());

function postVersion(
  submissionId: string,
  body: {
    description: string;
    artifacts: Array<
      | { kind: 'FILE'; name: string; size: number; mimeType: string }
      | { kind: 'LINK'; label: string; url: string }
    >;
  },
) {
  return fetch(
    `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS(submissionId)}`,
    { method: 'POST', headers, body: JSON.stringify(body) },
  );
}

function presentationBody(description: string, pdfName = 'presentation.pdf') {
  return {
    description,
    artifacts: [
      {
        kind: 'LINK' as const,
        label: '시연 URL',
        url: 'https://example.com/demo',
      },
      {
        kind: 'FILE' as const,
        name: pdfName,
        size: 1024,
        mimeType: 'application/pdf',
      },
      {
        kind: 'FILE' as const,
        name: 'presentation-source.zip',
        size: 2048,
        mimeType: 'application/zip',
      },
    ],
  };
}

function markPresentationMaterialCompleted() {
  const presentation = getCurrentPresentation();
  const material = presentation.blocks.find(
    block => block.key === 'presentation-material',
  );
  if (!material) throw new Error('presentation-material fixture is required');
  const completed = completePresentationBlock(
    material.key,
    presentation.version,
    'OOP 데모 학생 A',
  );
  if (!completed) throw new Error('presentation-material should complete');
  return completed;
}

function submitPresentationDocument() {
  let presentation = getCurrentPresentation();
  for (const block of presentation.blocks) {
    const completed = completePresentationBlock(
      block.key,
      presentation.version,
      'OOP 데모 학생 A',
    );
    if (!completed) throw new Error(`${block.key} should complete`);
    presentation = completed;
  }
  const submitted = submitCurrentPresentation(
    presentation.version,
    'OOP 데모 학생 A',
  );
  if (!submitted) throw new Error('presentation should submit');
  return submitted;
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

  it('발표 자료는 시연 URL, PDF, ZIP만 허용한다', async () => {
    const response = await postVersion('submission-presentation', {
      description: '허용되지 않은 원본 형식입니다.',
      artifacts: [
        {
          kind: 'FILE',
          name: 'presentation.pptx',
          size: 1024,
          mimeType:
            'application/vnd.openxmlformats-officedocument.presentationml.presentation',
        },
      ],
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'REQUIRED_ARTIFACT_MISSING',
      message: '발표 자료 PDF 파일이 필요해요.',
    });
  });

  it('필수 자료와 함께 알 수 없는 종류의 자료가 포함되면 거부한다', async () => {
    const body = presentationBody('알 수 없는 자료 종류가 포함됐습니다.');
    const response = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS('submission-presentation')}`,
      {
        method: 'POST',
        headers,
        body: JSON.stringify({
          ...body,
          artifacts: [...body.artifacts, { kind: 'OTHER', value: 'unknown' }],
        }),
      },
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'ARTIFACT_TYPE_NOT_ALLOWED',
    });
  });

  it('같은 제출 링크가 중복되면 거부한다', async () => {
    const body = presentationBody('시연 URL이 중복됐습니다.');
    const response = await postVersion('submission-presentation', {
      ...body,
      artifacts: [
        ...body.artifacts,
        {
          kind: 'LINK',
          label: '시연 URL',
          url: 'https://example.com/duplicate-demo',
        },
      ],
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      code: 'ARTIFACT_TYPE_NOT_ALLOWED',
    });
  });

  it('같은 마일스톤에서도 팀 범위의 제출물만 조회한다', () => {
    expect(getSubmissionByMilestone('team-07', 'presentation')).toMatchObject({
      id: 'submission-presentation',
      teamId: 'team-07',
    });
    expect(getSubmissionByMilestone('team-99', 'presentation')).toMatchObject({
      id: 'submission-other-team',
      teamId: 'team-99',
    });
  });

  it('공식 리뷰가 있는 발표 제출은 새 버전을 만들고 이후 수정은 같은 버전을 덮어쓴다', async () => {
    const body = presentationBody('발표 자료를 수정했습니다.');
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

  it('발표 문서 제출 후에는 파일 버전을 만들지 않고 제출 상태를 보존한다', async () => {
    submitPresentationDocument();
    const before = getSubmissionById('submission-presentation');

    const response = await postVersion('submission-presentation', {
      ...presentationBody(
        '제출 후 파일 교체 시도입니다.',
        'presentation-after-submit.pdf',
      ),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'PRESENTATION_SUBMITTED',
    });
    expect(getSubmissionById('submission-presentation')).toEqual(before);
  });

  it('다른 사용자가 발표 자료 블록을 잠그면 파일 버전을 만들지 않는다', async () => {
    const lockResponse = await fetch(
      `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`,
      {
        method: 'POST',
        headers: partnerHeaders,
        body: JSON.stringify(presentationMaterialLock),
      },
    );
    const acquiredLock = (await lockResponse.json()) as { leaseId?: string };
    expect(lockResponse.status).toBe(200);

    const before = getSubmissionById('submission-presentation');
    const response = await postVersion('submission-presentation', {
      ...presentationBody(
        '잠금 중 파일 교체 시도입니다.',
        'presentation-locked.pdf',
      ),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      code: 'BLOCK_LOCKED',
    });
    expect(getSubmissionById('submission-presentation')).toEqual(before);

    const releaseUrl = new URL(`${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`);
    releaseUrl.search = new URLSearchParams(
      presentationMaterialLock,
    ).toString();
    if (acquiredLock.leaseId) {
      releaseUrl.searchParams.set('leaseId', acquiredLock.leaseId);
    }
    await fetch(releaseUrl, { method: 'DELETE', headers: partnerHeaders });
  });

  it('완료된 발표 자료를 교체하면 자료 블록은 다시 진행 중이 되고 문서 버전이 증가한다', async () => {
    const completed = markPresentationMaterialCompleted();
    const beforeSubmission = getSubmissionById('submission-presentation');

    const response = await postVersion('submission-presentation', {
      ...presentationBody(
        '발표 자료를 교체했습니다.',
        'presentation-replaced.pdf',
      ),
    });
    const currentPresentation = getCurrentPresentation();
    const currentSubmission = getSubmissionById('submission-presentation');

    expect(response.status).toBe(200);
    expect(currentPresentation.version).toBe(completed.version + 1);
    expect(
      currentPresentation.blocks.find(
        block => block.key === 'presentation-material',
      ),
    ).toMatchObject({
      status: 'IN_PROGRESS',
      lastEditedBy: 'OOP 데모 학생 A',
    });
    expect(currentSubmission?.currentVersion?.versionNumber).toBe(
      (beforeSubmission?.currentVersion?.versionNumber ?? 0) + 1,
    );
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

  it('팀장은 승인 입력 없이 최종보고서를 제출한다', async () => {
    const response = await postVersion('submission-final-report', {
      description: '최종 제출입니다.',
      artifacts: [
        {
          kind: 'FILE',
          name: 'report.pdf',
          size: 1024,
          mimeType: 'application/pdf',
        },
        {
          kind: 'FILE',
          name: 'source.zip',
          size: 1024,
          mimeType: 'application/zip',
        },
      ],
    });
    const submitted = (await response.json()) as Submission;

    expect(response.status).toBe(200);
    expect(submitted.memberConsent).toMatchObject({
      confirmedCount: 1,
      isConfirmedByMe: false,
    });
  });

  it('팀원은 최종보고서 제출 후 승인하고 승인 취소할 수 있다', async () => {
    const beforeSubmission = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.CONFIRMATION('submission-final-report')}`,
      { method: 'PUT', headers: completedStudentHeaders },
    );
    expect(beforeSubmission.status).toBe(409);

    await postVersion('submission-final-report', {
      description: '최종 제출입니다.',
      artifacts: [
        {
          kind: 'FILE',
          name: 'report.pdf',
          size: 1024,
          mimeType: 'application/pdf',
        },
        {
          kind: 'FILE',
          name: 'source.zip',
          size: 1024,
          mimeType: 'application/zip',
        },
      ],
    });

    const confirmationUrl = `${API_BASE_URL}${ENDPOINTS.SUBMISSION.CONFIRMATION('submission-final-report')}`;
    const confirmedResponse = await fetch(confirmationUrl, {
      method: 'PUT',
      headers: completedStudentHeaders,
    });
    const confirmed = (await confirmedResponse.json()) as Submission;
    const withdrawnResponse = await fetch(confirmationUrl, {
      method: 'DELETE',
      headers: completedStudentHeaders,
    });
    const withdrawn = (await withdrawnResponse.json()) as Submission;

    expect(confirmedResponse.status).toBe(200);
    expect(confirmed.memberConsent).toMatchObject({
      confirmedCount: 2,
      isConfirmedByMe: true,
    });
    expect(withdrawnResponse.status).toBe(200);
    expect(withdrawn.memberConsent).toMatchObject({
      confirmedCount: 1,
      isConfirmedByMe: false,
    });
  });

  it('팀원 제출과 팀장 승인을 역할 오류로 거부한다', async () => {
    const memberSubmission = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS('submission-final-report')}`,
      {
        method: 'POST',
        headers: partnerHeaders,
        body: JSON.stringify({ artifacts: [] }),
      },
    );
    const leaderConfirmation = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.CONFIRMATION('submission-final-report')}`,
      { method: 'PUT', headers },
    );

    expect(memberSubmission.status).toBe(403);
    await expect(memberSubmission.json()).resolves.toMatchObject({
      code: 'TEAM_LEADER_REQUIRED',
    });
    expect(leaderConfirmation.status).toBe(403);
    await expect(leaderConfirmation.json()).resolves.toMatchObject({
      code: 'TEAM_MEMBER_CONFIRMATION_ONLY',
    });
  });

  it('잘못된 JSON 구조를 400 응답으로 처리한다', async () => {
    const nullBody = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS('submission-final-report')}`,
      { method: 'POST', headers, body: 'null' },
    );
    const nullArtifact = await fetch(
      `${API_BASE_URL}${ENDPOINTS.SUBMISSION.VERSIONS('submission-final-report')}`,
      { method: 'POST', headers, body: JSON.stringify({ artifacts: [null] }) },
    );

    expect(nullBody.status).toBe(400);
    await expect(nullBody.json()).resolves.toMatchObject({
      code: 'ARTIFACTS_REQUIRED',
    });
    expect(nullArtifact.status).toBe(400);
    await expect(nullArtifact.json()).resolves.toMatchObject({
      code: 'ARTIFACT_TYPE_NOT_ALLOWED',
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
          name: 'presentation.pdf',
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
