import { Blob as NodeBlob, File as NodeFile } from 'node:buffer';

import {
  fetchStudentSubmission,
  fetchStudentSubmissionMemberConsent,
  updateStudentSubmissionMemberConsent,
  removeStudentSubmissionMemberConsent,
  updateStudentSubmissionCompletion,
  submitStudentSubmissionVersion,
  setApiAccessToken,
} from '@aics/api-client';
import { setupServer } from 'msw/node';
import { beforeAll, afterAll, afterEach, it, expect, vi } from 'vitest';

import { resetStudentSubmissionUploads } from '~/mocks/data/studentSubmission';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoCompletedAccessToken,
} from '~/mocks/data/users';
import { studentSubmissionHandlers } from '~/mocks/handlers/studentSubmission';
const server = setupServer(...studentSubmissionHandlers);
beforeAll(async () => {
  const form = await new Response('', {
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  }).formData();
  vi.stubGlobal('FormData', form.constructor);
  vi.stubGlobal('Blob', NodeBlob);
  vi.stubGlobal('File', NodeFile);
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => {
  server.close();
  vi.unstubAllGlobals();
});
afterEach(() => {
  server.resetHandlers();
  resetStudentSubmissionUploads();
  setApiAccessToken(null);
});
it('실파일 재제출은 이전 확인을 초기화하고 모든 활성 팀원 확인 후 팀장만 완료한다', async () => {
  const id = '701304';
  setApiAccessToken(demoAccessToken);
  const input = {
    description: '최종보고서',
    files: [
      {
        requiredArtifactId: 13041,
        file: new File(['%PDF-1.4 test'], 'report.pdf', {
          type: 'application/pdf',
        }),
      },
    ],
    artifacts: [],
  };
  const submitted = await submitStudentSubmissionVersion(id, input);
  expect(submitted).toMatchObject({
    currentVersion: 2,
    memberConsent: { confirmedCount: 1, totalCount: 3, isConfirmedByMe: true },
  });
  await expect(updateStudentSubmissionCompletion(id)).rejects.toMatchObject({
    response: { status: 428 },
  });
  setApiAccessToken(demoPartnerAccessToken);
  expect(await updateStudentSubmissionMemberConsent(id)).toMatchObject({
    confirmedCount: 2,
    isConfirmedByMe: true,
  });
  expect(await removeStudentSubmissionMemberConsent(id)).toMatchObject({
    confirmedCount: 1,
    isConfirmedByMe: false,
  });
  await updateStudentSubmissionMemberConsent(id);
  setApiAccessToken(demoAccessToken);
  await submitStudentSubmissionVersion(id, {
    ...input,
    changeNote: '내용 보완',
  });
  setApiAccessToken(demoPartnerAccessToken);
  expect(await fetchStudentSubmissionMemberConsent(id)).toMatchObject({
    confirmedCount: 1,
    isConfirmedByMe: false,
  });
  await updateStudentSubmissionMemberConsent(id);
  setApiAccessToken(demoCompletedAccessToken);
  await updateStudentSubmissionMemberConsent(id);
  await expect(updateStudentSubmissionCompletion(id)).rejects.toMatchObject({
    response: { status: 403 },
  });
  setApiAccessToken(demoAccessToken);
  expect(await updateStudentSubmissionCompletion(id)).toMatchObject({
    status: 'COMPLETED',
    currentVersion: 3,
  });
  setApiAccessToken(demoPartnerAccessToken);
  expect(await fetchStudentSubmission(id)).toMatchObject({
    status: 'COMPLETED',
    currentVersion: 3,
    memberConsent: { confirmedCount: 3, isConfirmedByMe: true },
  });
});
