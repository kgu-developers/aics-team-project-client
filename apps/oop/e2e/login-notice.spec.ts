import { test, expect } from './support/fixtures';
import { login } from './support/ui';

const title = '중간보고서 피드백 반영 계획 안내';

test('로그인 공지의 닫기·새로고침·7일 숨김과 만료를 확인한다', async ({
  page,
}) => {
  await page.clock.setFixedTime(new Date('2026-11-18T12:00:00+09:00'));
  await login(page);
  await expect(page).toHaveURL(/\/student\/?$/);
  const dialog = page.getByRole('dialog', { name: title });
  await expect(dialog).toBeVisible();
  await expect(dialog).toContainText(
    '중간점검 후 교수님 피드백에 대해 [반영 방향 보내기] 버튼을 누르고 작성 및 제출해주세요. 기한 : 11.20(금) 자정',
  );
  await page.screenshot({
    path: '../../.agent-local/screenshots/KD3-339-desktop.png',
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(dialog).toBeVisible();
  const bounds = await dialog.boundingBox();
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(0);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(390);
  await page.screenshot({
    path: '../../.agent-local/screenshots/KD3-339-mobile.png',
  });
  await dialog.getByRole('button', { name: '닫기', exact: true }).click();
  await expect(dialog).toHaveCount(0);
  await page.getByRole('link', { name: 'OOTeamPlay 홈' }).click();
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await expect(dialog).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(dialog).toHaveCount(0);
  await page.reload();
  await dialog.getByRole('button', { name: '일주일간 안 보기' }).click();
  await page.reload();
  await expect(
    page.getByRole('button', { name: '내 프로필 열기' }),
  ).toBeVisible();
  await expect(dialog).toHaveCount(0);
  await page.clock.setFixedTime(new Date('2026-11-25T12:00:00+09:00'));
  await page.reload();
  await expect(dialog).toBeVisible();
});
