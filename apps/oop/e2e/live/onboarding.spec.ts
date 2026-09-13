import { test, expect, signIn } from './fixtures';

test('@submit 미배정 학생의 사전 설문 제출', async ({ page }) => {
  await signIn(page, 'survey');
  await page.getByRole('button', { name: '시작하기', exact: true }).click();
  await expect(
    page.getByRole('button', { name: '다음 설문', exact: true }),
  ).toBeDisabled();
  await page.getByRole('checkbox', { name: '개발', exact: true }).check();
  await page.getByRole('button', { name: '다음 설문', exact: true }).click();
  await page
    .getByRole('textbox', { name: /프로젝트 주제 아이디어/ })
    .fill('E2E 도서 관리 프로그램');
  await page
    .getByRole('textbox', { name: /요청 또는 메모/ })
    .fill('테스트 전용 설문 응답');
  await page.getByRole('button', { name: '설문 제출', exact: true }).click();
  const response = page.waitForResponse(
    r =>
      /\/pre-survey\/responses$/.test(r.url()) &&
      r.request().method() === 'POST',
  );
  await page
    .getByRole('dialog', { name: '설문 제출 확인' })
    .getByRole('button', { name: '제출', exact: true })
    .click();
  expect((await response).ok()).toBe(true);
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toBeVisible();
});
