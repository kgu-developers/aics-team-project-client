import { test, expect, signIn, mutate } from './fixtures';

/** Creates only its own record; cleanup also runs when a later assertion fails. */
test('회의록 작성 → 액션 추가 → 회의록 수정 → 삭제', async ({ page }) => {
  await signIn(page);
  const title = `E2E 회의 ${Date.now()}`;
  let meetingId: string | undefined;
  try {
    await page.goto('/student/meetings');
    await page.getByRole('button', { name: '새 회의록', exact: true }).click();
    await expect(
      page.getByRole('button', { name: '등록', exact: true }),
    ).toBeDisabled();
    await page.getByRole('textbox', { name: /^회의 제목/ }).fill(title);
    await page.getByRole('combobox', { name: /^회의 단계/ }).click();
    await page.getByRole('option', { name: '기획', exact: true }).click();
    const date = page.getByRole('combobox', { name: /^회의 일자/ });
    await date.fill(new Date().toISOString().slice(0, 10));
    await date.press('Tab');
    await page.getByRole('textbox', { name: /^회의 시간/ }).fill('10:30');
    await page.getByRole('textbox', { name: /장소/ }).fill('E2E 테스트실');
    await page.getByRole('button', { name: /^참석자/ }).click();
    await page.getByRole('option').first().click();
    await page.keyboard.press('Escape');
    // Tiptap exposes contenteditable, but the current editor has no accessible label.
    await page
      .locator('[contenteditable="true"]')
      .fill('E2E 회의록 본문. 역할과 진행 일정을 확인합니다.');
    const created = page.waitForResponse(
      r =>
        /\/teams\/\d+\/meeting-records$/.test(r.url()) &&
        r.request().method() === 'POST',
    );
    await page.getByRole('button', { name: '등록', exact: true }).click();
    const creation = await created;
    expect(creation.ok()).toBe(true);
    meetingId = String((await creation.json()).id);
    await expect(page).toHaveURL(new RegExp(`/student/meetings/${meetingId}$`));
    await expect(
      page.getByRole('heading', { name: title, exact: true }),
    ).toBeVisible();

    await page.getByRole('button', { name: '액션 추가', exact: true }).click();
    const dialog = page.getByRole('dialog', {
      name: '액션 플랜 추가',
      exact: true,
    });
    await dialog
      .getByRole('textbox', { name: /^액션 항목/ })
      .fill(`${title} 구현 확인`);
    await dialog.getByRole('button', { name: '추가', exact: true }).click();
    await expect(dialog).toBeHidden();
    await expect(
      page.getByText(`${title} 구현 확인`, { exact: true }),
    ).toBeVisible();

    await page
      .getByRole('button', { name: '회의록 수정', exact: true })
      .click();
    await page
      .getByRole('textbox', { name: /^회의 제목/ })
      .fill(`${title} 수정`);
    const updated = page.waitForResponse(
      r =>
        r.url().endsWith(`/meeting-records/${meetingId}`) &&
        r.request().method() === 'PATCH',
    );
    await page.getByRole('button', { name: '저장', exact: true }).click();
    expect((await updated).ok()).toBe(true);
    await expect(
      page.getByRole('heading', { name: `${title} 수정`, exact: true }),
    ).toBeVisible();
    await page.reload();
    await expect(
      page.getByText('E2E 회의록 본문. 역할과 진행 일정을 확인합니다.', {
        exact: true,
      }),
    ).toBeVisible();
    await page
      .getByRole('button', { name: '회의록 삭제', exact: true })
      .click();
    await page
      .getByRole('dialog', { name: '회의록 삭제 확인' })
      .getByRole('button', { name: '삭제', exact: true })
      .click();
    await expect(page).toHaveURL(/\/student\/meetings$/);
    await expect(page.getByText(`${title} 수정`, { exact: true })).toHaveCount(
      0,
    );
    meetingId = undefined;
  } finally {
    if (meetingId) {
      const result = await mutate(
        page,
        'DELETE',
        `/meeting-records/${meetingId}`,
      );
      expect([200, 204, 404], '이 테스트에서 만든 회의록 정리').toContain(
        result.status,
      );
    }
  }
});
