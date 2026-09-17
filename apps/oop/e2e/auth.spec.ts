import { paths } from './support/api';
import { test, expect } from './support/fixtures';
import { login, loginToHome, student } from './support/ui';

for (const route of [
  '/student',
  '/student/team',
  '/student/meetings',
  '/student/messages',
  '/student/editor/proposal/topic',
]) {
  test(`비로그인 사용자는 ${route}에서 로그인으로 이동한다`, async ({
    page,
  }) => {
    await page.goto(route);
    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByRole('heading', { name: '로그인' })).toBeVisible();
  });
}

test('잘못된 비밀번호는 오류를 표시하고 로그인 상태를 만들지 않는다', async ({
  page,
  api,
}) => {
  await login(page, { ...student, password: 'wrong-password' });
  await expect(page.getByRole('alert')).toContainText(
    '로그인 정보를 다시 확인',
  );
  await expect(page).toHaveURL(/\/login$/);
  expect(api.state.authenticated).toBe(false);
});

test('로그인 → 팀장 확정된 학생 홈 → 새로고침 → 로그아웃', async ({
  page,
  api,
}) => {
  await loginToHome(page);
  await page.reload();
  await expect(
    page.getByRole('button', { name: '내 프로필 열기' }),
  ).toBeVisible();
  await page.getByRole('button', { name: '내 프로필 열기' }).click();
  await page.getByRole('button', { name: '로그아웃', exact: true }).click();
  await expect(page).toHaveURL(/\/login$/);
  await page.goto('/student');
  await expect(page).toHaveURL(/\/login$/);
  expect(
    api.requests.filter(r => r.path === paths.refresh).length,
  ).toBeGreaterThan(1);
});
