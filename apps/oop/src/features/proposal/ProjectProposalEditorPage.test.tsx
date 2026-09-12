import {
  API_BASE_URL,
  ENDPOINTS,
  fetchProjectProposal,
  fetchProposalSections,
  updateProjectProposal,
  submitProjectProposal,
} from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import { proposalDraft, mergeProposalSection } from './projectProposal';
import ProposalEditorPage from './ProposalEditorPage';

import {
  createProjectProposalFixture,
  createProposalSectionsFixture,
} from '~/mocks/data/projectProposal';
import {
  demoStudent,
  demoPartnerStudent,
  demoAccessToken,
  demoPartnerAccessToken,
} from '~/mocks/data/users';
import { createLiveEditLockHandlers } from '~/mocks/handlers/liveEditLock';
import { createProjectProposalHandlers } from '~/mocks/handlers/projectProposal';
import { renderWithRouter } from '~/test/renderWithRouter';

const server = setupServer();
let client: QueryClient;
const projectUrl = `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.BY_TEAM('19')}`;
const lockUrl = `${API_BASE_URL}${ENDPOINTS.EDIT_LOCKS.ROOT}`;
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  vi.stubEnv('VITE_ENABLE_MSW', 'false');
  client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '19' });
  server.use(
    ...createProjectProposalHandlers(),
    ...createLiveEditLockHandlers(),
  );
});
afterEach(() => {
  client.clear();
  server.resetHandlers();
  useAuthStore.getState().clearSession();
  vi.unstubAllEnvs();
});
afterAll(() => server.close());
function render(section = 'topic') {
  return renderWithRouter(
    <AstryxThemeProvider>
      <QueryClientProvider client={client}>
        <ToastViewport>
          <ProposalEditorPage section={section} />
        </ToastViewport>
      </QueryClientProvider>
    </AstryxThemeProvider>,
  );
}
async function start() {
  await waitFor(() =>
    expect(screen.getByLabelText(/프로젝트 제목/)).toBeEnabled(),
  );
}
it('팀 ID 없이는 업무 API를 호출하지 않는다', async () => {
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: null });
  const get = vi.fn(() => HttpResponse.json(createProjectProposalFixture()));
  server.use(http.get(projectUrl, get));
  render();
  expect(await screen.findByText('팀 정보가 필요해요.')).toBeInTheDocument();
  expect(get).not.toHaveBeenCalled();
});
it('편집 잠금 획득 후 저장한 주제를 다시 조회한다', async () => {
  render();
  await start();
  await userEvent.clear(screen.getByLabelText(/프로젝트 제목/));
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), '새 프로젝트');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');
  expect((await fetchProjectProposal('19'))?.title).toBe('새 프로젝트');
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
});
it('섹션을 떠나면 획득한 이전 섹션 락을 해제한다', async () => {
  const deletedSections: string[] = [];
  const onRequest = ({ request }: { request: Request }) => {
    if (request.method !== 'DELETE') return;
    const sectionKey = new URL(request.url).searchParams.get('sectionKey');
    if (sectionKey) deletedSections.push(sectionKey);
  };
  server.events.on('request:start', onRequest);
  const view = render();
  try {
    await start();
    view.unmount();
    await waitFor(() => expect(deletedSections).toContain('TOPIC'));
  } finally {
    server.events.removeListener('request:start', onRequest);
  }
});
it('같은 섹션에 다시 들어가면 입력 권한을 다시 활성화한다', async () => {
  const requests: string[] = [];
  const onRequest = ({ request }: { request: Request }) => {
    if (request.method === 'DELETE' || request.method === 'POST')
      requests.push(request.method);
  };
  server.events.on('request:start', onRequest);
  const firstView = render();
  try {
    await start();
    firstView.unmount();
    render();
    await start();
    expect(requests).toContain('DELETE');
    expect(requests.filter(method => method === 'POST')).toHaveLength(2);
  } finally {
    server.events.removeListener('request:start', onRequest);
  }
});
it('같은 영역이 서버에서 변경되면 덮어쓰지 않고 입력을 유지한다', async () => {
  render();
  await start();
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), ' 내 초안');
  const changed = createProjectProposalFixture();
  changed.title = '다른 팀원의 제목';
  const put = vi.fn(() => HttpResponse.json(changed));
  server.use(
    http.get(projectUrl, () => HttpResponse.json(changed)),
    http.put(projectUrl, put),
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('다른 편집 내용');
  expect(screen.getByLabelText(/프로젝트 제목/)).toHaveValue(
    '팀 프로젝트 내 초안',
  );
  expect(put).not.toHaveBeenCalled();
});
it('잠금 만료 뒤 저장하지 않고 초안을 보존한다', async () => {
  render();
  await start();
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), ' 초안');
  const put = vi.fn(() => HttpResponse.json(createProjectProposalFixture()));
  server.use(
    http.put(projectUrl, put),
    http.get(lockUrl, () =>
      HttpResponse.json({
        locked: false,
        lockedBy: null,
        lockedByName: null,
        lockedAt: null,
      }),
    ),
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('잠금이 만료');
  expect(screen.getByLabelText(/프로젝트 제목/)).toHaveValue(
    '팀 프로젝트 초안',
  );
  expect(put).not.toHaveBeenCalled();
});
it('저장과 후속 조회가 실패해도 폼을 제거하지 않는다', async () => {
  render();
  await start();
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), ' 초안');
  server.use(
    http.put(projectUrl, () => {
      server.use(
        http.get(projectUrl, () =>
          HttpResponse.json({ code: 'ERROR' }, { status: 500 }),
        ),
      );
      return HttpResponse.json({ code: 'ERROR' }, { status: 500 });
    }),
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByRole('alert');
  await waitFor(() => expect(client.isFetching()).toBe(0));
  expect(screen.getByLabelText(/프로젝트 제목/)).toHaveValue(
    '팀 프로젝트 초안',
  );
});
it('다른 계정이 소유한 영역은 읽기 전용이고 이름을 표시한다', async () => {
  server.use(
    http.get(lockUrl, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: 'other',
        lockedByName: '다른 팀원',
        lockedAt: '2026-09-10 10:00',
      }),
    ),
  );
  render();
  expect(
    await screen.findByText(
      '지금은 수정할 수 없어요. 다른 팀원 님이 편집 중입니다. 편집이 끝난 뒤 다시 열어 주세요.',
    ),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/프로젝트 제목/)).toBeDisabled();
});
it('작성 완료를 저장한 뒤 내용 변경 시 다시 작성 중이 된다', async () => {
  render();
  await start();
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '작성 완료' })).toBeEnabled(),
  );
  await userEvent.click(screen.getByRole('button', { name: '작성 완료' }));
  await screen.findByText('영역을 작성 완료했어요.');
  expect(screen.getByRole('button', { name: '작성 완료' })).toBeDisabled();
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), ' 수정');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '작성 완료' })).toBeEnabled(),
  );
});
it('제출한 제안서는 읽기 전용으로 연다', async () => {
  const project = createProjectProposalFixture();
  project.proposalCompletedAt = '2026-09-12T10:00:00';
  server.use(...createProjectProposalHandlers({ project }));
  render();

  expect(
    await screen.findByText('제출한 제안서는 읽기 전용입니다.'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText(/프로젝트 제목/)).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: '저장' }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '작성 완료' }),
  ).not.toBeInTheDocument();
});
it('주제 저장은 최신 다른 영역과 링크를 보존하고 kickoff는 보내지 않는다', () => {
  const baseline = createProjectProposalFixture(),
    latest = structuredClone(baseline),
    draft = proposalDraft(baseline);
  draft.title = '제목 수정';
  latest.dataConfiguration = [{ name: '다른 팀원 데이터' }];
  latest.teamOperation.kickoffRule = '최신 규칙';
  const merged = mergeProposalSection(latest, baseline, draft, 'TOPIC');
  expect(merged.dataConfiguration).toEqual(latest.dataConfiguration);
  expect(merged.externalLinks).toEqual(latest.externalLinks);
  expect(merged).not.toHaveProperty('kickoffRule');
  expect(merged).not.toHaveProperty('memberRoles');
});
it('팀 운영 방식 저장은 바뀐 킥오프 항목만 보낸다', () => {
  const baseline = createProjectProposalFixture(),
    latest = structuredClone(baseline),
    draft = proposalDraft(baseline);
  draft.memberRoles = draft.memberRoles!.map((member, index) =>
    index === 1 ? { ...member, projectRole: '기획' } : member,
  );
  const merged = mergeProposalSection(
    latest,
    baseline,
    draft,
    'TEAM_OPERATION',
  );

  expect(merged).not.toHaveProperty('kickoffRule');
  expect(merged).not.toHaveProperty('meetingSchedule');
  expect(merged.memberRoles).toEqual([
    { studentNumber: demoPartnerStudent.studentNumber, projectRole: '기획' },
  ]);
});
it('팀 운영 방식에서 서버의 빈 값과 화면의 빈 문자열을 변경으로 보지 않는다', () => {
  const baseline = createProjectProposalFixture();
  baseline.teamOperation.kickoffRule = null;
  baseline.teamOperation.members = baseline.teamOperation.members.map(
    member => ({ ...member, projectRole: null }),
  );
  const latest = structuredClone(baseline);
  const draft = proposalDraft(baseline);
  draft.projectSchedule = '10월 통합 테스트';
  const merged = mergeProposalSection(
    latest,
    baseline,
    draft,
    'TEAM_OPERATION',
  );

  expect(merged).not.toHaveProperty('kickoffRule');
  expect(merged).not.toHaveProperty('memberRoles');
  expect(merged.projectSchedule).toBe('10월 통합 테스트');
});
it('화면 저장 요청은 imageFileId를 보존하고 만료되는 imageUrl을 제외한다', async () => {
  const project = createProjectProposalFixture();
  project.screenConfiguration[0]!.imageUrl = 'https://example.com/temp';
  const put = vi.fn(async ({ request }: { request: Request }) => {
    const body = await request.json();
    expect(body.screenConfiguration[0]).toEqual({
      title: '도서 목록',
      description: '도서를 검색한다',
      imageFileId: 41,
    });
    return HttpResponse.json(project);
  });
  server.use(http.put(projectUrl, put));
  await updateProjectProposal('19', {
    ...proposalDraft(project),
    screenConfiguration: project.screenConfiguration,
  });
  expect(put).toHaveBeenCalledOnce();
});
it('미인증 API 요청과 미완료 제출을 거절한다', async () => {
  await expect(submitProjectProposal(19)).rejects.toMatchObject({
    response: { status: 409 },
  });
  useAuthStore.getState().clearSession();
  await expect(fetchProjectProposal('19')).rejects.toMatchObject({
    response: { status: 401 },
  });
});

