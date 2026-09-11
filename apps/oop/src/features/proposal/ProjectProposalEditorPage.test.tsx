import {
  API_BASE_URL,
  ENDPOINTS,
  fetchProjectProposal,
  updateProjectProposal,
  submitProjectProposal,
} from '@aics/api-client';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
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
    expect(screen.getByLabelText('프로젝트 제목')).toBeEnabled(),
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
  await userEvent.clear(screen.getByLabelText('프로젝트 제목'));
  await userEvent.type(screen.getByLabelText('프로젝트 제목'), '새 프로젝트');
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
  await userEvent.type(screen.getByLabelText('프로젝트 제목'), ' 내 초안');
  const changed = createProjectProposalFixture();
  changed.title = '다른 팀원의 제목';
  const put = vi.fn(() => HttpResponse.json(changed));
  server.use(
    http.get(projectUrl, () => HttpResponse.json(changed)),
    http.put(projectUrl, put),
  );
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('다른 편집 내용');
  expect(screen.getByLabelText('프로젝트 제목')).toHaveValue(
    '팀 프로젝트 내 초안',
  );
  expect(put).not.toHaveBeenCalled();
});
it('잠금 만료 뒤 저장하지 않고 초안을 보존한다', async () => {
  render();
  await start();
  await userEvent.type(screen.getByLabelText('프로젝트 제목'), ' 초안');
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
  expect(screen.getByLabelText('프로젝트 제목')).toHaveValue(
    '팀 프로젝트 초안',
  );
  expect(put).not.toHaveBeenCalled();
});
it('저장과 후속 조회가 실패해도 폼을 제거하지 않는다', async () => {
  render();
  await start();
  await userEvent.type(screen.getByLabelText('프로젝트 제목'), ' 초안');
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
  expect(screen.getByLabelText('프로젝트 제목')).toHaveValue(
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
    await screen.findByText('현재 편집 중인 섹션이에요.'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('프로젝트 제목')).toBeDisabled();
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
  await userEvent.type(screen.getByLabelText('프로젝트 제목'), ' 수정');
  await userEvent.click(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('제안서를 저장했어요.');
  await waitFor(() =>
    expect(screen.getByRole('button', { name: '작성 완료' })).toBeEnabled(),
  );
});
it('모든 영역 완료 후 팀장 제출 결과를 조회하고 읽기 전용으로 전환한다', async () => {
  const sections = createProposalSectionsFixture();
  sections.contents.forEach(s => (s.completed = true));
  sections.allCompleted = true;
  server.use(...createProjectProposalHandlers({ sections }));
  render();
  const submit = await screen.findByRole('button', { name: '제안서 제출' });
  await waitFor(() => expect(submit).toBeEnabled());
  await userEvent.click(submit);
  expect(
    await screen.findByText('제출한 제안서는 읽기 전용입니다.'),
  ).toBeInTheDocument();
  expect(screen.getByLabelText('프로젝트 제목')).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: '제안서 제출' }),
  ).not.toBeInTheDocument();
});
it('팀원이 팀장과 이름이 같아도 제출 권한을 주지 않는다', async () => {
  const sections = createProposalSectionsFixture();
  sections.contents.forEach(s => (s.completed = true));
  sections.allCompleted = true;
  useAuthStore.getState().setCurrentUser({
    ...demoPartnerStudent,
    name: demoStudent.name,
    teamId: '19',
  });
  server.use(...createProjectProposalHandlers({ sections }));
  render();
  expect(
    await screen.findByRole('button', { name: '제안서 제출' }),
  ).toBeDisabled();
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
  ['screen-composition', '화면 1 설명', '새로운 화면 설명'],
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
  expect(saved?.screenConfiguration[0]?.description).toBe(
    section === 'screen-composition' ? value : '도서를 검색한다',
  );
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
