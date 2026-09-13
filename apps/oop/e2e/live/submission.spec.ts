import { Buffer } from 'node:buffer';

import { test, expect, signIn, setting, mutate } from './fixtures';

function pdfFile() {
  // A real one-page PDF, generated in memory without private or binary fixtures.
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 300 200] /Contents 4 0 R >>',
    '<< /Length 0 >>\nstream\n\nendstream',
  ];
  let source = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, i) => {
    offsets.push(Buffer.byteLength(source));
    source += `${i + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(source);
  source += `xref\n0 5\n0000000000 65535 f \n${offsets
    .slice(1)
    .map(offset => String(offset).padStart(10, '0') + ' 00000 n ')
    .join(
      '\n',
    )}\ntrailer\n<< /Size 5 /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
  return {
    name: 'e2e-submission.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.from(source),
  };
}

for (const [kind, title, dialogName] of [
  ['PRESENTATION', '발표', '발표 자료 제출'],
  ['FINAL_REPORT', '최종보고서', '최종 파일 제출'],
] as const) {
  test(`@submit ${title} 파일 제출과 새 버전 조회`, async ({ page }) => {
    const milestoneId = setting(`OOP_E2E_${kind}_ID`);
    const before = page.waitForResponse(
      r =>
        new URL(r.url()).pathname ===
        `/milestones/${milestoneId}/my-team-submission`,
    );
    await signIn(page);
    const previousVersion = (await (await before).json()).currentVersion;
    const card = page.locator(
      `#student-milestone-${setting(`OOP_E2E_${kind}_ID`)}`,
    );
    await expect(card).toBeVisible();
    await card
      .getByRole('button', {
        name: /^(파일 제출|파일 교체|재제출|파일 재제출|제출하기)$/,
      })
      .click();
    const dialog = page.getByRole('dialog', { name: dialogName });
    await dialog
      .getByRole('textbox', { name: /^제출 설명/ })
      .fill('E2E 파일 제출 검증');
    const change = dialog.getByRole('textbox', { name: /^변경 사항/ });
    if (await change.isVisible()) await change.fill('E2E 재제출 검증');
    // FileInput's native input is visually hidden; setInputFiles is the upload API.
    await dialog.locator('input[type="file"]').setInputFiles(pdfFile());
    const saved = page.waitForResponse(
      r =>
        /\/submissions\/\d+\/versions$/.test(new URL(r.url()).pathname) &&
        r.request().method() === 'POST',
    );
    await dialog
      .getByRole('button', { name: /^(파일 제출|파일 재제출)$/ })
      .click();
    const response = await saved;
    expect(response.ok()).toBe(true);
    expect((await response.json()).currentVersion).toBe(previousVersion + 1);
    await expect(dialog.getByText(/파일 제출을 저장했어요/)).toBeVisible();
    await page.keyboard.press('Escape');
    const persisted = page.waitForResponse(
      r =>
        new URL(r.url()).pathname ===
        `/milestones/${milestoneId}/my-team-submission`,
    );
    await page.reload();
    const reloaded = await persisted;
    expect(reloaded.ok()).toBe(true);
    expect((await reloaded.json()).currentVersion).toBe(previousVersion + 1);
    await expect(
      card.getByText('제출 완료', { exact: true }).first(),
    ).toBeVisible();
  });
}

test('@submit 최종보고서 팀원 승인과 취소', async ({ page }) => {
  await signIn(page, 'member');
  const card = page.locator(
    `#student-milestone-${setting('OOP_E2E_FINAL_REPORT_ID')}`,
  );
  const endpoint = /\/submissions\/\d+\/member-confirmations\/me$/;
  let confirmationPath: string | undefined;
  try {
    const confirmed = page.waitForResponse(
      r =>
        endpoint.test(new URL(r.url()).pathname) &&
        r.request().method() === 'PUT',
    );
    await card.getByRole('button', { name: '승인하기', exact: true }).click();
    const response = await confirmed;
    expect(response.ok()).toBe(true);
    confirmationPath = new URL(response.url()).pathname;
    expect((await response.json()).isConfirmedByMe).toBe(true);
    await expect(
      card.getByRole('button', { name: '승인 취소', exact: true }),
    ).toBeEnabled();
    await page.reload();
    const cancelled = page.waitForResponse(
      r =>
        endpoint.test(new URL(r.url()).pathname) &&
        r.request().method() === 'DELETE',
    );
    await card.getByRole('button', { name: '승인 취소', exact: true }).click();
    const cancellation = await cancelled;
    expect(cancellation.ok()).toBe(true);
    expect((await cancellation.json()).isConfirmedByMe).toBe(false);
    confirmationPath = undefined;
    await expect(
      card.getByRole('button', { name: '승인하기', exact: true }),
    ).toBeEnabled();
  } finally {
    if (confirmationPath) {
      const restored = await mutate(page, 'DELETE', confirmationPath);
      expect(restored.status, '이 테스트에서 추가한 승인 취소').toBe(200);
    }
  }
});
