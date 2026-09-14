import { test, expect } from './support/fixtures';
import { loginToHome, openStudentMenu } from './support/ui';

test('학생 메뉴에서 공지와 회의록으로 이동한다', async ({ page }) => {
  await loginToHome(page);
  await openStudentMenu(page);
  await page
    .getByRole('link', { name: '공지사항', exact: true })
    .first()
    .click();
  await expect(page).toHaveURL(/\/student\/notices$/);
  await expect(
    page.getByRole('link', { name: 'E2E 프로젝트 안내', exact: true }),
  ).toBeVisible();
  await page
    .getByRole('link', { name: 'E2E 프로젝트 안내', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: 'E2E 프로젝트 안내' }),
  ).toBeVisible();
  await expect(
    page.getByText('분반별 제출 일정을 확인하세요.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('link', { name: '공지사항 목록으로 돌아가기' }).click();
  await expect(
    page.getByRole('row', { name: /E2E 프로젝트 안내/ }).getByText('새 글'),
  ).toHaveCount(0);
  await openStudentMenu(page);
  await page.getByRole('link', { name: '회의록', exact: true }).first().click();
  await expect(
    page.getByRole('heading', { name: '회의록', exact: true }),
  ).toBeVisible();
});

test('없는 공지는 복귀 링크를 제공한다', async ({ page }) => {
  await loginToHome(page);
  await page.goto('/student/notices/999999');
  await expect(
    page.getByRole('heading', { name: '공지사항을 찾을 수 없어요.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: /공지사항 목록으로/ }).click();
  await expect(page).toHaveURL(/\/student\/notices$/);
});
