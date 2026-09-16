import { expect, type Page } from '@playwright/test';

import type { Run } from './data';
import { choose } from './ui';

export async function readNotice(
  page: Page,
  run: Run,
  edited = false,
  admin = false,
) {
  await expect(
    page.getByRole('heading', {
      level: admin ? 2 : 1,
      name: edited ? run.noticeEditedTitle : run.noticeTitle,
      exact: true,
    }),
  ).toBeVisible();
  let previousBottom: number | undefined;
  for (const line of (edited ? run.noticeEditedBody : run.noticeBody).split(
    '\n',
  )) {
    const text = page.getByText(line, { exact: true });
    await expect(text).toBeVisible();
    const box = await text.boundingBox();
    expect(box, 'Each notice line has a visible layout box').not.toBeNull();
    if (previousBottom !== undefined)
      expect(
        box!.y,
        'Notice line breaks remain visible',
      ).toBeGreaterThanOrEqual(previousBottom);
    previousBottom = box!.y + box!.height;
  }
  await expect(
    page.getByText(
      admin
        ? `공개 범위 : ${run.section}`
        : new RegExp(
            `^분반 : .*${run.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`,
          ),
    ),
  ).toBeVisible();
  if (edited)
    for (const line of run.noticeBody.split('\n'))
      await expect(page.getByText(line, { exact: true })).toHaveCount(0);
}
export async function createNotice(
  page: Page,
  run: Run,
  beforeSave: () => Promise<void>,
  created: (path: string) => Promise<void>,
) {
  await page.goto('/admin/notices');
  await expect(
    page.getByRole('button', { name: '작성하기', exact: true }),
  ).toBeVisible();
  await page.reload();
  await page.getByRole('button', { name: '작성하기', exact: true }).click();
  await choose(page, '분반', run.section);
  await page
    .getByRole('textbox', { name: '제목', exact: true })
    .fill(run.noticeTitle);
  await page
    .getByRole('textbox', { name: '내용', exact: true })
    .fill(run.noticeBody);
  const save = page.getByRole('button', { name: '등록', exact: true });
  await expect(save).toBeEnabled();
  await beforeSave();
  await save.click();
  await expect(page).toHaveURL(/\/admin\/notices(?:\?sectionId=\d+)?$/);
  const createdLink = page.getByRole('link', {
    name: run.noticeTitle,
    exact: true,
  });
  await expect(createdLink).toHaveCount(1);
  await createdLink.click();
  await expect(page).toHaveURL(/\/admin\/notices\/\d+\?sectionId=\d+$/);
  const url = new URL(page.url());
  await created(url.pathname + url.search);
  await readNotice(page, run, false, true);
  await page.reload();
  await readNotice(page, run, false, true);
  await page
    .getByRole('link', { name: '← 공지사항 목록으로', exact: true })
    .click();
  await expect(
    page.getByRole('link', { name: run.noticeTitle, exact: true }),
  ).toHaveAttribute('href', url.pathname + url.search);
}
export async function studentReadsNotice(
  page: Page,
  run: Run,
  adminPath: string,
  evidence: (name: string) => Promise<void>,
  opened: (path: string) => Promise<void>,
) {
  await page.goto('/student/notices');
  const row = page.getByRole('row').filter({
    has: page.getByRole('link', { name: run.noticeTitle, exact: true }),
  });
  await expect(row.getByText('새 글', { exact: true })).toBeVisible();
  await evidence('unread');
  await row.getByRole('link', { name: run.noticeTitle, exact: true }).click();
  const path = new URL(page.url()).pathname;
  expect(path.split('/').pop()).toBe(
    new URL(adminPath, page.url()).pathname.split('/').pop(),
  );
  await opened(path);
  await readNotice(page, run);
  await page.reload();
  await readNotice(page, run);
  await page
    .getByRole('link', { name: '공지사항 목록으로 돌아가기', exact: true })
    .click();
  await expect(row).toBeVisible();
  await expect(row.getByText('새 글', { exact: true })).toHaveCount(0);
  await page.reload();
  await expect(row).toBeVisible();
  await expect(row.getByText('새 글', { exact: true })).toHaveCount(0);
  await evidence('read');
}
export async function editNotice(
  page: Page,
  run: Run,
  path: string,
  saved: () => Promise<void>,
) {
  await page.goto(path);
  await page.getByRole('button', { name: '수정', exact: true }).click();
  await expect(
    page.getByRole('combobox', { name: '분반', exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText(`공개 범위 : ${run.section}`, { exact: true }),
  ).toBeVisible();
  await page
    .getByRole('textbox', { name: '제목', exact: true })
    .fill(run.noticeEditedTitle);
  await page
    .getByRole('textbox', { name: '내용', exact: true })
    .fill(run.noticeEditedBody);
  const save = page.getByRole('button', { name: '저장', exact: true });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(new URL(path, page.url()).href);
  await saved();
  await page.reload();
  await readNotice(page, run, true, true);
}
export async function studentUpdatedNotice(
  page: Page,
  run: Run,
  adminPath: string,
) {
  await page.goto('/student/notices');
  await expect(
    page.getByRole('link', { name: run.noticeEditedTitle, exact: true }),
  ).toBeVisible();
  await page.reload();
  await page
    .getByRole('link', { name: run.noticeEditedTitle, exact: true })
    .click();
  expect(new URL(page.url()).pathname.split('/').pop()).toBe(
    new URL(adminPath, page.url()).pathname.split('/').pop(),
  );
  await readNotice(page, run, true);
  await page.reload();
  await readNotice(page, run, true);
}
