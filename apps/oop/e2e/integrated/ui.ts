import { expect, type Locator, type Page } from '@playwright/test';

export async function choose(
  scope: Page | Locator,
  label: string | RegExp,
  option: string | RegExp,
) {
  const combobox = scope.getByRole('combobox', {
    name: label,
    exact: typeof label === 'string',
  });
  await combobox.click();
  const page = 'page' in scope ? scope.page() : scope;
  const findOption = () =>
    page.getByRole('option', {
      name: option,
      exact: typeof option === 'string',
    });
  await expect(async () => {
    // A detached option can also close the dropdown. Reopen only when needed.
    let optionLocator = findOption();
    if (!(await optionLocator.isVisible())) {
      await combobox.click({ timeout: 2_000 });
      optionLocator = findOption();
    }
    await optionLocator.click({ timeout: 2_000 });
  }).toPass({ timeout: 15_000 });
}

export async function login(
  page: Page,
  user: { studentNumber: string; password: string },
  role: 'admin' | 'student' = 'student',
) {
  await page.goto('/login');
  await page.getByRole('textbox', { name: /^학번/ }).fill(user.studentNumber);
  await page.getByLabel(/^비밀번호/).fill(user.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
  await expect(page).toHaveURL(
    role === 'admin' ? /\/admin\/?$/ : /\/(student|onboarding\/team)(?:\/|$)/,
  );
  if (role === 'admin')
    await expect(
      page.getByRole('navigation', { name: '관리자 메뉴' }),
    ).toBeVisible();
}

export async function fillDate(
  page: Page | Locator,
  label: string | RegExp,
  date: string,
) {
  const input = page.getByRole('combobox', {
    name: label,
    exact: typeof label === 'string',
  });
  await input.fill(date);
  await input.press('Tab');
}
