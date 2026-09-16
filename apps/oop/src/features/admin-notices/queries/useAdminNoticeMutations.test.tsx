import { API_BASE_URL } from '@aics/api-client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { HttpResponse, http } from 'msw';
import { setupServer } from 'msw/node';
import type { PropsWithChildren } from 'react';
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
import { studentNoticeKeys } from '~/features/student-notices/queries/studentNoticeKeys';

import { adminNoticeKeys } from './adminNoticeKeys';
import { useSubmitSectionAnnouncementMutation } from './useSubmitSectionAnnouncementMutation';
import { useUpdateSectionAnnouncementMutation } from './useUpdateSectionAnnouncementMutation';

import { demoNoticeProfessor } from '~/mocks/data/users';

const server = setupServer();
const clients: QueryClient[] = [];
beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
beforeEach(() => useAuthStore.setState({ currentUser: demoNoticeProfessor }));
afterEach(() => {
  server.resetHandlers();
  clients.splice(0).forEach(client => client.clear());
  useAuthStore.setState({ currentUser: null });
});
afterAll(() => server.close());
function renderMutations() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  clients.push(client);
  const hook = renderHook(
    () => ({
      create: useSubmitSectionAnnouncementMutation(),
      update: useUpdateSectionAnnouncementMutation(),
    }),
    {
      wrapper: ({ children }: PropsWithChildren) => (
        <QueryClientProvider client={client}>{children}</QueryClientProvider>
      ),
    },
  );
  return { ...hook, client };
}
const announcement = {
  id: 10,
  sectionId: 1,
  title: '제목',
  content: '본문',
  publishedAt: '2026-09-16T09:00:00',
};

it('PATCH 응답에 없는 목록의 첨부와 다른 항목은 재조회 전에 보존한다', async () => {
  server.use(
    http.patch(`${API_BASE_URL}/api/v1/announcements/10`, () =>
      HttpResponse.json({ ...announcement, content: '수정' }),
    ),
  );
  const { result, client } = renderMutations();
  const listKey = adminNoticeKeys.list(demoNoticeProfessor.id, 1);
  const attachments = [
    {
      id: 'file-1',
      fileName: '안내.pdf',
      contentType: 'application/pdf',
      sizeBytes: 12,
      url: '/files/1',
    },
  ];
  const other = { ...announcement, id: 11 };
  client.setQueryData(listKey, [{ ...announcement, attachments }, other]);
  // No active list observer/refetch can repair a dropped list-only field here.
  await act(async () => {
    await result.current.update.mutateAsync({
      announcementId: 10,
      sectionId: 1,
      content: '수정',
    });
  });
  expect(client.getQueryData(listKey)).toEqual([
    { ...announcement, content: '수정', attachments },
    other,
  ]);
  expect(client.getQueryState(listKey)?.isInvalidated).toBe(true);
});

it('PATCH는 변경 필드만 보내고 원래 사용자의 목록·상세와 학생 목록을 갱신한다', async () => {
  let finish!: () => void;
  const pending = new Promise<void>(resolve => {
    finish = resolve;
  });
  const patch = vi.fn();
  server.use(
    http.patch(
      `${API_BASE_URL}/api/v1/announcements/10`,
      async ({ request }) => {
        patch(await request.json());
        await pending;
        return HttpResponse.json({ ...announcement, content: '수정' });
      },
    ),
  );
  const { result, client } = renderMutations();
  const actorId = demoNoticeProfessor.id;
  const ownList = adminNoticeKeys.list(actorId, 1);
  const ownDetail = adminNoticeKeys.detail(actorId, 1, 10);
  const otherDetail = adminNoticeKeys.detail('other-professor', 1, 10);
  const studentList = studentNoticeKeys.sectionAnnouncements(1);
  client.setQueryData(ownList, [announcement]);
  client.setQueryData(ownDetail, announcement);
  client.setQueryData(otherDetail, announcement);
  client.setQueryData(studentList, [announcement]);
  let operation!: Promise<unknown>;
  act(() => {
    operation = result.current.update.mutateAsync({
      announcementId: 10,
      sectionId: 1,
      content: '수정',
    });
  });
  await waitFor(() =>
    expect(patch).toHaveBeenCalledExactlyOnceWith({ content: '수정' }),
  );
  act(() =>
    useAuthStore.setState({
      currentUser: { ...demoNoticeProfessor, id: 'other-professor' },
    }),
  );
  await act(async () => {
    finish();
    await operation;
  });
  expect(client.getQueryData(ownDetail)).toEqual({
    ...announcement,
    content: '수정',
  });
  expect(client.getQueryData(ownList)).toEqual([
    { ...announcement, content: '수정' },
  ]);
  expect(client.getQueryData(otherDetail)).toEqual(announcement);
  expect(client.getQueryState(studentList)?.isInvalidated).toBe(true);
});

it('없는 분반·공지 ID와 담당하지 않는 분반은 수동 mutation 호출에도 요청하지 않는다', async () => {
  const request = vi.fn();
  server.use(
    http.all('*', () => {
      request();
      return new HttpResponse(null, { status: 500 });
    }),
  );
  const { result } = renderMutations();
  await act(async () => {
    await expect(
      result.current.create.mutateAsync({
        sectionId: 0,
        title: '제목',
        content: '본문',
      }),
    ).rejects.toThrow('담당 분반');
    await expect(
      result.current.create.mutateAsync({
        sectionId: 2,
        title: '제목',
        content: '본문',
      }),
    ).rejects.toThrow('담당 분반');
    await expect(
      result.current.update.mutateAsync({
        announcementId: 'bad',
        sectionId: 1,
        title: '수정',
      }),
    ).rejects.toThrow('담당 분반');
  });
  expect(request).not.toHaveBeenCalled();
});
