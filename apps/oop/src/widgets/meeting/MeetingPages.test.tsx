import type { MeetingRecord } from '@aics/core';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from 'vitest';

import { useAuthStore } from '~/features/auth/authStore';

import {
  MeetingDeleteDialog,
  MeetingDetailPage,
  MeetingEditPage,
  MeetingListPage,
  MeetingNewPage,
} from './MeetingPages';
import * as styles from './MeetingPages.css';

import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const mockNavigate = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mutations = vi.hoisted(() => ({
  createRecord: vi.fn(),
  removeRecord: vi.fn(),
  updateAction: vi.fn(),
  updateRecord: vi.fn(),
}));
const queries = vi.hoisted(() => ({
  meetingRecord: null as MeetingRecord | null,
  meetingRecords: [] as MeetingRecord[],
}));
const meetingRecord: MeetingRecord = {
  id: 'meeting-1',
  teamId: 'team-07',
  title: '프로젝트 킥오프',
  heldAt: '2026-10-01T18:00:00+09:00',
  location: '공학관 301호',
  content: { type: 'doc', content: [{ type: 'paragraph' }] },
  participants: [{ userId: 'student-a', name: 'OOP 데모 학생 A' }],
  actions: [
    {
      id: 'meeting-action-1',
      meetingId: 'meeting-1',
      content: '도메인 모델 초안 작성',
      status: 'TODO',
      assignee: { userId: 'student-a', name: 'OOP 데모 학생 A' },
      dueDate: '2026-10-05',
      createdAt: '2026-10-01T19:00:00+09:00',
      updatedAt: '2026-10-01T19:00:00+09:00',
    },
  ],
  createdBy: { userId: 'student-a', name: 'OOP 데모 학생 A' },
  createdAt: '2026-10-01T19:00:00+09:00',
  updatedAt: '2026-10-01T19:00:00+09:00',
};

const originalDialogCloseDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'close',
);
const originalDialogShowModalDescriptor = Object.getOwnPropertyDescriptor(
  HTMLDialogElement.prototype,
  'showModal',
);

beforeAll(() => {
  Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
    configurable: true,
    value() {
      this.open = true;
    },
  });
  Object.defineProperty(HTMLDialogElement.prototype, 'close', {
    configurable: true,
    value() {
      this.open = false;
    },
  });
});

afterAll(() => {
  if (originalDialogShowModalDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'showModal', {
      ...originalDialogShowModalDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'showModal');
  }

  if (originalDialogCloseDescriptor) {
    Object.defineProperty(HTMLDialogElement.prototype, 'close', {
      ...originalDialogCloseDescriptor,
    });
  } else {
    Reflect.deleteProperty(HTMLDialogElement.prototype, 'close');
  }
});

vi.mock('~/features/meeting/queries', () => ({
  useSubmitMeetingRecordMutation: () => ({
    isError: false,
    isPending: false,
    mutateAsync: mutations.createRecord,
  }),
  useMeetingRecordQuery: () => ({
    data: queries.meetingRecord,
    isError: false,
    isPending: false,
  }),
  useMeetingRecordsQuery: () => ({
    data: queries.meetingRecords,
    isError: false,
    isPending: false,
  }),
  useRemoveMeetingRecordMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mutations.removeRecord,
  }),
  useUpdateMeetingActionMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mutations.updateAction,
  }),
  useUpdateMeetingRecordMutation: () => ({
    isError: false,
    isPending: false,
    mutateAsync: mutations.updateRecord,
  }),
}));

vi.mock('~/features/editor/useEditLock', () => ({
  useEditLock: () => ({ locked: false, ownerName: null, pending: false }),
}));

describe('MeetingListPage', () => {
  beforeEach(() => {
    queries.meetingRecords = [meetingRecord];
    mockNavigate.mockReset();
    useAuthStore.getState().setCurrentUser(demoStudent);
  });

  afterEach(() => {
    queries.meetingRecords = [];
    useAuthStore.getState().clearSession();
  });

  it('회의록을 단일 반응형 테이블로 표시하고 표준 링크와 행 클릭으로 연다', () => {
    const { container } = renderWithRouter(<MeetingListPage />);

    const responsiveTable = container.querySelector<HTMLElement>(
      `.${styles.responsiveListTable}`,
    );

    if (!responsiveTable) {
      throw new Error('반응형 회의록 테이블을 찾을 수 없어요.');
    }

    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      screen.getByRole('columnheader', { name: '날짜' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '제목' }),
    ).toBeInTheDocument();
    expect(
      within(responsiveTable).getByRole('columnheader', { name: '작성자' }),
    ).toBeInTheDocument();
    const titleLink = screen.getByRole('link', { name: '프로젝트 킥오프' });
    expect(titleLink).toHaveAttribute(
      'href',
      `/student/meetings/${meetingRecord.id}`,
    );
    const row = titleLink.closest('tr');
    if (!row) throw new Error('회의록 테이블 행을 찾을 수 없어요.');
    expect(row).toHaveAttribute('data-student-meeting-row');
    fireEvent.click(row);
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/student/meetings/$meetingId',
      params: { meetingId: meetingRecord.id },
    });
    expect(mockNavigate).toHaveBeenCalledTimes(1);
    expect(
      screen.getByText('참석 1명 · 액션 플랜 1건 · 공학관 301호'),
    ).toBeInTheDocument();
  });

  it('회의록이 없으면 테이블 내부에 빈 상태를 표시한다', () => {
    queries.meetingRecords = [];

    renderWithRouter(<MeetingListPage />);

    expect(screen.getByText('등록된 회의록이 없어요.')).toBeInTheDocument();
  });
});

