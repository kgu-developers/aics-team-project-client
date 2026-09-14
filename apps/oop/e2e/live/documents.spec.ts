import { test, expect, signIn, setting } from './fixtures';

test('제안서 저장한 내용은 새로고침 후 유지된다', async ({ page }) => {
  await signIn(page);
  await page.goto('/student/editor/proposal/topic');
  const title = page.getByRole('textbox', { name: /^프로젝트 제목/ });
  await expect(
    title,
    '제출 전 프로젝트와 편집 가능한 계정이 필요합니다.',
  ).toBeEditable();
  const original = await title.inputValue();
  try {
    await title.fill(`E2E 저장 확인 ${Date.now()}`);
    const changed = await title.inputValue();
    const saved = page.waitForResponse(
      r =>
        /\/api\/v1\/teams\/\d+\/project$/.test(r.url()) &&
        r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: '저장', exact: true }).click();
    expect((await saved).ok()).toBe(true);
    await expect(
      page.getByText('제안서를 저장했어요.', { exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(title).toHaveValue(changed);
  } finally {
    await expect(title).toBeEditable();
    await title.fill(original);
    const restored = page.waitForResponse(
      r =>
        /\/api\/v1\/teams\/\d+\/project$/.test(r.url()) &&
        r.request().method() === 'PUT',
    );
    await page.getByRole('button', { name: '저장', exact: true }).click();
    expect((await restored).ok(), '원래 프로젝트 제목 복구').toBe(true);
    await expect(
      page.getByRole('button', { name: '저장', exact: true }),
    ).toBeDisabled();
    await page.goto('/student');
  }
});

test('서로 다른 두 계정이 같은 제안서 영역을 동시에 편집할 수 없다', async ({
  page,
  browser,
  baseURL,
}) => {
  await signIn(page);
  await page.goto('/student/editor/proposal/topic');
  await expect(
    page.getByRole('textbox', { name: /^프로젝트 제목/ }),
  ).toBeEditable();
  const context = await browser.newContext({
    baseURL,
    serviceWorkers: 'block',
  });
  try {
    const memberPage = await context.newPage();
    await signIn(memberPage, 'member');
    await memberPage.goto('/student/editor/proposal/topic');
    await expect(
      memberPage.getByRole('textbox', { name: /^프로젝트 제목/ }),
    ).toBeDisabled();
    await expect(
      memberPage.getByRole('button', { name: '저장', exact: true }),
    ).toBeDisabled();
    await expect(memberPage.getByText(/편집 중/).first()).toBeVisible();
  } finally {
    await context.close();
    await page.goto('/student');
  }
});

test('마일스톤에서 제안서와 중간보고서 작성 화면으로 이동한다', async ({
  page,
}) => {
  await signIn(page);
  await page.locator('a[href="/student/editor/proposal/topic"]').click();
  await expect(page).toHaveURL(
    /\/student\/editor\/(proposal|mid-review)\/topic$/,
  );
  await page.goto('/student/editor/mid-review/topic');
  await expect(
    page.getByRole('heading', { name: '1. 주제', exact: true }),
  ).toBeVisible();
  await expect(page.getByText(/불러오지 못/)).toHaveCount(0);
  await page.goto('/student/team');
  await expect(
    page.getByRole('cell', {
      name: setting('OOP_E2E_STUDENT_NUMBER'),
      exact: true,
    }),
  ).toBeVisible();
});

test('중간보고서 자동 저장과 새로고침 복원', async ({ page }) => {
  await signIn(page);
  await page.goto('/student/editor/mid-review/topic');
  const field = page.getByRole('textbox', { name: '주제 설명', exact: true });
  await expect(field).toBeEditable();
  const original = await field.inputValue();
  const content = `E2E 자동 저장 검증 ${Date.now()}`;
  const saveResponse = () =>
    page.waitForResponse(
      r =>
        /\/mid-reports\/\d+\/blocks\/topic$/.test(r.url()) &&
        r.request().method() === 'PATCH',
    );
  try {
    const saved = saveResponse();
    await field.fill(content);
    await field.blur();
    expect((await saved).ok()).toBe(true);
    await page.reload();
    await expect(field).toHaveValue(content);
  } finally {
    const restored = saveResponse();
    await field.fill(original);
    await field.blur();
    expect((await restored).ok()).toBe(true);
    await page.goto('/student');
  }
});
