import type { MeetingRecord, TeamMeetingAction } from '@aics/core';
import { AstryxThemeProvider, ToastViewport } from '@aics/design-system';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

import TeamActionPlanPage from './TeamActionPlanPage';

import {
  getMeetingRecords,
  getTeamMeetingActions,
  resetMeetingMockData,
} from '~/mocks/data/meeting';
import { demoStudent } from '~/mocks/data/users';

const mutations = vi.hoisted(() => ({
  submitAction: vi.fn(),
  updateAction: vi.fn(),
}));
const queries = vi.hoisted(() => ({
  actions: [] as TeamMeetingAction[],
  meetingRecords: [] as MeetingRecord[],
}));

vi.mock('~/features/meeting/queries', () => ({
  useMeetingRecordsQuery: () => ({
    data: queries.meetingRecords,
    isError: false,
    isPending: false,
  }),
  useTeamMeetingActionsQuery: () => ({
    data: queries.actions,
    isError: false,
    isPending: false,
  }),
  useSubmitMeetingActionMutation: () => ({
    isPending: false,
    mutate: mutations.submitAction,
  }),
  useUpdateMeetingActionMutation: () => ({
    isPending: false,
    mutate: mutations.updateAction,
  }),
}));

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

function renderPage() {
  return render(
    <AstryxThemeProvider>
      <TeamActionPlanPage />
      <ToastViewport />
    </AstryxThemeProvider>,
  );
}

describe('TeamActionPlanPage', () => {
  beforeEach(() => {
    resetMeetingMockData();
    queries.meetingRecords = getMeetingRecords('team-07');
    queries.actions = getTeamMeetingActions('team-07');
    mutations.submitAction.mockReset();
    mutations.updateAction.mockReset();
    useAuthStore.getState().setCurrentUser(demoStudent);
  });

  afterEach(() => {
    queries.meetingRecords = [];
    queries.actions = [];
    useAuthStore.getState().clearSession();
  });

  it('팀 회의록의 모든 액션 플랜을 테이블로 모으고 상태와 담당자 필터를 제공한다', async () => {
    const user = userEvent.setup();
    renderPage();

    expect(
      screen.getByRole('heading', { name: '팀 액션 플랜' }),
    ).toBeInTheDocument();
    expect(
      screen
        .getAllByRole('columnheader')
        .map(header => header.textContent?.trim()),
    ).toEqual(['기한', '액션 항목', '담당자', '상태', '관리']);
    expect(screen.queryByRole('columnheader', { name: '회의록' })).toBeNull();
    const meetingActionLink = screen.getByRole('link', {
      name: '회의록 테이블 요구사항 정리',
    });
    expect(meetingActionLink).toHaveAttribute(
      'href',
      '/student/meetings/meeting-home-2',
    );
    await user.hover(meetingActionLink);
    expect(
      await screen.findByRole('tooltip', {
        name: '회의록: 요구사항 정리 회의',
      }),
    ).toBeInTheDocument();
    expect(screen.getByText('모바일 화면 수정 사항 반영')).toBeInTheDocument();
    expect(screen.getByText('도메인 모델 초안 작성')).toBeInTheDocument();
    expect(screen.getAllByText('진행 중').length).toBeGreaterThan(0);
    expect(screen.getAllByText('시작 전').length).toBeGreaterThan(0);
    expect(screen.getAllByText('완료').length).toBeGreaterThan(0);
    expect(
      screen.getAllByRole('img', { name: '진행 중 상태' }).length,
    ).toBeGreaterThan(0);
    expect(screen.getByLabelText('상태')).toBeInTheDocument();
    expect(screen.getAllByLabelText('담당자').length).toBeGreaterThan(0);

    await user.click(screen.getByRole('combobox', { name: '상태' }));
    await user.click(screen.getByRole('option', { name: '진행 중' }));

    expect(screen.getByText('모바일 화면 수정 사항 반영')).toBeInTheDocument();
    expect(screen.queryByText('회의록 테이블 요구사항 정리')).toBeNull();
  });

  it('수정 Dialog에서 기존 update-action 계약으로 액션 플랜을 저장한다', async () => {
    const user = userEvent.setup();
    renderPage();

    const actionRow = screen.getByRole('row', {
      name: /모바일 화면 수정 사항 반영/,
    });
    await user.click(within(actionRow).getByRole('button', { name: '수정' }));

    const dialog = screen.getByRole('dialog', { name: '액션 플랜 수정' });
    const content = within(dialog).getByRole('textbox', { name: /액션 항목/ });
    await user.clear(content);
    await user.type(content, '모바일 화면 수정 사항 반영 완료');
    await user.click(within(dialog).getByRole('button', { name: '저장' }));

    expect(mutations.updateAction).toHaveBeenCalledWith(
      {
        actionId: 'meeting-action-home-3',
        input: {
          assigneeUserId: 'student-c',
          content: '모바일 화면 수정 사항 반영 완료',
          dueDate: '2026-10-06',
        },
        meetingId: 'meeting-home-3',
        teamId: 'team-07',
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it('액션 플랜을 진행 중, 시작 전, 완료 순서로 표시한다', () => {
    const [inProgressAction, todoAction, doneAction] = queries.actions;
    queries.actions = [
      { ...doneAction!, status: 'DONE' },
      { ...todoAction!, status: 'TODO' },
      { ...inProgressAction!, status: 'IN_PROGRESS' },
    ];

    renderPage();

    expect(
      screen
        .getAllByRole('row')
        .slice(1)
        .map(row => within(row).getByRole('link').textContent),
    ).toEqual([
      inProgressAction!.content,
      todoAction!.content,
      doneAction!.content,
    ]);
  });

  it('테이블의 상태 드롭다운에서 액션 플랜 상태를 바로 변경한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(
      screen.getByRole('combobox', {
        name: '모바일 화면 수정 사항 반영 상태',
      }),
    );
    await user.click(screen.getByRole('option', { name: /완료$/ }));

    expect(mutations.updateAction).toHaveBeenCalledWith(
      {
        actionId: 'meeting-action-home-3',
        input: { status: 'DONE' },
        meetingId: 'meeting-home-3',
        teamId: 'team-07',
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });

  it('추가 Dialog는 선택한 회의록의 액션 생성 API를 호출한다', async () => {
    const user = userEvent.setup();
    renderPage();

    await user.click(screen.getByRole('button', { name: '액션 플랜 추가' }));

    const dialog = screen.getByRole('dialog', { name: '액션 플랜 추가' });
    await user.type(
      within(dialog).getByRole('textbox', { name: /액션 항목/ }),
      '최종 보고서 동의 요청 shape 정리',
    );
    await user.click(within(dialog).getByRole('combobox', { name: '담당자' }));
    await user.click(screen.getByRole('option', { name: 'OOP 데모 학생 B' }));
    await user.click(within(dialog).getByRole('button', { name: '추가' }));

    expect(mutations.submitAction).toHaveBeenCalledWith(
      {
        input: {
          assigneeUserId: 'student-b',
          content: '최종 보고서 동의 요청 shape 정리',
          dueDate: null,
        },
        meetingId: 'meeting-home-3',
        teamId: 'team-07',
      },
      expect.objectContaining({
        onError: expect.any(Function),
        onSuccess: expect.any(Function),
      }),
    );
  });
});