it.each([
  ['data-composition', '데이터 1 예상 개수', '약 200권'],
  ['team-operations', '팀 규칙', '매일 진행 상황 공유'],
])('%s 영역 내용을 저장하고 복원한다', async (section, label, value) => {
  render(section);
  await waitFor(() => expect(screen.getByLabelText(label)).toBeEnabled());
  await userEvent.clear(screen.getByLabelText(label));
  await userEvent.type(screen.getByLabelText(label), value);
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');
  const saved = await fetchProjectProposal('19');
  expect(saved?.dataConfiguration[0]?.expectedCount).toBe(
    section === 'data-composition' ? value : '약 100권',
  );
  expect(saved?.screenConfiguration[0]?.description).toBe('도서를 검색한다');
  expect(saved?.screenConfiguration[0]?.imageFileId).toBe(41);
  expect(saved?.teamOperation.kickoffRule).toBe(
    section === 'team-operations' ? value : '매주 회고',
  );
});

it('저장 응답 유실 뒤 같은 내용 재시도는 충돌로 오판하지 않는다', () => {
  const baseline = createProjectProposalFixture();
  const draft = proposalDraft(baseline);
  draft.title = '이미 저장된 제목';
  const latest = { ...baseline, title: draft.title };
  expect(mergeProposalSection(latest, baseline, draft, 'TOPIC').title).toBe(
    draft.title,
  );
});

