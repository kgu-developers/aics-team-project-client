import { paths } from './support/api';
import { test, expect } from './support/fixtures';
import { login } from './support/ui';

test('분반의 미제출 학생이 필수 역할을 선택하고 설문을 제출한다', async ({
  page,
  api,
}) => {
  api.state.user.teamId = null;
  await login(page);
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(page.getByRole('button', { name: '다음 설문' })).toBeDisabled();
  await page.getByRole('checkbox', { name: '개발', exact: true }).check();
  await page.getByRole('button', { name: '다음 설문' }).click();
  await page
    .getByRole('textbox', { name: /프로젝트 주제 아이디어/ })
    .fill('도서 대출 서비스');
  await page
    .getByRole('textbox', { name: /요청 또는 메모/ })
    .fill('주 1회 회의');
  await page.getByRole('button', { name: '설문 제출', exact: true }).click();
  await page
    .getByRole('dialog', { name: '설문 제출 확인' })
    .getByRole('button', { name: '제출', exact: true })
    .click();
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toBeVisible();
  expect(api.requests.find(r => r.path === paths.submitSurvey)?.body).toEqual({
    preferredRoles: ['DEVELOPMENT'],
    preferredPeerUserId: null,
    topicOpinion: '도서 대출 서비스',
    etcOpinion: '주 1회 회의',
  });
  await page.reload();
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toBeVisible();
});

test('선호 팀원 신청을 수락해도 본인 설문 미제출 상태를 유지한다', async ({
  page,
  api,
}) => {
  api.state.user.teamId = null;
  api.state.receivedPreferredPeerRequests = [
    {
      requesterUserId: '20269902',
      requesterName: 'E2E 신청 학생',
      status: 'PENDING',
    },
  ];

  await login(page);
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(
    page.getByRole('region', { name: '받은 파트너 신청' }),
  ).toContainText('E2E 신청 학생');
  await page.getByRole('button', { name: '승인', exact: true }).click();
  await page
    .getByRole('dialog', { name: '파트너 확정 확인' })
    .getByRole('button', { name: '파트너 확정', exact: true })
    .click();

  await expect(
    page.getByRole('region', { name: '확정된 파트너' }),
  ).toBeVisible();
  await expect(
    page.getByRole('region', { name: '팀 구성 설문' }),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: '다음 설문', exact: true }),
  ).toBeDisabled();
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toHaveCount(0);
  expect(
    api.requests.some(request => request.path === paths.submitSurvey),
  ).toBe(false);

  await page.reload();
  await page.getByRole('button', { name: '시작하기' }).click();
  await expect(
    page.getByRole('region', { name: '팀 구성 설문' }),
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: '설문에 응답해 주셔서 감사합니다.' }),
  ).toHaveCount(0);
});

test('분반이 없으면 설문이나 팀 API를 호출하지 않는다', async ({
  page,
  api,
}) => {
  api.state.user.teamId = null;
  api.state.user.sections = [];
  api.state.sections = [];
  await login(page);
  await expect(
    page.getByRole('heading', { name: '소속 분반이 없어요.' }),
  ).toBeVisible();
  expect(
    api.requests.some(
      r => r.path === paths.survey || r.path.includes('/kickoff'),
    ),
  ).toBe(false);
});
