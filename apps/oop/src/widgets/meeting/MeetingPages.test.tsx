import type { MeetingRecord } from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
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
  MeetingNewPage,
} from './MeetingPages';

import { demoStudent } from '~/mocks/data/users';
import { renderWithRouter } from '~/test/renderWithRouter';

const mutations = vi.hoisted(() => ({
  createRecord: vi.fn(),
  removeRecord: vi.fn(),
  updateAction: vi.fn(),
  updateRecord: vi.fn(),
}));
const queries = vi.hoisted(() => ({
  meetingRecord: null as MeetingRecord | null,
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
  useRemoveMeetingRecordMutation: () => ({
    isError: false,
    isPending: false,
    mutate: mutations.removeRecord,
  }),
  useUpdateMeetingActionMutation: () => ({
    isError: false,
    isPending: false,
    mutateAsync: mutations.updateAction,
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

  it('adds an accessible action-plan table row and removes it', () => {
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

describe('MeetingDetailPage 삭제 모달', () => {
  afterEach(() => {
    queries.meetingRecord = null;
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
});
