import { expect, type Page } from '@playwright/test';

import { adminMeetingFilter, adminMeetingRow } from './adminMeetingFilter';
import { gotoAdminPath } from './adminNavigation';
import type { Run } from './data';
import { meetingRecordRequestPath, routeScope } from './routeScope';
import { choose, fillDate } from './ui';

async function fillMeetingBody(page: Page, body: string) {
  const editor = page.locator('[contenteditable="true"]');
  await expect(editor).toHaveCount(1);
  const [first, ...rest] = body.split('\n');
  await editor.fill(first!);
  await editor.press('ControlOrMeta+End');
  for (const paragraph of rest) {
    await editor.press('Enter');
    await page.keyboard.insertText(paragraph);
  }
}

export function meetingBody(page: Page) {
  return page.locator('section').filter({
    has: page.getByRole('heading', { name: '회의 내용', exact: true }),
  });
}
export function meetingPath(page: Page) {
  const path = new URL(page.url()).pathname;
  expect(path).toMatch(/^\/student\/meetings\/\d+$/);
  return path;
}
export async function readMeeting(
  page: Page,
  run: Run,
  edited = false,
  admin = false,
) {
  const title = edited ? run.meetingEditedTitle : run.meetingTitle;
  const body = edited ? run.meetingEditedBody : run.meetingBody;
  await expect(
    page.getByRole('heading', {
      level: admin ? 2 : 1,
      name: title,
      exact: true,
    }),
  ).toBeVisible();
  const section = meetingBody(page);
  const paragraphs = body.split('\n');
  expect(paragraphs.length).toBeGreaterThanOrEqual(2);
  let previousBottom: number | undefined;
  for (const paragraph of paragraphs) {
    const text = section.locator('p').filter({ hasText: paragraph });
    await expect(text).toHaveText(paragraph);
    await expect(text).toBeVisible();
    const box = await text.boundingBox();
    expect(
      box,
      'Each meeting paragraph has a visible layout box',
    ).not.toBeNull();
    if (previousBottom !== undefined)
      expect(
        box!.y,
        'Meeting paragraphs remain vertically separated',
      ).toBeGreaterThanOrEqual(previousBottom);
    previousBottom = box!.y + box!.height;
  }
  await expect(section).not.toContainText('"type":"doc"');
  await expect(section).not.toContainText('"content"');
  if (edited)
    for (const paragraph of run.meetingBody.split('\n'))
      await expect(section).not.toContainText(paragraph);
  await expect(
    page.getByText(run.meetingLocation, { exact: admin }),
  ).toBeVisible();
  const participants = page
    .locator('section')
    .filter({ has: page.getByText('참석자', { exact: true }) });
  for (const role of run.meetingParticipants)
    await expect(
      participants.getByText(run.users[role].name, { exact: true }),
    ).toBeVisible();
  if (admin) {
    await expect(
      page.getByText(
        `${run.meetingDate.replaceAll('-', '.')} ${run.meetingTime}`,
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByRole('link', { name: run.team, exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole('button', { name: /수정|삭제|저장|액션 추가/ }),
    ).toHaveCount(0);
    await expect(page.locator('[contenteditable="true"]')).toHaveCount(0);
  } else {
    const date = new Intl.DateTimeFormat('ko-KR', {
      dateStyle: 'long',
      timeZone: 'Asia/Seoul',
    }).format(new Date(`${run.meetingDate}T${run.meetingTime}:00+09:00`));
    await expect(
      page.getByText(
        `${date} ${run.meetingTime} · 기획 · ${run.meetingLocation}`,
        { exact: true },
      ),
    ).toBeVisible();
  }
}
export async function createMeeting(
  page: Page,
  run: Run,
  beforeSave: () => Promise<void>,
  created: (path: string) => Promise<void>,
) {
  await page.goto('/student/meetings');
  await page.getByRole('button', { name: '새 회의록', exact: true }).click();
  await page
    .getByRole('textbox', { name: /^회의 제목/ })
    .fill(run.meetingTitle);
  await choose(page, /^회의 단계/, '기획');
  await fillDate(page, /^회의 일자/, run.meetingDate);
  await page.getByRole('textbox', { name: /^회의 시간/ }).fill(run.meetingTime);
  await page
    .getByRole('textbox', { name: '장소 (선택)', exact: true })
    .fill(run.meetingLocation);
  await page.getByRole('button', { name: /^참석자/ }).click();
  for (const role of run.meetingParticipants)
    await page
      .getByRole('option', { name: run.users[role].name, exact: true })
      .click();
  await page.keyboard.press('Escape');
  // Current Tiptap surface has one unlabelled contenteditable. Scope and count are explicit.
  await fillMeetingBody(page, run.meetingBody);
  const save = page.getByRole('button', { name: '등록', exact: true });
  await expect(save).toBeEnabled();
  await beforeSave();
  await save.click();
  await expect(page).toHaveURL(/\/student\/meetings\/\d+$/);
  await created(meetingPath(page));
  await readMeeting(page, run);
  await page.reload();
  await readMeeting(page, run);
}
export async function readAction(
  page: Page,
  run: Run,
  teamPlan = false,
  path?: string,
) {
  const scope = teamPlan
    ? page
    : page.getByRole('region', { name: '회의록 액션 플랜' });
  const row = scope.getByRole('row').filter({ hasText: run.actionText });
  await expect(row).toHaveCount(1);
  await expect(row.getByText(run.actionText, { exact: true })).toBeVisible();
  await expect(
    row.getByText(run.users[run.actionAssignee].name, { exact: true }),
  ).toBeVisible();
  await expect(row.getByText(run.actionDue, { exact: true })).toBeVisible();
  await expect(
    row.getByRole('combobox', { name: `${run.actionText} 상태`, exact: true }),
  ).toContainText(teamPlan ? '시작 전' : '할 일');
  if (teamPlan)
    await expect(
      row.getByRole('link', { name: run.actionText, exact: true }),
    ).toHaveAttribute('href', path!);
}
export async function addMeetingAction(
  page: Page,
  run: Run,
  path: string,
  beforeSave: () => Promise<void>,
  created: () => Promise<void>,
) {
  await page.goto(path);
  await page.getByRole('button', { name: '액션 추가', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: '액션 플랜 추가',
    exact: true,
  });
  await dialog
    .getByRole('textbox', { name: /^액션 항목/ })
    .fill(run.actionText);
  await choose(dialog, '담당자', run.users[run.actionAssignee].name);
  await fillDate(dialog, /^기한/, run.actionDue);
  const save = dialog.getByRole('button', { name: '추가', exact: true });
  await expect(save).toBeEnabled();
  await beforeSave();
  await save.click();
  await expect(dialog).toBeHidden();
  await readAction(page, run);
  await created();
  await page.reload();
  await readAction(page, run);
}
export async function teamActionPlan(page: Page) {
  await page.goto('/student/team/action-plans');
  await expect(
    page.getByRole('heading', { name: '팀 액션 플랜', exact: true }),
  ).toBeVisible();
  await choose(page, '상태', '전체');
  await choose(page, '담당자', '전체');
}
export async function memberMeeting(
  page: Page,
  run: Run,
  path: string,
  edited = false,
) {
  await page.goto(path);
  await readMeeting(page, run, edited);
  await readAction(page, run);
  await page.reload();
  await readMeeting(page, run, edited);
  await readAction(page, run);
  await teamActionPlan(page);
  await readAction(page, run, true, path);
  await page.reload();
  await readAction(page, run, true, path);
  await page.getByRole('link', { name: run.actionText, exact: true }).click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await readMeeting(page, run, edited);
}
export async function adminSectionMeetings(
  page: Page,
  run: Run,
  recover: () => Promise<void>,
) {
  await gotoAdminPath(page, '/admin/meetings', recover);
  const filter = adminMeetingFilter(page);
  const sectionButton = filter.getByRole('button', {
    name: run.section,
    exact: true,
  });
  await sectionButton.click();
  await expect(sectionButton).toHaveAttribute('aria-pressed', 'true');
  return routeScope(new URL(page.url())).sectionId;
}
export async function adminTeamMeetings(
  page: Page,
  run: Run,
  recover: () => Promise<void>,
) {
  await gotoAdminPath(page, '/admin/student-team', recover);
  await choose(
    page.getByRole('group', { name: '분반 선택' }),
    '분반',
    run.section,
  );
  await page.getByRole('link', { name: run.team, exact: true }).click();
  const dashboardUrl = new URL(page.url());
  const teamId = dashboardUrl.pathname.split('/').pop();
  const sectionId = routeScope(dashboardUrl).sectionId;
  const link = page
    .getByRole('region', { name: '회의록', exact: true })
    .getByRole('link', { name: '전체보기 →', exact: true });
  const href = await link.getAttribute('href');
  expect(href).toBeTruthy();
  const listUrl = new URL(href!, page.url());
  expect(routeScope(listUrl).teamId).toBe(teamId);
  expect(routeScope(listUrl).sectionId).toBe(sectionId);
  expect(sectionId).toMatch(/^\d+$/);
  await link.click();
  await expect(
    adminMeetingFilter(page).getByRole('button', {
      name: run.section,
      exact: true,
    }),
  ).toHaveAttribute('aria-pressed', 'true');
  return listUrl.pathname + listUrl.search;
}
export async function adminReadMeeting(
  page: Page,
  run: Run,
  studentPath: string,
  edited: boolean,
  observed: (detail: string, list: string) => Promise<void>,
  recover: () => Promise<void>,
) {
  const title = edited ? run.meetingEditedTitle : run.meetingTitle;
  const sectionId = await adminSectionMeetings(page, run, recover);
  await expect(adminMeetingRow(page, title)).toBeVisible();
  const listPath = await adminTeamMeetings(page, run, recover);
  expect(routeScope(new URL(listPath, page.url())).sectionId).toBe(sectionId);
  const row = adminMeetingRow(page, title);
  await expect(row).toBeVisible();
  await row.click();
  await expect(page).toHaveURL(/\/admin\/meetings\/[1-9]\d*$/);
  const detail = new URL(page.url()).pathname;
  expect(detail.split('/').pop()).toBe(studentPath.split('/').pop());
  await observed(detail, listPath);
  await readMeeting(page, run, edited, true);
  await page.reload();
  await readMeeting(page, run, edited, true);
}
export async function deniedMeeting(page: Page, run: Run, path: string) {
  for (const reload of [false, true]) {
    const response = page.waitForResponse(
      response =>
        new URL(response.url()).pathname === meetingRecordRequestPath(path) &&
        response.request().method() === 'GET',
    );
    if (reload) await page.reload();
    else await page.goto(path);
    const denial = await response;
    expect([403, 404], '다른 팀의 실제 회의록 GET은 거부되어야 함').toContain(
      denial.status(),
    );
    await expect(
      page.getByText('회의록을 찾을 수 없어요.', { exact: true }),
    ).toBeVisible();
    for (const text of [
      run.meetingTitle,
      ...run.meetingBody.split('\n'),
      run.actionText,
    ])
      await expect(page.getByText(text, { exact: true })).toHaveCount(0);
  }
}
export async function cancelDeleteMeeting(page: Page, run: Run, path: string) {
  await page.goto(path);
  await page.getByRole('button', { name: '회의록 삭제', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: '회의록 삭제 확인',
    exact: true,
  });
  await expect(
    dialog.getByText(run.meetingTitle, { exact: true }),
  ).toBeVisible();
  await dialog.getByRole('button', { name: '취소', exact: true }).click();
  await expect(dialog).toBeHidden();
  await page.reload();
  await readMeeting(page, run);
  await readAction(page, run);
}
export async function editMeeting(
  page: Page,
  run: Run,
  path: string,
  saved: () => Promise<void>,
) {
  await page.goto(path);
  await page.getByRole('button', { name: '회의록 수정', exact: true }).click();
  const title = page.getByRole('textbox', { name: /^회의 제목/ });
  await expect(title).toBeEnabled();
  await title.fill(run.meetingEditedTitle);
  await fillMeetingBody(page, run.meetingEditedBody);
  const save = page.getByRole('button', { name: '저장', exact: true });
  await expect(save).toBeEnabled();
  await save.click();
  await expect(page).toHaveURL(new RegExp(`${path}$`));
  await saved();
  await readMeeting(page, run, true);
  await page.reload();
  await readMeeting(page, run, true);
}
export async function leaveMeetingEdit(page: Page) {
  if (/\/student\/meetings\/\d+\/edit$/.test(new URL(page.url()).pathname)) {
    const cancel = page.getByRole('button', { name: '취소', exact: true });
    if (await cancel.isVisible()) {
      await cancel.click();
      const dialog = page.getByRole('dialog', { name: '회의록 편집 나가기' });
      await expect
        .poll(
          async () =>
            !new URL(page.url()).pathname.endsWith('/edit') ||
            (await dialog.isVisible()),
        )
        .toBe(true);
      if (new URL(page.url()).pathname.endsWith('/edit'))
        await dialog
          .getByRole('button', { name: '저장하지 않고 나가기', exact: true })
          .click();
    } else {
      await page
        .getByRole('link', { name: '회의록 상세로 돌아가기', exact: true })
        .click();
    }
    await expect(page).toHaveURL(/\/student\/meetings\/\d+$/);
  }
}
export async function deleteMeeting(
  page: Page,
  path: string,
  beforeDelete: () => Promise<void>,
  deleted: () => Promise<void>,
) {
  await leaveMeetingEdit(page);
  await page.goto(path);
  await page.getByRole('button', { name: '회의록 삭제', exact: true }).click();
  const dialog = page.getByRole('dialog', {
    name: '회의록 삭제 확인',
    exact: true,
  });
  const button = dialog.getByRole('button', { name: '삭제', exact: true });
  await expect(button).toBeEnabled();
  await beforeDelete();
  await button.click();
  await expect(page).toHaveURL(/\/student\/meetings$/);
  await deleted();
}
export async function studentMeetingDeleted(
  page: Page,
  run: Run,
  path: string,
) {
  await page.goto('/student/meetings');
  await expect(
    page.getByRole('heading', { name: '회의록', exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '회의록', exact: true }),
  ).toBeVisible();
  for (const title of [run.meetingTitle, run.meetingEditedTitle])
    await expect(
      page.getByRole('link', { name: title, exact: true }),
    ).toHaveCount(0);
  await teamActionPlan(page);
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '팀 액션 플랜', exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText('조건에 맞는 액션 플랜이 없어요.', { exact: true }),
  ).toBeVisible();
  await expect(page.getByText(run.actionText, { exact: true })).toHaveCount(0);
  await page.goto(path);
  await expect(
    page.getByText('회의록을 찾을 수 없어요.', { exact: true }),
  ).toBeVisible();
  for (const body of [run.meetingBody, run.meetingEditedBody])
    for (const paragraph of body.split('\n'))
      await expect(page.getByText(paragraph, { exact: true })).toHaveCount(0);
}
export async function adminMeetingDeleted(
  page: Page,
  run: Run,
  studentPath: string,
  recover: () => Promise<void>,
) {
  await adminSectionMeetings(page, run, recover);
  await expect(
    page.getByText('등록된 회의록이 없습니다.', { exact: true }),
  ).toBeVisible();
  const list = await adminTeamMeetings(page, run, recover);
  await page.reload();
  await expect(
    page.getByText('등록된 회의록이 없습니다.', { exact: true }),
  ).toBeVisible();
  for (const title of [run.meetingTitle, run.meetingEditedTitle])
    await expect(
      page.getByRole('link', { name: title, exact: true }),
    ).toHaveCount(0);
  // Identity is the already UI-observed meeting ID; no lookup of unrelated records.
  await page.goto(studentPath.replace('/student/', '/admin/'));
  await expect(
    page.getByText('회의록을 찾을 수 없습니다.', { exact: true }),
  ).toBeVisible();
  for (const body of [run.meetingBody, run.meetingEditedBody])
    for (const paragraph of body.split('\n'))
      await expect(page.getByText(paragraph, { exact: true })).toHaveCount(0);
  return list;
}
