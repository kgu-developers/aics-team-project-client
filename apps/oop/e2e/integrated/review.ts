import { readFile } from 'node:fs/promises';

import { expect, type Page } from '@playwright/test';

import type { Run } from './data';
import { choose } from './ui';

export async function submissions(page: Page, run: Run, tab: string) {
  await page.goto('/admin/submissions');
  await choose(page, '조회할 분반', new RegExp(run.section));
  await page.getByRole('tab', { name: tab, exact: true }).click();
}

export async function downloadSubmission(
  page: Page,
  run: Run,
  tab: string,
  version: number,
) {
  await submissions(page, run, tab);
  const card = page.getByRole('article').filter({ hasText: run.team });
  await expect(
    card.getByText(`현재 버전: ${version}차`, { exact: true }),
  ).toBeVisible();
  await expect(
    card.getByRole('link', { name: 'e2e-submission.pdf', exact: true }),
  ).toBeVisible();
  const [download] = await Promise.all([
    page.waitForEvent('download', { timeout: 60_000 }),
    card.getByRole('button', { name: '일괄 다운로드', exact: true }).click(),
  ]);
  expect(await download.failure()).toBeNull();
  expect(download.suggestedFilename()).toMatch(/\.zip$/i);
  const path = await download.path();
  expect(path).toBeTruthy();
  // Read only the file delivered by the browser's download UI.
  const bytes = await readFile(path!);
  expect(bytes.subarray(0, 2).toString()).toBe('PK');
}

export async function submissionDetail(page: Page, run: Run, tab: string) {
  await submissions(page, run, tab);
  const card = page.getByRole('article').filter({ hasText: run.team });
  await expect(card).toBeVisible();
  await card.getByRole('link', { name: '상세보기', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: `제출물 > ${tab}`, exact: true }),
  ).toBeVisible();
}

export async function proposalFeedback(page: Page, run: Run) {
  await submissionDetail(page, run, '제안서');
  await expect(
    page.getByText(run.title, { exact: true }).first(),
  ).toBeVisible();
  const feedback = `도서 대출 예외 처리를 보완해 주세요. ${run.key}`;
  await page
    .getByRole('textbox', { name: '제안서 피드백 내용', exact: true })
    .fill(feedback);
  await page
    .getByRole('button', { name: '피드백 보내기', exact: true })
    .click();
  await expect(
    page.getByRole('article').getByText(feedback, { exact: true }),
  ).toBeVisible();
  return feedback;
}

export async function midReportFeedback(page: Page, run: Run) {
  await submissionDetail(page, run, '중간 점검');
  const feedback = `설명과 테스트 결과를 각 영역에 보완해 주세요. ${run.key}`;
  await page
    .getByRole('textbox', { name: '중간 점검 피드백 내용', exact: true })
    .fill(feedback);
  await page
    .getByRole('button', { name: '수정 요청 보내기', exact: true })
    .click();
  await expect(
    page.getByRole('article').getByText(feedback, { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText(/상태: REVISION_REQUESTED · 현재 버전:/),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '수정 요청 보내기', exact: true }),
  ).toBeDisabled();
  return feedback;
}

export async function presentationSettings(page: Page, run: Run) {
  await submissions(page, run, '발표 평가');
  await page
    .getByRole('button', { name: '순서 배정 및 평가', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: '발표 평가 설정',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: /^평가 항목명/ })
    .fill('설계 완성도');
  await dialog.getByRole('spinbutton', { name: '배점', exact: true }).fill('5');
  await dialog
    .getByRole('button', { name: '평가 항목 추가', exact: true })
    .click();
  await expect(dialog.getByText(/설계 완성도 · 5점$/)).toBeVisible();
  // Adding a criterion refreshes the settings; assign the order afterwards.
  await choose(dialog, `${run.team} 발표 순서`, '1번');
  await choose(dialog, `${run.comparison} 발표 순서`, '2번');
  await dialog.getByRole('button', { name: '저장', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await page
    .getByRole('button', { name: '순서 배정 및 평가', exact: true })
    .click();
  await expect(dialog.getByText(/설계 완성도 · 5점$/)).toBeVisible();
  await expect(
    dialog.getByRole('combobox', {
      name: `${run.team} 발표 순서`,
      exact: true,
    }),
  ).toContainText('1번');
  await expect(
    dialog.getByRole('combobox', {
      name: `${run.comparison} 발표 순서`,
      exact: true,
    }),
  ).toContainText('2번');
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function evaluatePresentation(page: Page, run: Run) {
  await page.goto('/student/presentation-evaluation');
  // Own team is first; navigation to the other team is part of the user flow.
  await page.getByRole('button', { name: '다음 팀', exact: true }).click();
  await expect(page.getByText(run.comparison, { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: '5점', exact: true }).check();
  await page.getByRole('button', { name: '평가 제출', exact: true }).click();
  await expect(
    page.getByText(`${run.comparison} 평가를 제출했어요.`, { exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '다음 팀', exact: true }).click();
  await expect(
    page.getByRole('radio', { name: '5점', exact: true }),
  ).toBeChecked();
}