const sectionUrl = `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.SECTION(19, 'TOPIC')}`;
function topicSection(
  sections: ReturnType<typeof createProposalSectionsFixture>,
) {
  return sections.contents.find(item => item.section === 'TOPIC');
}
it('담당자 입력 없이 저장한 계정을 영역 담당자로 기록한다', async () => {
  render();
  await start();
  expect(
    screen.queryByRole('combobox', { name: '영역 담당자' }),
  ).not.toBeInTheDocument();
  await userEvent.clear(screen.getByLabelText(/프로젝트 제목/));
  await userEvent.type(
    screen.getByLabelText(/프로젝트 제목/),
    '담당자 자동 기록',
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect((await fetchProjectProposal('19'))?.title).toBe('담당자 자동 기록');
  expect(topicSection(await fetchProposalSections(19))).toMatchObject({
    assigneeUserId: demoStudent.studentNumber,
    assigneeName: demoStudent.name,
  });
});
it('저장한 팀원이 이전 담당자를 대신한다', async () => {
  const sections = createProposalSectionsFixture();
  topicSection(sections)!.assigneeUserId = demoStudent.studentNumber;
  server.use(...createProjectProposalHandlers({ sections }));
  useAuthStore.getState().setAccessToken(demoPartnerAccessToken);
  useAuthStore
    .getState()
    .setCurrentUser({ ...demoPartnerStudent, teamId: '19' });
  render();
  await start();
  await userEvent.clear(screen.getByLabelText(/프로젝트 제목/));
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), '팀원이 저장');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect(topicSection(await fetchProposalSections(19))?.assigneeUserId).toBe(
    demoPartnerStudent.studentNumber,
  );
});
it('이미 담당자로 기록된 계정은 영역 API를 다시 호출하지 않는다', async () => {
  const sections = createProposalSectionsFixture();
  topicSection(sections)!.assigneeUserId = demoStudent.studentNumber;
  server.use(...createProjectProposalHandlers({ sections }));
  const assign = vi.fn();
  server.use(http.put(sectionUrl, assign));
  render();
  await start();
  await userEvent.clear(screen.getByLabelText(/프로젝트 제목/));
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), '담당자 유지');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect(assign).not.toHaveBeenCalled();
  expect((await fetchProjectProposal('19'))?.title).toBe('담당자 유지');
});
it('담당자 기록이 실패하면 오류를 알리고 입력을 유지한다', async () => {
  server.use(
    http.put(sectionUrl, () =>
      HttpResponse.json({ code: 'INTERNAL_ERROR' }, { status: 500 }),
    ),
  );
  render();
  await start();
  await userEvent.clear(screen.getByLabelText(/프로젝트 제목/));
  await userEvent.type(screen.getByLabelText(/프로젝트 제목/), '실패한 저장');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByRole('alert')).toBeVisible();
  expect(screen.getByLabelText(/프로젝트 제목/)).toHaveValue('실패한 저장');
  expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
  expect((await fetchProjectProposal('19'))?.title).toBe('팀 프로젝트');
});

