import { paths } from './support/api';
import { test, expect } from './support/fixtures';
import { loginToHome } from './support/ui';

test('제안서 편집 잠금 → 저장 → 작성 완료 → 새로고침 복원', async ({
  page,
  api,
}) => {
  await loginToHome(page);
  await page.goto('/student/editor/proposal/topic');
  const title = page.getByRole('textbox', { name: /^프로젝트 제목/ });
  await expect(title).toBeEditable();
  await title.fill('E2E 수정한 프로젝트');
  await expect(
    page.getByRole('button', { name: '작성 완료', exact: true }),
  ).toBeDisabled();
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(
    page.getByText('제안서를 저장했어요.', { exact: true }),
  ).toBeVisible();
  await page.getByRole('button', { name: '작성 완료', exact: true }).click();
  await expect(
    page.getByText('영역을 작성 완료했어요.', { exact: true }),
  ).toBeVisible();
  await page.reload();
  await expect(title).toHaveValue('E2E 수정한 프로젝트');
  await expect(
    page.getByRole('button', { name: '작성 완료', exact: true }),
  ).toBeDisabled();
  expect(
    api.requests.find(r => r.method === 'PUT' && r.path === paths.project)
      ?.body,
  ).toMatchObject({
    title: 'E2E 수정한 프로젝트',
    goal: '대출과 반납을 관리한다',
  });
});

test('다른 계정이 편집 중이면 수정과 저장이 차단된다', async ({
  page,
  api,
}) => {
  api.state.lockOwner = '20269902';
  await loginToHome(page);
  await page.goto('/student/editor/proposal/topic');
  await expect(
    page.getByRole('textbox', { name: /^프로젝트 제목/ }),
  ).toBeDisabled();
  await expect(page.getByText(/다른 편집자/).first()).toBeVisible();
  await expect(
    page.getByRole('button', { name: '저장', exact: true }),
  ).toBeDisabled();
});

test('저장 실패 뒤 입력을 유지하고 재시도한다', async ({ page, api }) => {
  api.respond('PUT', paths.project, 500, { code: 'INTERNAL_ERROR' }, 1);
  await loginToHome(page);
  await page.goto('/student/editor/proposal/topic');
  const title = page.getByRole('textbox', { name: /^프로젝트 제목/ });
  await expect(title).toBeEditable();
  await title.fill('재시도할 프로젝트');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(
    page
      .getByRole('alert')
      .filter({ hasText: /처리|저장|오류|시도/ })
      .first(),
  ).toBeVisible();
  await expect(title).toHaveValue('재시도할 프로젝트');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect(
    page.getByText('제안서를 저장했어요.', { exact: true }),
  ).toBeVisible();
});

test('모든 영역 완료 후 팀장 제출하면 문서는 읽기 전용이 된다', async ({
  page,
  api,
}) => {
  api.state.proposalSections.contents.forEach(item => {
    item.completed = true;
  });
  await loginToHome(page);
  await page.getByRole('button', { name: '제출하기', exact: true }).click();
  await expect(
    page.getByText(/제출 완료 · 교수\/조교 피드백/).first(),
  ).toBeVisible();
  await page.goto('/student/editor/proposal/topic');
  await expect(
    page.getByRole('textbox', { name: /^프로젝트 제목/ }),
  ).toBeDisabled();
  await expect(
    page.getByRole('button', { name: '저장', exact: true }),
  ).toHaveCount(0);
  expect(
    api.requests.filter(r => r.path === paths.proposalComplete),
  ).toHaveLength(1);
});
