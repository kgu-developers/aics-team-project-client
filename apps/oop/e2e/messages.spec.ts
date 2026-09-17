import { expect, test } from './support/fixtures';
import { loginToHome } from './support/ui';

test('헤더 쪽지함에서 교수자 메시지를 열고 기존 대화에만 답장한다', async ({
  page,
  api,
}) => {
  api.state.teamMessages.push({
    id: 701,
    threadId: 70,
    senderId: 'professor-e2e',
    senderName: 'E2E 교수',
    relatedType: 'PROPOSAL',
    relatedId: 21,
    message: '제안서의 문제 정의를 보완해 주세요.',
    createdAt: '2026-09-16T23:30:00Z',
    important: false,
    read: false,
  });
  await loginToHome(page);
  await page.evaluate(() => {
    document.cookie = 'XSRF-TOKEN=e2e-csrf-token; Path=/';
  });
  await page.getByRole('link', { name: '쪽지함' }).click();
  await expect(page).toHaveURL(/\/student\/messages$/);

  const openButton = page.getByRole('button', {
    name: '제안서 피드백 대화 열기',
  });
  const row = page.getByRole('row').filter({ has: openButton });
  await expect(row).toContainText('제안서의 문제 정의를 보완해 주세요.');
  await openButton.click();

  const dialog = page.getByRole('dialog', { name: '교수자 팀 메시지 대화' });
  await expect(dialog).toContainText('제안서의 문제 정의를 보완해 주세요.');
  await dialog.getByLabel('답장 내용').fill('문제 정의를 반영했습니다.');
  await dialog.getByRole('button', { name: '답장 보내기' }).click();
  await expect(dialog).toContainText('문제 정의를 반영했습니다.');

  const readRequest = api.requests.find(
    request =>
      request.method === 'PATCH' &&
      request.path === '/api/v1/messages/701/read',
  );
  const replyRequests = api.requests.filter(
    request =>
      request.method === 'POST' && request.path === '/api/v1/teams/7/messages',
  );

  expect(readRequest?.headers['x-xsrf-token']).toBe('e2e-csrf-token');
  expect(replyRequests).toEqual([
    expect.objectContaining({
      body: {
        message: '문제 정의를 반영했습니다.',
        relatedId: 21,
        relatedType: 'PROPOSAL',
      },
      headers: expect.objectContaining({
        'x-xsrf-token': 'e2e-csrf-token',
      }),
    }),
  ]);
});

test('피드백 답장 기간이 아니면 입력과 전송을 차단한다', async ({
  page,
  api,
}) => {
  api.state.teamMessages.push({
    id: 702,
    threadId: 70,
    senderId: 'professor-e2e',
    senderName: 'E2E 교수',
    relatedType: 'PROPOSAL',
    relatedId: 21,
    message: '제안서의 문제 정의를 보완해 주세요.',
    createdAt: '2026-09-16T23:30:00Z',
    important: false,
    read: true,
  });
  api.respond('GET', '/api/v1/milestones/2301/my-team-submission', 200, {
    id: 7001,
    milestoneId: 2301,
    teamId: 7,
    status: 'SUBMITTED',
    currentVersion: 1,
    canSubmitNow: false,
    hasPendingReview: true,
  });

  await loginToHome(page);
  await page.getByRole('link', { name: '쪽지함' }).click();
  await page.getByRole('button', { name: '제안서 피드백 대화 열기' }).click();

  const dialog = page.getByRole('dialog', { name: '교수자 팀 메시지 대화' });
  await expect(dialog.getByLabel('답장 내용')).toBeDisabled();
  await expect(
    dialog.getByText('현재 피드백 답장 가능 기간이 아닙니다.'),
  ).toBeVisible();
  await expect(
    dialog.getByRole('button', { name: '답장 보내기' }),
  ).toBeDisabled();
  expect(
    api.requests.filter(
      request =>
        request.method === 'POST' &&
        request.path === '/api/v1/teams/7/messages',
    ),
  ).toEqual([]);
});
