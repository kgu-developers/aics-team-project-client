import { expect, type Page } from '@playwright/test';

import type { Run } from './data';
import { choose, fillDate } from './ui';

export const milestoneNames = [
  '제안서',
  '중간 점검',
  '발표',
  '최종 보고서',
  '상호 평가',
] as const;
export type MilestoneName = (typeof milestoneNames)[number];
export type MilestoneLinks = Record<MilestoneName, string>;

export async function createMilestones(
  page: Page,
  run: Run,
  names: readonly MilestoneName[] = milestoneNames,
) {
  const links = {} as MilestoneLinks;
  for (const name of names) {
    await page.goto('/admin/milestones/new', { waitUntil: 'domcontentloaded' });
    const sections = page.getByRole('combobox', {
      name: '대상 분반',
      exact: true,
    });
    await sections.press('Delete');
    await sections.click();
    await page.getByRole('option', { name: new RegExp(run.section) }).click();
    await page.keyboard.press('Escape');
    await choose(page, '마일스톤 기본 양식', name);
    await page
      .getByRole('spinbutton', { name: '진행 주차', exact: true })
      .fill(String(milestoneNames.indexOf(name) + 1));
    await fillDate(page, `${run.section} 공개 시작일`, run.opened);
    await page
      .getByLabel(`${run.section} 공개 시작 시간`, { exact: true })
      .fill('00:00');
    if (name === '상호 평가') {
      await fillDate(page, `${run.section} 상호 평가 시작일`, run.opened);
      await fillDate(page, `${run.section} 상호 평가 종료일`, run.due);
      await page
        .getByLabel(`${run.section} 평가 시작 시간`, { exact: true })
        .fill('00:00');
      await page
        .getByLabel(`${run.section} 평가 종료 시간`, { exact: true })
        .fill('23:59');
    } else {
      await fillDate(page, `${run.section} 제출 마감일`, run.due);
      await page
        .getByLabel(`${run.section} 제출 마감 시간`, { exact: true })
        .fill('23:59');
    }
    await choose(page, `${run.section} 공개 상태`, '공개');
    await page
      .getByRole('checkbox', { name: '제출 마감 전 수정 허용', exact: true })
      .check();
    if (name === '발표' || name === '최종 보고서') {
      // Replace only this unsaved preset with a single PDF rule.
      const remove = page.getByRole('button', { name: '삭제', exact: true });
      while (await remove.count()) await remove.first().click();
      await page
        .getByRole('button', { name: '산출물 추가', exact: true })
        .click();
      const artifact = page.getByRole('dialog', {
        name: '산출물 초안 추가',
        exact: true,
      });
      await artifact
        .getByRole('textbox', { name: /^산출물 이름/ })
        .fill('통합 검증 PDF');
      await choose(artifact, '유형', '파일');
      await artifact.getByRole('textbox', { name: /^허용 확장자/ }).fill('pdf');
      await artifact
        .getByRole('spinbutton', { name: '최대 파일 용량(MB)', exact: true })
        .fill('5');
      await artifact
        .getByRole('checkbox', { name: '필수 제출', exact: true })
        .check();
      await artifact.getByRole('button', { name: '추가', exact: true }).click();
      await expect(artifact).toBeHidden();
    }
    await page.getByRole('button', { name: '저장', exact: true }).click();
    await expect(page.getByText(/생성하고 공개했습니다/)).toBeVisible();
    await expect(
      page.getByText(/산출물 일부 등록에 실패|상호평가 양식 생성에 실패/),
    ).toHaveCount(0);
    await page.goto('/admin/milestones', { waitUntil: 'domcontentloaded' });
    await page
      .getByRole('group', { name: '분반 필터' })
      .getByRole('button', { name: run.section, exact: true })
      .click();
    const link = page.getByRole('link', { name, exact: true });
    await expect(link).toBeVisible();
    const href = await link.getAttribute('href');
    expect(href).toBeTruthy();
    links[name] = href!;
  }
  return links;
}

export async function openPresentationWindow(
  page: Page,
  run: Run,
  href: string,
) {
  await page.goto(href, { waitUntil: 'domcontentloaded' });
  await page.getByRole('button', { name: '수정', exact: true }).click();
  // Uploads already exist. Move the deadline into the past and open the actual server evaluation period.
  await fillDate(page, `${run.section} 공개 시작일`, run.opened);
  await page
    .getByLabel(`${run.section} 공개 시작 시간`, { exact: true })
    .fill('00:00');
  await fillDate(page, `${run.section} 제출 마감일`, run.yesterday);
  await page
    .getByLabel(`${run.section} 제출 마감 시간`, { exact: true })
    .fill('01:00');
  await fillDate(page, `${run.section} 발표 평가 시작일`, run.yesterday);
  await page
    .getByLabel(`${run.section} 평가 시작 시간`, { exact: true })
    .fill('02:00');
  await fillDate(page, `${run.section} 발표 평가 종료일`, run.tomorrow);
  await page
    .getByLabel(`${run.section} 평가 종료 시간`, { exact: true })
    .fill('23:59');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: /마일스톤 > 발표/ }),
  ).toBeVisible();
}

export function studentMilestone(page: Page, href: string) {
  const id = new URL(href, 'http://localhost').pathname.split('/').at(-1);
  return page.locator(`#student-milestone-${id}`);
}
