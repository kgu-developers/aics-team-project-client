import { expect, type Page } from '@playwright/test';

export const student = {
  studentNumber: '20269901',
  password: 'e2e-synthetic-password',
  name: 'E2E 학생',
};

export async function login(page: Page, account = student) {
  await page.goto('/login');
  await page
    .getByRole('textbox', { name: /^학번/ })
    .fill(account.studentNumber);
  await page.getByLabel(/^비밀번호/).fill(account.password);
  await page.getByRole('button', { name: '로그인', exact: true }).click();
}

export async function dismissLoginNotice(page: Page) {
  // Wait for the authenticated render before checking this optional dialog.
  await expect(
    page.getByRole('button', { name: '로그인', exact: true }),
  ).toBeHidden();
  const dialog = page.getByRole('dialog', {
    name: '중간보고서 피드백 반영 계획 안내',
  });
  if (await dialog.isVisible()) {
    await dialog.getByRole('button', { name: '일주일간 안 보기' }).click();
    await expect(dialog).toBeHidden();
  }
}

export async function loginToHome(page: Page) {
  await login(page);
  await expect(page).toHaveURL(/\/student\/?$/);
  await dismissLoginNotice(page);
  await expect(
    page.getByRole('button', { name: '내 프로필 열기' }),
  ).toBeVisible();
}

export async function openStudentMenu(page: Page) {
  const trigger = page.getByRole('button', { name: '학생 메뉴 열기' });
  if (await trigger.isVisible()) await trigger.click();
}
