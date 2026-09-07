import type {
  TeamAssignmentProjection,
  TeamMemberContactListResponse,
} from '@aics/core';
import { AstryxThemeProvider } from '@aics/design-system';
import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import LiveFirstMeeting from './LiveFirstMeeting';

import { assignedFixture } from '~/mocks/data/teamAssignment';
import { renderWithRouter } from '~/test/renderWithRouter';

const mockNavigate = vi.hoisted(() => vi.fn());
const mockContactsQuery = vi.hoisted(() => vi.fn());
const mockLeaderMutation = vi.hoisted(() => vi.fn());

vi.mock('@tanstack/react-router', async importOriginal => {
  const actual =
    await importOriginal<typeof import('@tanstack/react-router')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../queries', async importOriginal => {
  const actual = await importOriginal<typeof import('../queries')>();
  return {
    ...actual,
    useClaimTeamLeaderMutation: () => mockLeaderMutation(),
    useTeamMemberContactsQuery: (...args: unknown[]) =>
      mockContactsQuery(...args),
  };
});

const contacts: TeamMemberContactListResponse['contents'] = [
  {
    studentNumber: '20261002',
    name: '연락처 윤 새봄',
    email: 'saebom@example.com',
    phone: '010-2026-1002',
    isLeader: false,
  },
  {
    studentNumber: '20261001',
    name: '연락처 한 가온',
    email: 'gaon@example.com',
    phone: '010-2026-1001',
    isLeader: false,
  },
];

function createProjection(teamId = '4'): TeamAssignmentProjection {
  const projection = assignedFixture('firstMeeting');
  return {
    ...projection,
    assignedTeam: projection.assignedTeam
      ? {
          ...projection.assignedTeam,
          id: teamId,
          members: projection.assignedTeam.members.map(member => ({
            ...member,
            // A legacy projection must never win over the contacts response.
            phoneNumber: '010-legacy-fixture',
          })),
        }
      : undefined,
  };
}

function renderFirstMeeting(projection = createProjection()) {
  return renderWithRouter(
    <AstryxThemeProvider>
      <LiveFirstMeeting projection={projection} />
    </AstryxThemeProvider>,
  );
}

beforeEach(() => {
  window.history.replaceState({}, '', '/');
  mockNavigate.mockReset();
  mockContactsQuery.mockReset();
  mockLeaderMutation.mockReset();
  mockContactsQuery.mockReturnValue({
    data: contacts,
    isError: false,
    isPending: false,
    isSuccess: true,
  });
  mockLeaderMutation.mockReturnValue({
    isPending: false,
    mutateAsync: vi.fn().mockResolvedValue(undefined),
  });
});

describe('FirstMeeting', () => {
  it('연락처 응답을 학번으로 병합하고 projection의 기존 전화번호는 노출하지 않는다', () => {
    renderFirstMeeting();

    const firstMemberRow = screen.getByText('연락처 한 가온').closest('tr');
    if (!firstMemberRow) throw new Error('첫 번째 팀원 행을 찾을 수 없습니다.');

    expect(
      within(firstMemberRow).getByRole('button', {
        name: '010-2026-1001 복사',
      }),
    ).toBeInTheDocument();
    expect(screen.queryByText(/legacy-fixture/)).not.toBeInTheDocument();
    expect(screen.getByText('연락처 윤 새봄')).toBeInTheDocument();
  });

  it('팀 ID가 없거나 양의 정수 문자열이 아니면 연락처 조회 대신 선행조건을 표시한다', () => {
    renderFirstMeeting(createProjection('synthetic-team-4'));

    expect(
      screen.getByText('팀 연락처를 불러오기 위한 팀 ID를 확인할 수 없습니다.'),
    ).toBeInTheDocument();
    expect(mockContactsQuery).toHaveBeenCalledWith('synthetic-team-4', true);
  });

  it('연락처 조회 중에는 별도 대기 상태를 표시한다', () => {
    mockContactsQuery.mockReturnValue({
      data: undefined,
      isError: false,
      isPending: true,
    });

    renderFirstMeeting();

    expect(
      screen.getByText('팀원 연락처를 불러오는 중입니다.'),
    ).toBeInTheDocument();
  });

  it('연락처 조회에 실패하면 별도 오류 상태를 표시한다', () => {
    mockContactsQuery.mockReturnValue({
      data: undefined,
      isError: true,
      isPending: false,
    });

    renderFirstMeeting();

    expect(
      screen.getByText('팀원 연락처를 불러오지 못했습니다.'),
    ).toBeInTheDocument();
  });

  it('팀장 선점 확인 후 배정된 팀 ID를 전달한다', async () => {
    const user = userEvent.setup();
    const mutateAsync = vi.fn().mockResolvedValue(undefined);
    mockLeaderMutation.mockReturnValue({ isPending: false, mutateAsync });

    renderFirstMeeting();

    await user.click(screen.getByRole('button', { name: '내가 팀장입니다' }));
    const dialog = screen.getByRole('dialog', { name: '팀장 확정 확인' });
    await user.click(within(dialog).getByRole('button', { name: '확정' }));

    await vi.waitFor(() => expect(mutateAsync).toHaveBeenCalledOnce());
    expect(mutateAsync).toHaveBeenCalledWith({
      input: { teamId: '4' },
    });
  });
  it.each([401, 403, 409, 500])(
    '선점 %s 실패 시 성공으로 이동하지 않고 오류를 알린다',
    async status => {
      const user = userEvent.setup();
      mockLeaderMutation.mockReturnValue({
        isPending: false,
        mutateAsync: vi
          .fn()
          .mockRejectedValue({ isAxiosError: true, response: { status } }),
      });
      renderFirstMeeting();
      await user.click(screen.getByRole('button', { name: '내가 팀장입니다' }));
      await user.click(
        within(screen.getByRole('dialog')).getByRole('button', {
          name: '확정',
        }),
      );
      expect(await screen.findByRole('alert')).toBeVisible();
      expect(mockNavigate).not.toHaveBeenCalled();
    },
  );

  it('공개 기간이 끝나면 기존 연락처는 숨기고 팀장 선정은 허용한다', () => {
    renderWithRouter(
      <AstryxThemeProvider>
        <LiveFirstMeeting
          projection={createProjection()}
          contactVisibility='closed'
        />
      </AstryxThemeProvider>,
    );
    expect(mockContactsQuery).toHaveBeenCalledWith('4', false);
    expect(screen.queryByText(/010-2026/)).not.toBeInTheDocument();
    expect(
      screen.getByText('팀원 연락처 공개 기간이 종료됐어요.'),
    ).toBeVisible();
    expect(
      screen.getByRole('button', { name: '내가 팀장입니다' }),
    ).toBeEnabled();
  });
});
