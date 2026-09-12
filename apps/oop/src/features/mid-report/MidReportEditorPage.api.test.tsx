import {
  API_BASE_URL,
  ENDPOINTS,
  fetchCurrentMidReport,
} from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  cleanup,
  fireEvent,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

import MidReportEditorPage from './MidReportEditorPage';

import {
  getCurrentMidReport,
  resetMidReportMockData,
} from '~/mocks/data/midReport';
import { demoAccessToken, demoStudent } from '~/mocks/data/users';
import { handlers } from '~/mocks/handlers';
import { renderWithRouter } from '~/test/renderWithRouter';

const server = setupServer(...handlers);
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => {
  resetMidReportMockData();
  useAuthStore.getState().setAccessToken(demoAccessToken);
  useAuthStore.getState().setCurrentUser(demoStudent);
});
afterEach(() => {
  cleanup();
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  useAuthStore.getState().clearSession();
});
afterAll(() => server.close());
function renderEditor(section = 'topic') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  return renderWithRouter(
    <QueryClientProvider client={client}>
      <MidReportEditorPage section={section} />
    </QueryClientProvider>,
  );
}

it('숫자 ID 문서를 읽고 잠금 획득 후 저장·완료한 내용을 재조회한다', async () => {
  renderEditor();
  const input = await screen.findByRole('textbox', { name: '프로젝트 제목' });
  expect(input).toBeDisabled();
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: '수정한 프로젝트 제목' } });
  await waitFor(
    () =>
      expect(getCurrentMidReport().blocks[0]!.fields[0]!.value).toBe(
        '수정한 프로젝트 제목',
      ),
    { timeout: 2500 },
  );
  fireEvent.click(screen.getByRole('button', { name: '작성 완료' }));
  await screen.findByRole('button', { name: '작성 완료됨' });
  const restored = await fetchCurrentMidReport();
  expect(restored.id).toBe('701');
  expect(restored.blocks[0]!.status).toBe('COMPLETED');
  expect(restored.blocks[0]!.fields[0]!.value).toBe('수정한 프로젝트 제목');
});

it('버전 충돌은 한 번만 요청하고 입력을 보존한다', async () => {
  const save = vi.fn(() =>
    HttpResponse.json(
      { code: 'VERSION_CONFLICT', message: '최신 문서를 확인해 주세요.' },
      { status: 409 },
    ),
  );
  server.use(
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(':id', ':key')}`,
      save,
    ),
  );
  renderEditor();
  const input = await screen.findByRole('textbox', { name: '프로젝트 제목' });
  await waitFor(() => expect(input).toBeEnabled());
  fireEvent.change(input, { target: { value: '보존해야 하는 초안' } });
  await screen.findByText(/최신 문서를 확인해 주세요/);
  expect(input).toHaveValue('보존해야 하는 초안');
  expect(save).toHaveBeenCalledTimes(1);
});

it('잠금 소유권을 잃으면 저장 요청 없이 초안을 남긴다', async () => {
  renderEditor();
  const input = await screen.findByRole('textbox', { name: '프로젝트 제목' });
  await waitFor(() => expect(input).toBeEnabled());
  const save = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}/edit-locks`, () =>
      HttpResponse.json({
        locked: true,
        lockedBy: 'another-student',
        lockedByName: '다른 팀원',
        lockedAt: '2026-09-10 12:00',
      }),
    ),
    http.patch(
      `${API_BASE_URL}${ENDPOINTS.MID_REPORT.BLOCK(':id', ':key')}`,
      () => {
        save();
        return new HttpResponse(null, { status: 500 });
      },
    ),
  );
  fireEvent.change(input, { target: { value: '잠금 상실 전 초안' } });
  await waitFor(() => expect(input).toBeDisabled(), { timeout: 2500 });
  expect(input).toHaveValue('잠금 상실 전 초안');
  expect(save).not.toHaveBeenCalled();
});

