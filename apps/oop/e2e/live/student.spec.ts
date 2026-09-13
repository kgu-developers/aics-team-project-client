import { test, expect, signIn, account } from './fixtures';
import { login, openStudentMenu } from '../support/ui';

for (const route of [
  '/student',
  '/student/team',
  '/student/meetings',
  '/student/editor/proposal/topic',
]) {
  test(`비로그인 직접 접근 ${route}`, async ({ page }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });
}

test('틀린 비밀번호는 로그인에 실패한다', async ({ page }) => {
  const result = page.waitForResponse(r =>
    r.url().endsWith('/api/v1/oop/auth/login'),
  );
  await login(page, { ...account(), password: 'invalid-e2e-password' });
  expect((await result).status()).toBe(401);
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);
});

test('로그인, 실제 쿠키로 새로고침 복원, 로그아웃', async ({
  page,
  context,
}) => {
  await signIn(page);
  const cookies = await context.cookies();
  expect(cookies.find(c => c.name === 'refreshToken')?.httpOnly).toBe(true);
  const refresh = page.waitForResponse(r =>
    r.url().endsWith('/api/v1/oop/auth/refresh'),
  );
  await page.reload();
  expect((await refresh).status()).toBe(200);
  await expect(
    page.getByRole('tablist', { name: '학생 홈 바로가기' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '내 프로필 열기' }).click();
  await expect(
    page.getByText(account().studentNumber, { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/student');
  await expect(page).toHaveURL(/\/login$/);
});

test('홈 바로가기 탭을 키보드로 전환한다', async ({ page }) => {
  await signIn(page);
  const notice = page.getByRole('tab', { name: '공지사항', exact: true });
  await notice.focus();
  await page.keyboard.press('ArrowRight');
  await expect(
    page.getByRole('tab', { name: '회의록', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
  await page.keyboard.press('End');
  await expect(
    page.getByRole('tab', { name: '액션 플랜', exact: true }),
  ).toHaveAttribute('aria-selected', 'true');
});

test('공지 목록과 본문 또는 명시적 빈 상태', async ({ page }) => {
  const listResponse = page.waitForResponse(r =>
    /\/sections\/\d+\/announcements$/.test(r.url()),
  );
  await signIn(page);
  await openStudentMenu(page);
  await page
    .getByRole('link', { name: '공지사항', exact: true })
    .first()
    .click();
  const response = await listResponse;
  expect(response.status()).toBe(200);
  const { contents } = await response.json();
  await expect(
    page.getByRole('heading', { name: '공지사항', exact: true }),
  ).toBeVisible();
  if (contents.length === 0) {
    await expect(
      page.getByText('등록된 공지사항이 없어요.', { exact: true }),
    ).toBeVisible();
    return;
  }
  const notice = contents[0];
  await page.getByRole('link', { name: notice.title, exact: true }).click();
  await expect(
    page.getByRole('heading', { name: notice.title, exact: true }),
  ).toBeVisible();
  await expect(
    page
      .getByText(
        notice.content.split('\n').find((line: string) => line.trim()),
        { exact: true },
      )
      .first(),
  ).toBeVisible();
  await page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }).click();
  await expect(
    page
      .getByRole('row')
      .filter({ hasText: notice.title })
      .getByText('새 글', { exact: true }),
  ).toHaveCount(0);
});

test('모바일 메뉴로 팀 액션 플랜에 접근한다', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await signIn(page);
  await openStudentMenu(page);
  await page
    .getByRole('link', { name: '액션 플랜', exact: true })
    .first()
    .click();
  await expect(
    page.getByRole('heading', { name: '팀 액션 플랜' }),
  ).toBeVisible();
});
