import { expect, test } from '@playwright/test';

for (const account of [
  { number: '20260001', password: 'oop-demo-a', home: 'student' },
  { number: '20260002', password: 'oop-admin', home: 'admin' },
]) {
  test(`${account.home} 로그인과 새로고침 세션 복원`, async ({ page }) => {
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/login');
    await page.getByRole('textbox', { name: /^학번/ }).fill(account.number);
    await page.getByLabel(/^비밀번호/).fill(account.password);
    await page.getByRole('button', { name: '로그인', exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`/${account.home}/?$`));
    await page.reload();
    await expect(page).toHaveURL(new RegExp(`/${account.home}/?$`));
    await expect(
      page.getByRole('button', { name: '로그인', exact: true }),
    ).toHaveCount(0);
    expect(errors).toEqual([]);
  });
}

test('잘못된 로그인은 refresh로 재시도하지 않고 폼 오류로 남는다', async ({
  page,
}) => {
  let refreshes = 0;
  page.on('request', request => {
    if (request.url().endsWith('/api/v1/auth/refresh')) refreshes += 1;
  });
  await page.goto('/login');
  await expect(
    page.getByRole('button', { name: '로그인', exact: true }),
  ).toBeVisible();
  const bootstrapRefreshes = refreshes;
  await page.getByRole('textbox', { name: /^학번/ }).fill('20260001');
  await page.getByLabel(/^비밀번호/).fill('incorrect-password');
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page.getByRole('alert')).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
  expect(refreshes).toBe(bootstrapRefreshes);
});
