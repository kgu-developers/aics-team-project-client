import { test, expect, type Page } from '@playwright/test';

async function login(page: Page, scenario = 'topic', member = false) {
  await page.goto(`/login?mswStudentScenario=${scenario}`);
  await page
    .getByRole('textbox', { name: /^학번/ })
    .fill(member ? '20260003' : '20260001');
  await page.getByLabel(/^비밀번호/).fill(member ? 'oop-demo-b' : 'oop-demo-a');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(/\/student\/?$/);
}

const unexpectedRequests = new WeakMap<Page, string[]>();

test.beforeEach(async ({ context, page }) => {
  const unexpected: string[] = [];
  unexpectedRequests.set(page, unexpected);
  page.on('requestfailed', request => {
    if (new URL(request.url()).pathname.startsWith('/api/'))
      unexpected.push(request.url());
  });
  page.on('response', response => {
    const path = new URL(response.url()).pathname;
    if (!path.startsWith('/api/')) return;
    if (!response.fromServiceWorker()) unexpected.push(`not mocked: ${path}`);
    if (response.status() < 400) return;
    if (
      path.endsWith('/auth/refresh') &&
      [401, 403].includes(response.status())
    )
      return;
    if (path.endsWith('/teams/7/project') && response.status() === 404) return;
    if (path.endsWith('/members/contacts') && response.status() === 503) return;
    unexpected.push(`${response.status()} ${path}`);
  });
  // Keep this suite isolated from every real backend, even if a mock is missing.
  await context.route('**/*', route => {
    const url = new URL(route.request().url());
    return url.protocol.startsWith('http') && url.hostname !== '127.0.0.1'
      ? route.abort()
      : route.continue();
  });
  page.on('pageerror', error => {
    throw error;
  });
});

test('실제 홈에서 무투표 직접 제출 후 새로고침해도 작성 단계가 유지된다', async ({
  page,
}, info) => {
  await login(page);
  const direct = page.getByRole('button', {
    name: '주제 직접 제출',
    exact: true,
  });
  await expect(direct).toBeEnabled();
  await expect(page.getByText('조회 중', { exact: true })).toHaveCount(0);
  await page.screenshot({
    path: info.outputPath('home.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await direct.click();
  await expect(page.getByText(/이미 주제가 정해진 경우에만/)).toBeVisible();
  await page.screenshot({
    path: info.outputPath('confirmation.png'),
    fullPage: false,
    animations: 'disabled',
  });
  await page.getByRole('button', { name: '확인하고 계속' }).click();
  await page.getByLabel('주제 제목').fill('캠퍼스 도서 대여 관리');
  await page
    .getByLabel('주제 설명')
    .fill('학생들이 도서 대여와 반납 일정을 관리합니다.');
  await page.screenshot({
    path: info.outputPath('form.png'),
    fullPage: false,
    animations: 'disabled',
  });
  const response = page.waitForResponse(response =>
    response.url().endsWith('/topic-finalize/direct'),
  );
  await page.getByRole('button', { name: '주제 제출', exact: true }).click();
  expect((await response).fromServiceWorker()).toBe(true);
  await expect(page).toHaveURL(/\/student\/editor\/proposal\/team-info/);
  await page.goto('/student');
  await expect(
    page.getByText('제안서 작성', { exact: true }).first(),
  ).toBeVisible();
  await expect(direct).toHaveCount(0);
  await page.reload();
  await expect(
    page.getByText('제안서 작성', { exact: true }).first(),
  ).toBeVisible();
  await expect(direct).toHaveCount(0);
});

test('팀원은 직접 제출 버튼 없이 같은 팀원 표에서 연락처를 조회한다', async ({
  page,
}, info) => {
  await login(page, 'topic', true);
  await expect(page.getByRole('button', { name: '후보 추가' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '주제 직접 제출' }),
  ).toHaveCount(0);
  const response = page.waitForResponse(response =>
    response.url().endsWith('/members/contacts'),
  );
  await page.goto('/student/team');
  expect((await response).fromServiceWorker()).toBe(true);
  await expect(
    page.getByRole('columnheader', { name: '전화번호' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '010-0000-0001 복사' }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath('team-desktop.png'),
    fullPage: true,
    animations: 'disabled',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({
    path: info.outputPath('team-mobile.png'),
    fullPage: true,
    animations: 'disabled',
  });
});

test('공개 종료 후 실제 팀원 페이지는 연락처 요청과 열을 생략한다', async ({
  page,
}) => {
  await login(page, 'contacts-closed');
  const requests: string[] = [];
  page.on('request', request => {
    if (request.url().endsWith('/members/contacts'))
      requests.push(request.url());
  });
  await page.goto('/student/team');
  await expect(
    page.getByRole('heading', { name: '내 팀', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole('columnheader', { name: '전화번호' }),
  ).toHaveCount(0);
  expect(requests).toEqual([]);
});

test('연락처 조회 실패에도 팀원 표와 재시도가 유지된다', async ({ page }) => {
  await login(page, 'contacts-error');
  await page.goto('/student/team');
  await expect(
    page.getByText('팀원 연락처를 불러오지 못했어요.'),
  ).toBeVisible();
  await expect(page.getByRole('columnheader', { name: '학번' })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '연락처 다시 확인' }),
  ).toBeEnabled();
  await expect(
    page.getByRole('columnheader', { name: '전화번호' }),
  ).toHaveCount(0);
});

test.afterEach(async ({ page }) => {
  expect(unexpectedRequests.get(page)).toEqual([]);
});
