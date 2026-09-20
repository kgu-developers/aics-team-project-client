import { expect, type Page } from '@playwright/test';

import { enrollmentFile, teamFile, type Run } from './data';
import { choose } from './ui';

async function findCourseRow(page: Page, courseName: string) {
  while (true) {
    const row = page
      .getByRole('row')
      .filter({
        has: page.getByRole('cell', { name: courseName, exact: true }),
      });
    if ((await row.count()) > 0) return row;

    const nextPage = page.getByRole('button', { name: '다음 페이지' });
    if (await nextPage.isDisabled()) {
      throw new Error(`등록한 강좌를 목록에서 찾을 수 없습니다: ${courseName}`);
    }
    await nextPage.click();
  }
}

export async function prepareCourse(page: Page, run: Run) {
  // A sidebar transition can leave the dashboard mounted while Vite loads
  // the cold route. Navigate directly and wait for the destination UI.
  await page.goto('/admin/sections', {
    waitUntil: 'domcontentloaded',
    timeout: 60_000,
  });
  await expect(
    page.getByRole('heading', {
      name: '강좌·분반 관리',
      level: 1,
      exact: true,
    }),
  ).toBeVisible({ timeout: 60_000 });
  await page
    .getByRole('button', { name: '강좌 등록', exact: true })
    .click({ timeout: 60_000 });
  const courseDialog = page.getByRole('dialog', {
    name: '강좌 등록',
    exact: true,
  });
  await courseDialog.getByRole('textbox', { name: /^강좌명/ }).fill(run.course);
  await choose(courseDialog, '운영 상태', '운영 중');
  await courseDialog.getByRole('button', { name: '등록', exact: true }).click();
  await expect(courseDialog).toBeHidden();
  const row = await findCourseRow(page, run.course);
  await row.click();
  await expect(page).toHaveURL(/\/admin\/sections\/\d+$/);
  run.coursePath = new URL(page.url()).pathname;
  await expect(
    page.getByRole('heading', { name: run.course, level: 1, exact: true }),
  ).toBeVisible();
  await page
    .getByRole('button', { name: '분반 등록', exact: true })
    .click();
  const sectionDialog = page.getByRole('dialog', {
    name: `${run.course} 분반 등록`,
    exact: true,
  });
  await sectionDialog
    .getByRole('textbox', { name: /^분반 코드/ })
    .fill(run.section);
  await sectionDialog
    .getByRole('textbox', { name: /^수업 시간/ })
    .fill('통합 테스트 전용');
  await sectionDialog.getByLabel(/^정원/).fill('20');
  await sectionDialog
    .getByRole('button', { name: '등록', exact: true })
    .click();
  await expect(sectionDialog).toBeHidden();
  await expect(
    page
      .getByRole('table', { name: '연결된 분반 목록' })
      .getByRole('cell', { name: run.section, exact: true }),
  ).toBeVisible();
}

export async function importStudents(page: Page, run: Run) {
  await page.goto(run.coursePath);
  await page
    .getByRole('button', { name: '학생 명단 파일 선택', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: '수강생 명단 엑셀 업로드',
    exact: true,
  });
  await expect(
    dialog.getByRole('combobox', { name: '분반', exact: true }),
  ).toContainText(run.section);
  await dialog
    .locator('input[type="file"]')
    .setInputFiles(await enrollmentFile(run));
  await dialog.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(dialog.getByText('전체 7건', { exact: true })).toBeVisible();
  await expect(
    dialog.getByText('신규 계정 7건', { exact: true }),
  ).toBeVisible();
  await expect(dialog.getByText('오류 0건', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '반영하기', exact: true }).click();
  await expect(
    dialog.getByRole('status', { name: '명단 반영 결과' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(dialog).toBeHidden();
}

export async function importTeams(page: Page, run: Run) {
  await page.goto(run.coursePath);
  await page
    .getByRole('button', { name: '팀 구성 명단 파일 선택', exact: true })
    .click();
  const dialog = page.getByRole('dialog', {
    name: '팀 명단 엑셀 업로드',
    exact: true,
  });
  await expect(
    dialog.getByRole('combobox', { name: '분반', exact: true }),
  ).toContainText(run.section);
  await dialog.locator('input[type="file"]').setInputFiles(await teamFile(run));
  await dialog.getByRole('button', { name: '미리보기', exact: true }).click();
  await expect(dialog.getByText('전체 6건', { exact: true })).toBeVisible();
  await expect(dialog.getByText('오류 0건', { exact: true })).toBeVisible();
  await dialog.getByRole('button', { name: '반영하기', exact: true }).click();
  await expect(
    dialog.getByRole('status', { name: '명단 반영 결과' }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.goto('/admin/student-team');
  await choose(
    page.getByRole('group', { name: '분반 선택' }),
    '분반',
    run.section,
  );
  await expect(
    page.getByRole('heading', { name: `${run.section} 팀 구성`, exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '팀 배정 확정', exact: true }).click();
  const confirmation = page.getByRole('alertdialog', {
    name: '팀 배정 확정 확인',
    exact: true,
  });
  await confirmation
    .getByRole('button', { name: '확정하기', exact: true })
    .click();
  await expect(confirmation).toBeHidden();
  await expect(page.getByText(run.team, { exact: true }).first()).toBeVisible();
}