it('기간이 끝난 문서는 편집과 제출을 막는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
      HttpResponse.json({
        ...getCurrentMidReport(),
        teamId: 7,
        dueDate: '2020-01-01T00:00:00+09:00',
      }),
    ),
  );
  renderEditor();
  expect(
    await screen.findByRole('textbox', { name: '프로젝트 제목' }),
  ).toBeDisabled();
  expect(
    screen.getByRole('button', { name: '편집 권한 다시 확인' }),
  ).toBeDisabled();
  expect(
    screen.queryByRole('button', { name: '제출하기' }),
  ).not.toBeInTheDocument();
});

it('401 응답에서 에디터와 잠금 획득을 노출하지 않는다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
      HttpResponse.json({ code: 'UNAUTHORIZED' }, { status: 401 }),
    ),
  );
  renderEditor();
  await screen.findByText('문서를 열 수 없어요.');
  expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
  expect(
    screen.queryByRole('button', { name: '편집 권한 다시 확인' }),
  ).not.toBeInTheDocument();
});

it('숫자 ID 변환과 편집자 이름을 검증하고 깨진 영역 응답은 거절한다', async () => {
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
      HttpResponse.json({
        ...getCurrentMidReport(),
        id: 701,
        teamId: 7,
        blocks: getCurrentMidReport().blocks.map(block => ({
          ...block,
          lastEditedBy: null,
          lastEditedByName: '편집자',
        })),
      }),
    ),
  );
  expect((await fetchCurrentMidReport()).blocks[0]!.lastEditedBy).toBe(
    '편집자',
  );
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () =>
      HttpResponse.json({
        ...getCurrentMidReport(),
        blocks: [getCurrentMidReport().blocks[0]!],
      }),
    ),
  );
  await expect(fetchCurrentMidReport()).rejects.toThrow('중간보고서 응답 형식');
});

it('imageFileId를 숫자로 저장하고 재조회한 이미지 URL을 복원하며 다른 팀 이미지는 거절한다', async () => {
  const { updateMidReportBlock } = await import('@aics/api-client');
  let report = await fetchCurrentMidReport();
  const block = report.blocks.find(block => block.key === 'gui-design')!;
  const rows = [
    {
      id: 'screen-1',
      name: '화면',
      description: '설명',
      imageFileId: 501,
      imageUrl: 'https://expired.example.test/image',
    },
  ];
  const captured = vi.fn();
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'PATCH' && request.url.endsWith('/gui-design'))
      captured(await request.clone().json());
  });
  report = await updateMidReportBlock(report.id, block.key, {
    version: report.version,
    fields: [{ ...block.fields[0]!, value: JSON.stringify(rows) }],
  });
  expect(
    JSON.parse(captured.mock.calls[0]![0].fields[0]!.value)[0],
  ).not.toHaveProperty('imageUrl');
  const restored = await fetchCurrentMidReport();
  expect(
    JSON.parse(
      restored.blocks.find(block => block.key === 'gui-design')!.fields[0]!
        .value,
    )[0],
  ).toMatchObject({
    imageFileId: 501,
    imageName: 'home.png',
    imageUrl: '/evaluation/cineflow-slide-1.png',
  });
  await expect(
    updateMidReportBlock(report.id, block.key, {
      version: report.version,
      fields: [
        {
          ...block.fields[0]!,
          value: JSON.stringify([{ ...rows[0], imageFileId: 502 }]),
        },
      ],
    }),
  ).rejects.toMatchObject({
    response: { status: 403, data: { code: 'MID_REPORT_GUI_IMAGE_NOT_OWNED' } },
  });
  server.events.removeAllListeners('request:start');
});