describe('MeetingNewPage', () => {
  beforeEach(() => {
    queries.meetingRecord = null;
    useAuthStore.getState().setCurrentUser(demoStudent);
  });

  afterEach(() => {
    mutations.createRecord.mockReset();
    mutations.removeRecord.mockReset();
    mutations.updateAction.mockReset();
    mutations.updateRecord.mockReset();
    useAuthStore.getState().clearSession();
  });

  it('액션 플랜을 단일 반응형 테이블 행으로 추가하고 삭제한다', () => {
    renderWithRouter(<MeetingNewPage />);

    fireEvent.click(screen.getByRole('button', { name: '액션 추가' }));

    expect(
      screen.getByRole('columnheader', { name: '할 일' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '담당자' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '기한' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('columnheader', { name: '관리' }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText('실행할 일을 입력해 주세요.'),
    ).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      screen.getAllByRole('button', { name: 'Open calendar' }),
    ).toHaveLength(2);

    fireEvent.click(screen.getByRole('button', { name: '할 일 1 삭제' }));

    expect(
      screen.queryByPlaceholderText('실행할 일을 입력해 주세요.'),
    ).not.toBeInTheDocument();
    expect(
      screen.getByText('아직 등록된 액션 플랜이 없어요.'),
    ).toBeInTheDocument();
  });

  it('exposes the rich-text toolbar and calendar-based meeting properties', () => {
    renderWithRouter(<MeetingNewPage />);

    const route = screen.getByRole('navigation', { name: '회의록 경로' });
    expect(within(route).getByRole('link', { name: '회의록' })).toHaveAttribute(
      'href',
      '/student/meetings',
    );
    expect(within(route).getByText('새 회의록')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: '회의록 목록으로 돌아가기' }),
    ).toHaveTextContent('목록으로');
    expect(screen.getByRole('button', { name: '굵게' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '기울임' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '취소선' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '소제목' })).toBeInTheDocument();
    expect(screen.getByText('회의 일자')).toBeInTheDocument();
    expect(screen.getByText('참석자')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Open calendar' }),
    ).toBeInTheDocument();
  });

  it('loads existing actions and saves their removal with the meeting record', async () => {
    queries.meetingRecord = meetingRecord;
    mutations.updateRecord.mockResolvedValue(meetingRecord);

    renderWithRouter(<MeetingEditPage meetingId={meetingRecord.id} />);

    const route = screen.getByRole('navigation', { name: '회의록 경로' });
    expect(
      within(route).getByRole('link', { name: meetingRecord.title }),
    ).toHaveAttribute('href', `/student/meetings/${meetingRecord.id}`);
    expect(within(route).getByText('수정')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: '회의록 상세로 돌아가기' }),
    ).toHaveTextContent('상세로');
    expect(
      screen.getByDisplayValue('도메인 모델 초안 작성'),
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '할 일 1 삭제' }));
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(mutations.updateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ actions: [] }),
          meetingId: meetingRecord.id,
          teamId: meetingRecord.teamId,
        }),
      );
    });
  });

  it('편집 대상이 바뀌면 새 회의록 본문을 표시하고 해당 ID로 저장한다', async () => {
    const firstRecord: MeetingRecord = {
      ...meetingRecord,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '첫 번째 회의 내용' }],
          },
        ],
      },
    };
    const secondRecord: MeetingRecord = {
      ...meetingRecord,
      id: 'meeting-2',
      title: '두 번째 회의',
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [{ type: 'text', text: '두 번째 회의 내용' }],
          },
        ],
      },
    };
    queries.meetingRecord = firstRecord;
    mutations.updateRecord.mockResolvedValue(secondRecord);
    const { rerender } = renderWithRouter(
      <MeetingEditPage meetingId={firstRecord.id} />,
    );

    expect(screen.getByText('첫 번째 회의 내용')).toBeInTheDocument();

    queries.meetingRecord = secondRecord;
    rerender(<MeetingEditPage meetingId={secondRecord.id} />);

    await waitFor(() => {
      expect(screen.getByText('두 번째 회의 내용')).toBeInTheDocument();
      expect(screen.queryByText('첫 번째 회의 내용')).not.toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(mutations.updateRecord).toHaveBeenCalledWith(
        expect.objectContaining({
          input: expect.objectContaining({ content: secondRecord.content }),
          meetingId: secondRecord.id,
          teamId: secondRecord.teamId,
        }),
      );
    });
  });
});

