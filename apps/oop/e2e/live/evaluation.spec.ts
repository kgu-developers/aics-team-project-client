import type { Page } from '@playwright/test';

import { test, expect, signIn } from './fixtures';

async function fillEvaluation(page: Page) {
  await page.goto('/student/peer-review');
  const previous = page.getByRole('button', { name: '이전 설문', exact: true });
  // Draft responses reopen at the teammate step.
  await expect(
    page.getByRole('button', { name: /^(다음 설문|이전 설문)$/ }).first(),
  ).toBeVisible();
  if (await previous.isVisible()) await previous.click();
  await page
    .getByRole('textbox', { name: /^자신의 역할 요약/ })
    .fill('E2E 기능 테스트와 API 검증');
  await page
    .getByRole('textbox', { name: /^팀 프로젝트 평가/ })
    .fill('사용자 플로우를 함께 검증했습니다.');
  await page
    .getByRole('textbox', { name: /^소감 또는 팀원 칭찬/ })
    .fill('팀원들이 역할을 나누어 검증했습니다.');
  await page.getByRole('button', { name: '다음 설문', exact: true }).click();
  const rows = page
    .getByRole('row')
    .filter({ has: page.getByRole('button', { name: /^(평가|수정)$/ }) });
  await expect(rows.first()).toBeVisible();
  const count = await rows.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) {
    await rows
      .nth(i)
      .getByRole('button', { name: /^(평가|수정)$/ })
      .click();
    const dialog = page.getByRole('dialog', { name: /기여도 평가/ });
    await dialog
      .getByRole('textbox', { name: /^기여도/ })
      .fill(String(Math.floor(100 / count) + (i < 100 % count ? 1 : 0)));
    await dialog
      .getByRole('textbox', { name: /^기여 내용/ })
      .fill('설계와 구현 내용을 검증했습니다.');
    await dialog
      .getByRole('textbox', { name: /^한줄평가/ })
      .fill('협업과 역할 수행이 좋았습니다.');
    await dialog
      .getByRole('button', { name: '평가 저장', exact: true })
      .click();
    await expect(dialog).toBeHidden();
  }
  await expect(page.getByText('합계 충족', { exact: true })).toBeVisible();
}

test('상호평가 초안 저장과 기여도 100% 검증', async ({ page }) => {
  await signIn(page, 'member');
  await fillEvaluation(page);
  await expect(
    page.getByRole('button', { name: '제출하기', exact: true }),
  ).toBeEnabled();
  await page.reload();
  await expect(page.getByText('합계 충족', { exact: true })).toBeVisible();
  await expect(
    page.getByRole('button', { name: '제출하기', exact: true }),
  ).toBeEnabled();
});

test('@submit 상호평가 최종 제출 후 읽기 전용', async ({ page }) => {
  await signIn(page);
  await fillEvaluation(page);
  const response = page.waitForResponse(
    r =>
      /\/peer-evaluation-forms\/\d+\/responses$/.test(r.url()) &&
      r.request().postDataJSON()?.submit === true,
  );
  await page.getByRole('button', { name: '제출하기', exact: true }).click();
  expect((await response).ok()).toBe(true);
  await page.goto('/student/peer-review');
  await expect(
    page.getByRole('textbox', { name: /^자신의 역할 요약/ }),
  ).toBeDisabled();
});
