import { fetchTeamKickoff } from '@aics/api-client';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAuthStore } from '../authStore';
import LoginForm from './LoginForm';

import { demoAdmin, demoStudent } from '~/mocks/data/users';

const navigate = vi.fn();
const search: { redirect?: string } = {};
const mutateAsync = vi.fn();

vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => navigate,
  useSearch: () => search,
}));

vi.mock('../queries/useLoginMutation', () => ({
  useLoginMutation: () => ({
    error: null,
    isError: false,
    isPending: false,
    mutateAsync,
  }),
}));

vi.mock('@aics/api-client', async importOriginal => ({
  ...(await importOriginal<typeof import('@aics/api-client')>()),
  fetchTeamKickoff: vi.fn(),
}));

const fetchKickoffMock = vi.mocked(fetchTeamKickoff);

beforeEach(() => {
  fetchKickoffMock.mockResolvedValue({
    id: 7,
    name: '7조',
    members: [
      {
        id: 10,
        studentNumber: demoStudent.studentNumber,
        isLeader: true,
      },
    ],
  });
});

afterEach(() => {
  vi.unstubAllEnvs();
  navigate.mockReset();
  mutateAsync.mockReset();
  fetchKickoffMock.mockReset();
  delete search.redirect;
  useAuthStore.setState({ sessionEndReason: null });
});

describe('LoginForm', () => {
  it('로그인 폼만 노출하고 개발 계정 안내는 표시하지 않는다', () => {
    render(<LoginForm />);

    expect(screen.getByRole('heading', { name: '로그인' })).toBeVisible();
    expect(screen.getByLabelText(/학번/)).toBeVisible();
    expect(screen.getByLabelText(/비밀번호/)).toBeVisible();
    expect(screen.getByRole('button', { name: '로그인' })).toBeVisible();
    expect(screen.queryByText('개발용 MSW 계정')).not.toBeInTheDocument();
    expect(screen.queryByText(/oop-demo-/)).not.toBeInTheDocument();
  });

  it('필수 로그인 정보가 비어 있으면 입력 오류를 안내한다', async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() => {
      expect(screen.getByLabelText(/학번/)).toHaveAccessibleDescription(
        '학번을 입력해 주세요.',
      );
      expect(screen.getByLabelText(/비밀번호/)).toHaveAccessibleDescription(
        '비밀번호를 입력해 주세요.',
      );
    });
  });

  it('다른 탭 로그아웃으로 세션이 끝났으면 그 이유를 한 번 안내한다', () => {
    useAuthStore.getState().clearSession('signed-out-elsewhere');
    render(<LoginForm />);

    expect(
      screen.getByText(/다른 탭이나 창에서 로그아웃되었습니다\./),
    ).toHaveAttribute('role', 'status');
    expect(useAuthStore.getState().sessionEndReason).toBeNull();
  });

  it('StrictMode에서도 세션 종료 이유를 삼키지 않고 안내한다', () => {
    useAuthStore.getState().clearSession('signed-out-elsewhere');
    render(
      <StrictMode>
        <LoginForm />
      </StrictMode>,
    );

    expect(
      screen.getByText(/다른 탭이나 창에서 로그아웃되었습니다\./),
    ).toHaveAttribute('role', 'status');
    expect(useAuthStore.getState().sessionEndReason).toBeNull();
  });

  it('팀 미배정 학생 로그인은 /student redirect보다 팀 온보딩을 우선한다', async () => {
    search.redirect = '/student';
    mutateAsync.mockResolvedValue({ ...demoStudent, teamId: null });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoStudent.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/onboarding/team' }),
    );
    expect(navigate).not.toHaveBeenCalledWith({ href: '/student' });
  });

  it('배정된 학생 로그인은 학생 redirect로 돌아간다', async () => {
    search.redirect = '/student/meetings';
    mutateAsync.mockResolvedValue({ ...demoStudent, teamId: '7' });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoStudent.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ href: '/student/meetings' }),
    );
  });

  it('팀장이 없는 배정 학생은 세션 만료 뒤 온보딩 redirect로 복구한다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'false');
    search.redirect = '/onboarding/team';
    mutateAsync.mockResolvedValue({ ...demoStudent, teamId: '7' });
    fetchKickoffMock.mockResolvedValue({
      id: 7,
      name: '7조',
      members: [
        {
          id: 10,
          studentNumber: demoStudent.studentNumber,
          isLeader: false,
        },
      ],
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoStudent.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ href: '/onboarding/team' }),
    );
  });

  it('kickoff 조회 실패 시 로그인 화면에 남지 않고 온보딩 복구 화면으로 이동한다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'false');
    search.redirect = '/student/meetings';
    mutateAsync.mockResolvedValue({ ...demoStudent, teamId: '7' });
    fetchKickoffMock.mockRejectedValue(new Error('kickoff unavailable'));
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoStudent.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/onboarding/team' }),
    );
    expect(navigate).not.toHaveBeenCalledWith({ href: '/student/meetings' });
  });

  it('실서버 모드의 공개 전 배정 학생은 학생 redirect 대신 온보딩으로 이동한다', async () => {
    vi.stubEnv('VITE_ENABLE_MSW', 'false');
    search.redirect = '/student/meetings';
    mutateAsync.mockResolvedValue({
      ...demoStudent,
      teamId: '7',
      sections: [
        {
          ...demoStudent.sections[0]!,
          contactVisibleFrom: '2099-01-01T00:00:00+09:00',
          contactVisibleUntil: null,
        },
      ],
    });
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoStudent.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'password');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({ to: '/onboarding/team' }),
    );
    expect(navigate).not.toHaveBeenCalledWith({ href: '/student/meetings' });
  });

  it('운영자 로그인 뒤 redirect 검색값으로 원래 화면에 돌아간다', async () => {
    search.redirect = '/admin/milestones/new?sectionId=1';
    mutateAsync.mockResolvedValue(demoAdmin);
    const user = userEvent.setup();
    render(<LoginForm />);

    await user.type(screen.getByLabelText(/학번/), demoAdmin.studentNumber);
    await user.type(screen.getByLabelText(/비밀번호/), 'oop-admin');
    await user.click(screen.getByRole('button', { name: '로그인' }));

    await waitFor(() =>
      expect(navigate).toHaveBeenCalledWith({
        href: '/admin/milestones/new?sectionId=1',
      }),
    );
  });
});