it('화면 이미지를 업로드해 받은 파일 ID를 저장 요청에 담는다', async () => {
  useAuthStore.getState().setCurrentUser({ ...demoStudent, teamId: '7' });
  const bodies: unknown[] = [];
  server.use(
    http.post(
      `${API_BASE_URL}${ENDPOINTS.PROJECT_PROPOSAL.IMAGE_UPLOAD('7')}`,
      () => HttpResponse.json({ fileId: 901 }),
    ),
  );
  server.events.on('request:start', async ({ request }) => {
    if (request.method === 'PATCH' && request.url.endsWith('/gui-design'))
      bodies.push(await request.clone().json());
  });
  const view = renderEditor('gui-design');
  try {
    await userEvent.click(
      await screen.findByRole('button', { name: '화면 이미지 추가' }),
    );
    const input =
      view.container.querySelector<HTMLInputElement>('input[type="file"]');
    if (!input) throw new Error('이미지 입력을 찾을 수 없습니다.');
    await userEvent.upload(
      input,
      new File(['png'], 'gui.png', { type: 'image/png' }),
    );
    await userEvent.type(await screen.findByLabelText('이름'), '대출 화면');
    await userEvent.click(screen.getByRole('button', { name: '추가' }));

    // The editor autosaves the block, so the upload result reaches the server
    // without a separate save action.
    await waitFor(() => expect(bodies).not.toHaveLength(0), { timeout: 2500 });
    const saved = JSON.parse(
      (bodies.at(-1) as { fields: { value: string }[] }).fields[0]!.value,
    );
    expect(saved.at(-1)).toMatchObject({
      imageFileId: 901,
      name: '대출 화면',
    });
  } finally {
    server.events.removeAllListeners('request:start');
    view.unmount();
  }
});
it('엔진부 테스트 케이스를 표에서 추가하고 지운다', async () => {
  const view = renderEditor('engine-design');
  try {
    await waitFor(() =>
      expect(screen.getByLabelText('테스트 1 설명')).toBeEnabled(),
    );
    expect(
      screen.getAllByRole('columnheader').map(cell => cell.textContent),
    ).toEqual(['설명', '입력값', '기대 출력값', '관리']);
    expect(
      within(screen.getAllByRole('row').at(-1)!).getByRole('button', {
        name: '테스트 케이스 추가',
      }),
    ).toBeEnabled();

    await userEvent.click(
      screen.getByRole('button', { name: '테스트 케이스 추가' }),
    );
    await waitFor(() =>
      expect(screen.getByLabelText('테스트 2 설명')).toBeInTheDocument(),
    );
    await userEvent.click(screen.getAllByRole('button', { name: '삭제' })[1]!);
    await waitFor(() =>
      expect(screen.queryByLabelText('테스트 2 설명')).not.toBeInTheDocument(),
    );
  } finally {
    view.unmount();
  }
});
it('다른 영역으로 이동하면 앞서 획득한 잠금을 해제한다', async () => {
  const released: string[] = [];
  const onRequest = ({ request }: { request: Request }) => {
    if (request.method !== 'DELETE') return;
    const sectionKey = new URL(request.url).searchParams.get('sectionKey');
    if (sectionKey) released.push(sectionKey);
  };
  server.events.on('request:start', onRequest);
  const view = renderEditor('topic');
  try {
    await waitFor(() =>
      expect(
        screen.getByRole('textbox', { name: '프로젝트 제목' }),
      ).toBeEnabled(),
    );
    view.unmount();
    await waitFor(() => expect(released).toContain('topic'));
  } finally {
    server.events.removeListener('request:start', onRequest);
  }
});
it('로그인 정보가 없으면 중간보고서와 잠금 API를 호출하지 않는다', async () => {
  useAuthStore.getState().clearSession();
  const request = vi.fn();
  server.use(
    http.get(`${API_BASE_URL}${ENDPOINTS.MID_REPORT.CURRENT}`, () => {
      request();
      return new HttpResponse(null, { status: 401 });
    }),
    http.all(`${API_BASE_URL}/edit-locks`, () => {
      request();
      return new HttpResponse(null, { status: 401 });
    }),
  );
  renderEditor();
  await screen.findByText('로그인이 필요해요.');
  expect(request).not.toHaveBeenCalled();
});