function MeetingDeleteDialogHarness({ onConfirm }: { onConfirm: () => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <AstryxThemeProvider>
      <button onClick={() => setIsOpen(true)} type='button'>
        회의록 삭제
      </button>
      <MeetingDeleteDialog
        isError={false}
        isOpen={isOpen}
        isPending={false}
        onClose={() => setIsOpen(false)}
        onConfirm={onConfirm}
        record={meetingRecord}
      />
    </AstryxThemeProvider>
  );
}

describe('MeetingDetailPage', () => {
  afterEach(() => {
    queries.meetingRecord = null;
    mutations.removeRecord.mockReset();
    mockNavigate.mockReset();
    useAuthStore.getState().clearSession();
  });

  it('회의록 정보를 보여주고 취소와 삭제 확인을 처리한다', async () => {
    const onConfirm = vi.fn();
    const user = userEvent.setup();

    render(<MeetingDeleteDialogHarness onConfirm={onConfirm} />);
    const trigger = screen.getByRole('button', { name: '회의록 삭제' });
    await user.click(trigger);

    const dialog = await screen.findByRole('dialog', {
      name: '회의록 삭제 확인',
    });
    expect(
      within(dialog).getByRole('heading', {
        name: '이 회의록을 삭제할까요?',
      }),
    ).toBeInTheDocument();
    expect(within(dialog).getByText(meetingRecord.title)).toBeInTheDocument();
    expect(within(dialog).getByRole('button', { name: '취소' })).toHaveFocus();

    await user.click(within(dialog).getByRole('button', { name: '취소' }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    expect(trigger).toHaveFocus();

    await user.click(trigger);
    await user.click(
      within(
        await screen.findByRole('dialog', { name: '회의록 삭제 확인' }),
      ).getByRole('button', { name: '삭제' }),
    );
    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('작성자와 이름이 같아도 사용자 ID가 다르면 삭제 버튼을 숨긴다', () => {
    queries.meetingRecord = meetingRecord;
    useAuthStore.getState().setCurrentUser({
      ...demoStudent,
      id: 'student-b',
      name: meetingRecord.createdBy.name,
      currentTeam: {
        ...demoStudent.currentTeam!,
        members: demoStudent.currentTeam!.members.map(member => ({
          ...member,
          isLeader: false,
        })),
      },
    });

    renderWithRouter(<MeetingDetailPage meetingId={meetingRecord.id} />);

    expect(
      screen.queryByRole('button', { name: '삭제' }),
    ).not.toBeInTheDocument();
  });

  it('현재 위치와 목록 링크를 상단에 두고 수정 액션은 상세 하단에 둔다', () => {
    queries.meetingRecord = meetingRecord;
    useAuthStore.getState().setCurrentUser(demoStudent);

    renderWithRouter(<MeetingDetailPage meetingId={meetingRecord.id} />);

    const route = screen.getByRole('navigation', { name: '회의록 경로' });
    expect(within(route).getByRole('link', { name: '회의록' })).toHaveAttribute(
      'href',
      '/student/meetings',
    );
    expect(within(route).getByText(meetingRecord.title)).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(
      screen.getByRole('link', { name: '회의록 목록으로 돌아가기' }),
    ).toHaveAttribute('href', '/student/meetings');

    const metadata = screen.getByText(/최초 작성/);
    const editButton = screen.getByRole('button', { name: '수정' });
    expect(metadata.closest('footer')).toContainElement(editButton);
    expect(screen.getByText('작성된 회의 내용이 없어요.')).toBeInTheDocument();
    expect(screen.getAllByRole('table')).toHaveLength(1);
    expect(
      within(screen.getByRole('table')).getByRole('row', {
        name: /도메인 모델 초안 작성/,
      }),
    ).toBeInTheDocument();
  });

  it('회의록 삭제 성공을 toast로 알리고 목록으로 이동한다', async () => {
    const user = userEvent.setup();
    queries.meetingRecord = meetingRecord;
    useAuthStore.getState().setCurrentUser(demoStudent);
    mutations.removeRecord.mockImplementation(
      (
        _input: unknown,
        options?: {
          onSuccess?: () => void;
        },
      ) => options?.onSuccess?.(),
    );

    renderWithRouter(
      <AstryxThemeProvider>
        <ToastViewport>
          <MeetingDetailPage meetingId={meetingRecord.id} />
        </ToastViewport>
      </AstryxThemeProvider>,
    );

    await user.click(screen.getByRole('button', { name: '삭제' }));
    const dialog = await screen.findByRole('dialog', {
      name: '회의록 삭제 확인',
    });
    await user.click(within(dialog).getByRole('button', { name: '삭제' }));

    expect(await screen.findByText('회의록을 삭제했어요.')).toBeInTheDocument();
    expect(mockNavigate).toHaveBeenCalledWith({
      to: '/student/meetings',
    });
  });
});