const imageUploadUrl = `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.IMAGE_UPLOAD('19')}`;
function screenImageInput(container: HTMLElement) {
  const input = container.querySelector<HTMLInputElement>('input[type="file"]');
  if (!input) throw new Error('screen image input is required');
  return input;
}
async function startScreenSection() {
  await waitFor(() =>
    expect(
      screen.getByRole('button', { name: '화면 이미지 추가' }),
    ).toBeEnabled(),
  );
}
function screenCard(name: string) {
  return within(screen.getByRole('listitem', { name }));
}
it('추가 버튼의 모달에서 이미지와 제목·설명을 입력해 화면 칸을 만든다', async () => {
  const view = render('screen-composition');
  await startScreenSection();
  await userEvent.click(
    screen.getByRole('button', { name: '화면 이미지 추가' }),
  );
  const input = screenImageInput(view.container);
  expect(input).toHaveAttribute('accept', 'image/*');
  expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();

  await userEvent.upload(
    input,
    new File(['png'], 'screen-2.png', { type: 'image/png' }),
  );
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '추가' })).toBeEnabled(),
  );
  await userEvent.type(screen.getByLabelText('제목'), '대출 화면');
  await userEvent.type(screen.getByLabelText('설명'), '대출을 신청한다');
  await userEvent.click(screen.getByRole('button', { name: '추가' }));
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  const saved = await fetchProjectProposal('19');
  expect(saved?.screenConfiguration).toHaveLength(2);
  expect(saved?.screenConfiguration[1]).toMatchObject({
    description: '대출을 신청한다',
    imageFileId: 900,
    imageUrl: 'https://files.invalid/project-images/900',
    title: '대출 화면',
  });
  expect(saved?.screenConfiguration[0]?.description).toBe('도서를 검색한다');
});
it('화면 이름과 설명은 편집 모달에서만 수정한다', async () => {
  render('screen-composition');
  await startScreenSection();
  expect(screen.queryByLabelText('설명')).not.toBeInTheDocument();

  await userEvent.click(
    screenCard('화면 1').getByRole('button', { name: '편집' }),
  );
  const description = await screen.findByLabelText('설명');
  await userEvent.clear(description);
  await userEvent.type(description, '도서를 정렬한다');
  await userEvent.click(screen.getByRole('button', { name: '적용' }));
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect(
    (await fetchProjectProposal('19'))?.screenConfiguration[0],
  ).toMatchObject({
    description: '도서를 정렬한다',
    imageFileId: 41,
    title: '도서 목록',
  });
});
it('화면 칸을 지우면 저장 본문에서도 빠진다', async () => {
  render('screen-composition');
  await startScreenSection();
  await userEvent.click(
    screenCard('화면 1').getByRole('button', { name: '삭제' }),
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect((await fetchProjectProposal('19'))?.screenConfiguration).toEqual([]);
});
it('이미지 업로드가 실패하면 알리고 기존 화면 값을 지키지 않는다', async () => {
  server.use(
    http.post(imageUploadUrl, () =>
      HttpResponse.json({ code: 'INVALID_INPUT' }, { status: 400 }),
    ),
  );
  const view = render('screen-composition');
  await startScreenSection();
  await userEvent.click(
    screen.getByRole('button', { name: '화면 이미지 추가' }),
  );
  await userEvent.upload(
    screenImageInput(view.container),
    new File(['png'], 'screen-1.png', { type: 'image/png' }),
  );

  expect(
    await screen.findByText(
      '이미지를 올리지 못했어요. 입력 내용은 그대로 두고 다시 시도해 주세요.',
    ),
  ).toBeVisible();
  expect(screen.getByRole('button', { name: '추가' })).toBeDisabled();
  expect(
    screen.queryByRole('listitem', { name: '화면 2' }),
  ).not.toBeInTheDocument();
});

it('데이터 구성은 표에서 행을 추가하고 지운다', async () => {
  render('data-composition');
  await waitFor(() =>
    expect(screen.getByLabelText('데이터 1 이름')).toBeEnabled(),
  );
  expect(
    screen.getAllByRole('columnheader').map(cell => cell.textContent),
  ).toEqual(['데이터 이름', '데이터 설명', '예상 개수', '관리']);

  await userEvent.click(screen.getByRole('button', { name: '데이터 추가' }));
  await userEvent.type(screen.getByLabelText('데이터 2 이름'), '대출 이력');
  await userEvent.click(screen.getAllByRole('button', { name: '삭제' })[0]!);
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  const saved = await fetchProjectProposal('19');
  expect(saved?.dataConfiguration).toHaveLength(1);
  expect(saved?.dataConfiguration[0]?.name).toBe('대출 이력');
});
it('데이터가 없어도 빈 행 한 개를 표에 보여준다', async () => {
  const project = createProjectProposalFixture();
  project.dataConfiguration = [];
  server.use(...createProjectProposalHandlers({ project }));
  render('data-composition');
  await waitFor(() =>
    expect(screen.getByLabelText('데이터 1 이름')).toBeEnabled(),
  );
  expect(screen.queryByLabelText('데이터 2 이름')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: '삭제' })).toHaveAttribute(
    'aria-disabled',
    'true',
  );
  expect(
    within(screen.getAllByRole('row').at(-1)!).getByRole('button', {
      name: '데이터 추가',
    }),
  ).toBeEnabled();

  await userEvent.type(screen.getByLabelText('데이터 1 이름'), '도서');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  expect((await fetchProjectProposal('19'))?.dataConfiguration).toEqual([
    { name: '도서', description: '', expectedCount: '' },
  ]);
});
it('팀원 역할은 표에서 팀원별로 입력한다', async () => {
  render('team-operations');
  await waitFor(() =>
    expect(screen.getByLabelText('OOP 데모 학생 A 역할')).toBeEnabled(),
  );
  expect(
    screen.getAllByRole('columnheader').map(cell => cell.textContent),
  ).toEqual(['팀원', '역할']);

  await userEvent.clear(screen.getByLabelText('OOP 데모 학생 B 역할'));
  await userEvent.type(screen.getByLabelText('OOP 데모 학생 B 역할'), '기획');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');

  const saved = await fetchProjectProposal('19');
  expect(
    saved?.teamOperation.members.find(
      member => member.studentNumber === demoPartnerStudent.studentNumber,
    )?.projectRole,
  ).toBe('기획');
});
