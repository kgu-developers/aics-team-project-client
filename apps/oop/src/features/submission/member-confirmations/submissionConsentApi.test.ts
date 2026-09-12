import {
  API_BASE_URL,
  fetchStudentSubmissionMemberConsent,
  updateStudentSubmissionMemberConsent,
  removeStudentSubmissionMemberConsent,
  setApiAccessToken,
} from '@aics/api-client';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it } from 'vitest';

import { studentSubmissionConsent } from '~/mocks/data/studentSubmissionConsent';
import {
  demoAccessToken,
  demoPartnerAccessToken,
  demoAdminAccessToken,
  demoOtherSectionAccessToken,
} from '~/mocks/data/users';
import { createStudentSubmissionConsentHandlers } from '~/mocks/handlers/studentSubmissionConsent';

const server = setupServer();
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  setApiAccessToken(demoPartnerAccessToken);
  server.use(...createStudentSubmissionConsentHandlers());
});
afterEach(() => {
  server.resetHandlers();
  setApiAccessToken(null);
});
afterAll(() => server.close());

it('GET과 본인 PUT/DELETE는 200 확인 요약을 반환하고 다른 계정에도 같은 수가 보인다', async () => {
  expect(await fetchStudentSubmissionMemberConsent('41')).toEqual({
    confirmedCount: 1,
    totalCount: 2,
    isConfirmedByMe: false,
  });
  const confirmed = await updateStudentSubmissionMemberConsent('41');
  expect(confirmed).toEqual({
    confirmedCount: 2,
    totalCount: 2,
    isConfirmedByMe: true,
  });
  expect(await updateStudentSubmissionMemberConsent('41')).toEqual(confirmed);
  setApiAccessToken(demoAccessToken);
  expect(await fetchStudentSubmissionMemberConsent('41')).toEqual(confirmed);
  setApiAccessToken(demoPartnerAccessToken);
  expect(await removeStudentSubmissionMemberConsent('41')).toEqual({
    confirmedCount: 1,
    totalCount: 2,
    isConfirmedByMe: false,
  });
  expect(await removeStudentSubmissionMemberConsent('41')).toEqual({
    confirmedCount: 1,
    totalCount: 2,
    isConfirmedByMe: false,
  });
});

it('본인 mutation에 userId나 version 또는 본문을 추가하지 않는다', async () => {
  const requests: { method: string; body: string; query: string }[] = [];
  server.use(
    http.all(
      `${API_BASE_URL}/submissions/41/member-confirmations/me`,
      async ({ request }) => {
        requests.push({
          method: request.method,
          body: await request.text(),
          query: new URL(request.url).search,
        });
        return HttpResponse.json({
          confirmedCount: 1,
          totalCount: 2,
          isConfirmedByMe: false,
        });
      },
    ),
  );
  await updateStudentSubmissionMemberConsent('41');
  await removeStudentSubmissionMemberConsent('41');
  expect(requests).toEqual([
    { method: 'PUT', body: '', query: '' },
    { method: 'DELETE', body: '', query: '' },
  ]);
});

it.each(['0', '-1', '1.2', '41x', '9007199254740992'])(
  '잘못된 제출 ID %s는 조회·확인·취소 요청 전에 거절한다',
  async id => {
    await expect(fetchStudentSubmissionMemberConsent(id)).rejects.toThrow(
      '식별자',
    );
    await expect(updateStudentSubmissionMemberConsent(id)).rejects.toThrow(
      '식별자',
    );
    await expect(removeStudentSubmissionMemberConsent(id)).rejects.toThrow(
      '식별자',
    );
  },
);
it.each([
  null,
  { confirmedCount: '1', totalCount: 2, isConfirmedByMe: false },
  { confirmedCount: 3, totalCount: 2, isConfirmedByMe: true },
  { confirmedCount: 0, totalCount: 2, isConfirmedByMe: true },
  { confirmedCount: 1, totalCount: 2 },
])('잘못된 요약 %j를 확인 완료로 수용하지 않는다', async summary => {
  server.use(
    http.get(`${API_BASE_URL}/submissions/41/member-confirmations`, () =>
      HttpResponse.json(summary),
    ),
  );
  await expect(fetchStudentSubmissionMemberConsent('41')).rejects.toThrow(
    '확인 현황',
  );
});
it.each([
  [null, 401],
  [demoOtherSectionAccessToken, 403],
  [demoAdminAccessToken, 403],
] as const)(
  '접근할 수 없는 계정은 조회·확인·취소 모두 거절된다 (%s)',
  async (token, status) => {
    setApiAccessToken(token);
    for (const operation of [
      fetchStudentSubmissionMemberConsent,
      updateStudentSubmissionMemberConsent,
      removeStudentSubmissionMemberConsent,
    ])
      await expect(operation('41')).rejects.toMatchObject({
        response: { status },
      });
  },
);
it('최종보고서가 아닌 제출은 400으로 거절한다', async () => {
  server.use(
    ...createStudentSubmissionConsentHandlers({
      milestoneType: 'PRESENTATION',
    }),
  );
  await expect(fetchStudentSubmissionMemberConsent('41')).rejects.toMatchObject(
    {
      response: {
        status: 400,
        data: { code: 'SUBMISSION_MEMBER_CONFIRMATION_NOT_APPLICABLE' },
      },
    },
  );
});
it('재제출 후 이전 확인은 집계에서 빠지고 팀장만 새 버전에 자동 확인된다', async () => {
  let version = 2;
  let active = ['20260001', '20260003'];
  server.use(
    ...createStudentSubmissionConsentHandlers({
      getSubmission: () => ({
        ...studentSubmissionConsent,
        currentVersion: version,
      }),
      getActiveStudentNumbers: () => active,
    }),
  );
  await updateStudentSubmissionMemberConsent('41');
  version = 3;
  expect(await fetchStudentSubmissionMemberConsent('41')).toEqual({
    confirmedCount: 1,
    totalCount: 2,
    isConfirmedByMe: false,
  });
  await updateStudentSubmissionMemberConsent('41');
  active = ['20260001'];
  setApiAccessToken(demoAccessToken);
  expect(await fetchStudentSubmissionMemberConsent('41')).toEqual({
    confirmedCount: 1,
    totalCount: 1,
    isConfirmedByMe: true,
  });
});
